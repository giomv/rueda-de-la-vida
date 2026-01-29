'use server';

import { createClient } from '@/lib/supabase/server';
import type {
  MonthlyBudget,
  MonthlyBudgetWithAccounts,
  BudgetAccount,
  Expense,
  ExpenseWithRelations,
  BudgetAccountWithActual,
  BudgetSummary,
  AnnualSummary,
  CreateExpenseInput,
  UpdateExpenseInput,
  CreateAccountInput,
  UpdateAccountInput,
  BudgetCategory,
} from '@/lib/types/finances';

// ============================================
// EXPENSE ACTIONS
// ============================================

// Create expense (auto-assigns to "Otros" if no account specified)
export async function createExpense(input: CreateExpenseInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Parse year/month from date
  const [year, month] = input.date.split('-').map(Number);

  // Get or create monthly budget to ensure "Otros" account exists
  const budget = await getOrCreateMonthlyBudget(year, month);

  let accountId = input.budget_account_id;
  if (!accountId) {
    // Find the "Otros" account
    const otros = budget.accounts.find((a) => a.is_otros_account);
    accountId = otros?.id || null;
  }

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      user_id: user.id,
      amount: input.amount,
      date: input.date,
      budget_account_id: accountId,
      domain_id: input.domain_id || null,
      note: input.note || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Expense;
}

// Update expense
export async function updateExpense(expenseId: string, input: UpdateExpenseInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const updates: Record<string, unknown> = {};
  if (input.amount !== undefined) updates.amount = input.amount;
  if (input.date !== undefined) updates.date = input.date;
  if (input.budget_account_id !== undefined) updates.budget_account_id = input.budget_account_id;
  if (input.domain_id !== undefined) updates.domain_id = input.domain_id;
  if (input.note !== undefined) updates.note = input.note;

  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', expenseId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Expense;
}

// Delete expense
export async function deleteExpense(expenseId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

// Get single expense
export async function getExpense(expenseId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data: expense, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', expenseId)
    .eq('user_id', user.id)
    .single();

  if (error) throw new Error(error.message);

  // Fetch related data
  const [accountResult, domainResult] = await Promise.all([
    expense.budget_account_id
      ? supabase.from('budget_accounts').select('*').eq('id', expense.budget_account_id).single()
      : { data: null },
    expense.domain_id
      ? supabase.from('life_domains').select('id, name, icon').eq('id', expense.domain_id).single()
      : { data: null },
  ]);

  return {
    ...expense,
    budget_account: accountResult.data || null,
    domain: domainResult.data || null,
  } as ExpenseWithRelations;
}

// Get expenses for date range
export async function getExpensesForDateRange(startDate: string, endDate: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // First get the expenses
  const { data: expenses, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  if (!expenses || expenses.length === 0) return [];

  // Get unique account IDs and domain IDs
  const accountIds = [...new Set(expenses.map(e => e.budget_account_id).filter(Boolean))];
  const domainIds = [...new Set(expenses.map(e => e.domain_id).filter(Boolean))];

  // Fetch related data
  const [accountsResult, domainsResult] = await Promise.all([
    accountIds.length > 0
      ? supabase.from('budget_accounts').select('*').in('id', accountIds)
      : { data: [] },
    domainIds.length > 0
      ? supabase.from('life_domains').select('id, name, icon').in('id', domainIds)
      : { data: [] },
  ]);

  const accountsMap = new Map((accountsResult.data || []).map(a => [a.id, a]));
  const domainsMap = new Map((domainsResult.data || []).map(d => [d.id, d]));

  // Combine data
  return expenses.map(expense => ({
    ...expense,
    budget_account: expense.budget_account_id ? accountsMap.get(expense.budget_account_id) || null : null,
    domain: expense.domain_id ? domainsMap.get(expense.domain_id) || null : null,
  })) as ExpenseWithRelations[];
}

// Get expenses by account
export async function getExpensesByAccount(
  accountId: string,
  startDate?: string,
  endDate?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  let query = supabase
    .from('expenses')
    .select('*')
    .eq('user_id', user.id)
    .eq('budget_account_id', accountId);

  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);

  const { data: expenses, error } = await query
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  if (!expenses || expenses.length === 0) return [];

  // Fetch the account and domains
  const domainIds = [...new Set(expenses.map(e => e.domain_id).filter(Boolean))];

  const [accountResult, domainsResult] = await Promise.all([
    supabase.from('budget_accounts').select('*').eq('id', accountId).single(),
    domainIds.length > 0
      ? supabase.from('life_domains').select('id, name, icon').in('id', domainIds)
      : { data: [] },
  ]);

  const account = accountResult.data || null;
  const domainsMap = new Map((domainsResult.data || []).map(d => [d.id, d]));

  return expenses.map(expense => ({
    ...expense,
    budget_account: account,
    domain: expense.domain_id ? domainsMap.get(expense.domain_id) || null : null,
  })) as ExpenseWithRelations[];
}

// ============================================
// BUDGET ACTIONS
// ============================================

// Get or create monthly budget (creates budget + "Otros" if needed)
export async function getOrCreateMonthlyBudget(
  year: number,
  month: number
): Promise<MonthlyBudgetWithAccounts> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Try to get existing budget
  const { data: existing } = await supabase
    .from('monthly_budgets')
    .select(`
      *,
      accounts:budget_accounts(*)
    `)
    .eq('user_id', user.id)
    .eq('year', year)
    .eq('month', month)
    .single();

  if (existing) {
    return existing as MonthlyBudgetWithAccounts;
  }

  // Create new budget (trigger auto-creates "Otros" account)
  const { data: newBudget, error } = await supabase
    .from('monthly_budgets')
    .insert({
      user_id: user.id,
      year,
      month,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Fetch accounts (should have "Otros" from trigger)
  const { data: accounts } = await supabase
    .from('budget_accounts')
    .select('*')
    .eq('monthly_budget_id', newBudget.id)
    .order('order_position');

  return {
    ...newBudget,
    accounts: accounts || [],
  } as MonthlyBudgetWithAccounts;
}

// Get monthly budget (returns null if doesn't exist)
export async function getMonthlyBudget(
  year: number,
  month: number
): Promise<MonthlyBudgetWithAccounts | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data, error } = await supabase
    .from('monthly_budgets')
    .select(`
      *,
      accounts:budget_accounts(*)
    `)
    .eq('user_id', user.id)
    .eq('year', year)
    .eq('month', month)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data as MonthlyBudgetWithAccounts | null;
}

