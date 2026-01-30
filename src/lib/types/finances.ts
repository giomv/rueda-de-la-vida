// Finances types

export type BudgetCategory = 'INCOME' | 'EXPENSE' | 'SAVINGS';

// Entity types
export interface MonthlyBudget {
  id: string;
  user_id: string;
  year: number;
  month: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetAccount {
  id: string;
  monthly_budget_id: string;
  name: string;
  category: BudgetCategory;
  base_budget: number;
  order_position: number;
  is_otros_account: boolean;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  date: string;
  budget_account_id: string | null;
  domain_id: string | null;
  goal_id: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

// Composite types
export interface MonthlyBudgetWithAccounts extends MonthlyBudget {
  accounts: BudgetAccount[];
}

export interface ExpenseWithRelations extends Expense {
  budget_account?: BudgetAccount | null;
  domain?: { id: string; name: string; icon: string | null } | null;
  goal?: { id: string; title: string } | null;
}

export interface BudgetAccountWithActual extends BudgetAccount {
  actual: number;
  remaining: number;
  transactionCount: number;
}

export interface BudgetSummary {
  budget: MonthlyBudget;
  accounts: BudgetAccountWithActual[];
  totals: {
    income: { base: number; actual: number };
    expense: { base: number; actual: number };
    savings: { base: number; actual: number };
  };
  remaining: number;
  isOverspending: boolean;
}

export interface AnnualSummary {
  year: number;
  months: {
    month: number;
    income: { base: number; actual: number };
    expense: { base: number; actual: number };
    savings: { base: number; actual: number };
    remaining: number;
  }[];
  totals: {
    income: { base: number; actual: number };
    expense: { base: number; actual: number };
    savings: { base: number; actual: number };
    remaining: number;
  };
  topAccounts: { name: string; actual: number; category: BudgetCategory }[];
  monthlyTrend: { month: number; actual: number }[];
}

// Input types
export interface CreateExpenseInput {
  amount: number;
  date: string;
  budget_account_id?: string | null;
  domain_id?: string | null;
  goal_id?: string | null;
  note?: string | null;
}

export interface UpdateExpenseInput {
  amount?: number;
  date?: string;
  budget_account_id?: string | null;
  domain_id?: string | null;
  goal_id?: string | null;
  note?: string | null;
}

export interface CreateAccountInput {
  name: string;
  category: BudgetCategory;
  base_budget: number;
}

export interface UpdateAccountInput {
  name?: string;
  category?: BudgetCategory;
  base_budget?: number;
  order_position?: number;
}

// Constants
export const BUDGET_CATEGORIES: { key: BudgetCategory; label: string; color: string }[] = [
  { key: 'INCOME', label: 'Ingresos', color: 'green' },
  { key: 'EXPENSE', label: 'Gastos', color: 'red' },
  { key: 'SAVINGS', label: 'Ahorros', color: 'blue' },
];

export const FINANCES_TABS: { key: string; label: string; href: string }[] = [
  { key: 'gastos', label: 'Agregar', href: '/finanzas/gastos' },
  { key: 'historial', label: 'Historial', href: '/finanzas/historial' },
  { key: 'presupuesto', label: 'Presupuesto', href: '/finanzas/presupuesto' },
  { key: 'anual', label: 'Anual', href: '/finanzas/anual' },
];

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