// Create budget account
export async function createBudgetAccount(budgetId: string, input: CreateAccountInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Verify ownership
  const { data: budget } = await supabase
    .from('monthly_budgets')
    .select('id')
    .eq('id', budgetId)
    .eq('user_id', user.id)
    .single();

  if (!budget) throw new Error('Presupuesto no encontrado');

  // Get max order position for this category
  const { data: maxOrder } = await supabase
    .from('budget_accounts')
    .select('order_position')
    .eq('monthly_budget_id', budgetId)
    .eq('category', input.category)
    .order('order_position', { ascending: false })
    .limit(1)
    .single();

  const { data, error } = await supabase
    .from('budget_accounts')
    .insert({
      monthly_budget_id: budgetId,
      name: input.name,
      category: input.category,
      base_budget: input.base_budget,
      order_position: (maxOrder?.order_position ?? -1) + 1,
      is_otros_account: false,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as BudgetAccount;
}

// Update budget account
export async function updateBudgetAccount(accountId: string, input: UpdateAccountInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Verify ownership through monthly_budget
  const { data: account } = await supabase
    .from('budget_accounts')
    .select(`
      id,
      is_otros_account,
      monthly_budget:monthly_budgets(user_id)
    `)
    .eq('id', accountId)
    .single();

  const monthlyBudget = account?.monthly_budget as { user_id: string } | { user_id: string }[] | null;
  const budgetUserId = Array.isArray(monthlyBudget) ? monthlyBudget[0]?.user_id : monthlyBudget?.user_id;

  if (!account || budgetUserId !== user.id) {
    throw new Error('Cuenta no encontrada');
  }

  // Don't allow changing "Otros" account name
  if (account.is_otros_account && input.name) {
    throw new Error('No se puede cambiar el nombre de la cuenta Otros');
  }

  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.category !== undefined) updates.category = input.category;
  if (input.base_budget !== undefined) updates.base_budget = input.base_budget;
  if (input.order_position !== undefined) updates.order_position = input.order_position;

  const { data, error } = await supabase
    .from('budget_accounts')
    .update(updates)
    .eq('id', accountId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as BudgetAccount;
}

// Delete budget account (reassign expenses to "Otros")
export async function deleteBudgetAccount(accountId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Get account with budget info
  const { data: account } = await supabase
    .from('budget_accounts')
    .select(`
      id,
      monthly_budget_id,
      is_otros_account,
      monthly_budget:monthly_budgets(user_id)
    `)
    .eq('id', accountId)
    .single();

  const monthlyBudget = account?.monthly_budget as { user_id: string } | { user_id: string }[] | null;
  const budgetUserId = Array.isArray(monthlyBudget) ? monthlyBudget[0]?.user_id : monthlyBudget?.user_id;

  if (!account || budgetUserId !== user.id) {
    throw new Error('Cuenta no encontrada');
  }

  if (account.is_otros_account) {
    throw new Error('No se puede eliminar la cuenta Otros');
  }

  // Find "Otros" account in the same budget
  const { data: otros } = await supabase
    .from('budget_accounts')
    .select('id')
    .eq('monthly_budget_id', account.monthly_budget_id)
    .eq('is_otros_account', true)
    .single();

  // Reassign expenses to "Otros"
  if (otros) {
    await supabase
      .from('expenses')
      .update({ budget_account_id: otros.id })
      .eq('budget_account_id', accountId);
  }

  // Delete the account
  const { error } = await supabase
    .from('budget_accounts')
    .delete()
    .eq('id', accountId);

  if (error) throw new Error(error.message);
}

// Reorder budget accounts
export async function reorderBudgetAccounts(accountIds: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  await Promise.all(
    accountIds.map((id, index) =>
      supabase
        .from('budget_accounts')
        .update({ order_position: index })
        .eq('id', id)
    )
  );
}

// ============================================
// AGGREGATION ACTIONS
// ============================================

// Get budget summary with KPIs
export async function getBudgetSummary(year: number, month: number): Promise<BudgetSummary | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Get budget with accounts
  const budget = await getMonthlyBudget(year, month);
  if (!budget) return null;

  // Calculate date range for the month
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  // Get expenses for this month
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, budget_account_id')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate);

  // Calculate actuals per account
  const actualsByAccount = new Map<string, { sum: number; count: number }>();
  (expenses || []).forEach((expense) => {
    const accountId = expense.budget_account_id;
    if (accountId) {
      const current = actualsByAccount.get(accountId) || { sum: 0, count: 0 };
      actualsByAccount.set(accountId, {
        sum: current.sum + Number(expense.amount),
        count: current.count + 1,
      });
    }
  });

  // Build accounts with actuals
  const accountsWithActual: BudgetAccountWithActual[] = budget.accounts.map((account) => {
    const actuals = actualsByAccount.get(account.id) || { sum: 0, count: 0 };
    const base = Number(account.base_budget);
    const actual = actuals.sum;
    return {
      ...account,
      base_budget: base,
      actual,
      remaining: base - actual,
      transactionCount: actuals.count,
    };
  });

  // Calculate totals
  const totals = {
    income: { base: 0, actual: 0 },
    expense: { base: 0, actual: 0 },
    savings: { base: 0, actual: 0 },
  };

  accountsWithActual.forEach((account) => {
    const category = account.category.toLowerCase() as 'income' | 'expense' | 'savings';
    totals[category].base += account.base_budget;
    totals[category].actual += account.actual;
  });

  // "Me quedan" = INCOME (base) - SAVINGS (base) - EXPENSES (actual)
  const remaining = totals.income.base - totals.savings.base - totals.expense.actual;
  const isOverspending = remaining < 0;

  return {
    budget,
    accounts: accountsWithActual,
    totals,
    remaining,
    isOverspending,
  };
}

// Get annual summary
export async function getAnnualSummary(year: number): Promise<AnnualSummary> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Get all budgets for the year
  const { data: budgets } = await supabase
    .from('monthly_budgets')
    .select(`
      *,
      accounts:budget_accounts(*)
    `)
    .eq('user_id', user.id)
    .eq('year', year)
    .order('month');

  // Get all expenses for the year
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, date, budget_account_id')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate);

  // Build month summaries
  const months: AnnualSummary['months'] = [];
  const accountTotals = new Map<string, { name: string; actual: number; category: BudgetCategory }>();
  const monthlyTrend: { month: number; actual: number }[] = [];

  for (let month = 1; month <= 12; month++) {
    const budget = budgets?.find((b) => b.month === month);
    const monthExpenses = (expenses || []).filter((e) => {
      const expMonth = parseInt(e.date.split('-')[1], 10);
      return expMonth === month;
    });

    const monthActualTotal = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    monthlyTrend.push({ month, actual: monthActualTotal });

    if (budget) {
      const accounts = (budget as MonthlyBudgetWithAccounts).accounts || [];

      // Calculate actuals per account for this month
      const actualsByAccount = new Map<string, number>();
      monthExpenses.forEach((expense) => {
        if (expense.budget_account_id) {
          const current = actualsByAccount.get(expense.budget_account_id) || 0;
          actualsByAccount.set(expense.budget_account_id, current + Number(expense.amount));
        }
      });

      const monthTotals = {
        income: { base: 0, actual: 0 },
        expense: { base: 0, actual: 0 },
        savings: { base: 0, actual: 0 },
      };

      accounts.forEach((account: BudgetAccount) => {
        const category = account.category.toLowerCase() as 'income' | 'expense' | 'savings';
        const base = Number(account.base_budget);
        const actual = actualsByAccount.get(account.id) || 0;

        monthTotals[category].base += base;
        monthTotals[category].actual += actual;

        // Track account totals for top accounts
        const existing = accountTotals.get(account.name);
        if (existing) {
          existing.actual += actual;
        } else {
          accountTotals.set(account.name, {
            name: account.name,
            actual,
            category: account.category,
          });
        }
      });

      const remaining = monthTotals.income.base - monthTotals.savings.base - monthTotals.expense.actual;

      months.push({
        month,
        income: monthTotals.income,
        expense: monthTotals.expense,
        savings: monthTotals.savings,
        remaining,
      });
    } else {
      months.push({
        month,
        income: { base: 0, actual: 0 },
        expense: { base: 0, actual: monthActualTotal },
        savings: { base: 0, actual: 0 },
        remaining: -monthActualTotal,
      });
    }
  }

  // Calculate year totals
  const totals = months.reduce(
    (acc, m) => ({
      income: {
        base: acc.income.base + m.income.base,
        actual: acc.income.actual + m.income.actual,
      },
      expense: {
        base: acc.expense.base + m.expense.base,
        actual: acc.expense.actual + m.expense.actual,
      },
      savings: {
        base: acc.savings.base + m.savings.base,
        actual: acc.savings.actual + m.savings.actual,
      },
      remaining: acc.remaining + m.remaining,
    }),
    {
      income: { base: 0, actual: 0 },
      expense: { base: 0, actual: 0 },
      savings: { base: 0, actual: 0 },
      remaining: 0,
    }
  );

  // Get top 5 expense accounts
  const topAccounts = Array.from(accountTotals.values())
    .filter((a) => a.category === 'EXPENSE' && a.actual > 0)
    .sort((a, b) => b.actual - a.actual)
    .slice(0, 5);

  return {
    year,
    months,
    totals,
    topAccounts,
    monthlyTrend,
  };
}

// Get top expense accounts for a year
export async function getTopExpenseAccounts(year: number, limit = 5) {
  const summary = await getAnnualSummary(year);
  return summary.topAccounts.slice(0, limit);
}

// Get monthly trend for a year
export async function getMonthlyTrend(year: number) {
  const summary = await getAnnualSummary(year);
  return summary.monthlyTrend;
}

// Get accounts for a specific month (for expense form dropdown)
export async function getAccountsForMonth(year: number, month: number) {
  const budget = await getOrCreateMonthlyBudget(year, month);
  return budget.accounts.filter((a) => a.category === 'EXPENSE').sort((a, b) => {
    // Put "Otros" at the end
    if (a.is_otros_account) return 1;
    if (b.is_otros_account) return -1;
    return a.order_position - b.order_position;
  });
}

// Copy budget from previous month
export async function copyBudgetFromPreviousMonth(year: number, month: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Calculate previous month
  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear = year - 1;
  }

  // Get previous month's budget
  const prevBudget = await getMonthlyBudget(prevYear, prevMonth);
  if (!prevBudget || prevBudget.accounts.length <= 1) {
    throw new Error('No hay presupuesto del mes anterior para copiar');
  }

  // Get or create current month's budget
  const currentBudget = await getOrCreateMonthlyBudget(year, month);

  // Copy non-Otros accounts from previous month
  const accountsToCopy = prevBudget.accounts.filter((a) => !a.is_otros_account);

  for (const account of accountsToCopy) {
    await createBudgetAccount(currentBudget.id, {
      name: account.name,
      category: account.category,
      base_budget: Number(account.base_budget),
    });
  }

  // Return updated budget
  return getMonthlyBudget(year, month);
}
