'use server';

import { createClient } from '@/lib/supabase/server';
import { getOrCreateMonthlyBudget } from '@/lib/actions/finances-actions';
import type {
  SavingsMovement,
  SavingsMovementWithRelations,
  CreateSavingsInput,
  UpdateSavingsInput,
} from '@/lib/types/dashboard';

// ============================================
// SAVINGS MOVEMENT ACTIONS
// ============================================

export async function createSavingsMovement(input: CreateSavingsInput): Promise<SavingsMovement> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Parse year/month from date for budget lookup
  const [year, month] = input.date.split('-').map(Number);

  // Determine the account ID
  let accountId = input.budget_account_id;

  // Validate account is SAVINGS category if provided
  if (accountId) {
    const { data: account } = await supabase
      .from('budget_accounts')
      .select('category')
      .eq('id', accountId)
      .single();

    if (account?.category !== 'SAVINGS') {
      throw new Error('La cuenta debe ser de tipo Ahorros');
    }
  } else {
    // Auto-assign to SAVINGS "Otros" account when none selected
    const budget = await getOrCreateMonthlyBudget(year, month);
    const otrosSavings = budget.accounts.find(
      (a) => a.is_otros_account && a.category === 'SAVINGS'
    );
    accountId = otrosSavings?.id || null;
  }

  const { data, error } = await supabase
    .from('savings_movements')
    .insert({
      user_id: user.id,
      amount: input.amount,
      date: input.date,
      budget_account_id: accountId,
      domain_id: input.domain_id || null,
      goal_id: input.goal_id || null,
      note: input.note || null,
      movement_type: input.movement_type,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as SavingsMovement;
}

export async function updateSavingsMovement(
  id: string,
  input: UpdateSavingsInput
): Promise<SavingsMovement> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Validate account is SAVINGS category if provided
  if (input.budget_account_id) {
    const { data: account } = await supabase
      .from('budget_accounts')
      .select('category')
      .eq('id', input.budget_account_id)
      .single();

    if (account?.category !== 'SAVINGS') {
      throw new Error('La cuenta debe ser de tipo Ahorros');
    }
  }

  const updates: Record<string, unknown> = {};
  if (input.amount !== undefined) updates.amount = input.amount;
  if (input.date !== undefined) updates.date = input.date;
  if (input.budget_account_id !== undefined) updates.budget_account_id = input.budget_account_id;
  if (input.domain_id !== undefined) updates.domain_id = input.domain_id;
  if (input.goal_id !== undefined) updates.goal_id = input.goal_id;
  if (input.note !== undefined) updates.note = input.note;
  if (input.movement_type !== undefined) updates.movement_type = input.movement_type;

  const { data, error } = await supabase
    .from('savings_movements')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as SavingsMovement;
}

export async function deleteSavingsMovement(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { error } = await supabase
    .from('savings_movements')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

export async function getSavingsMovement(id: string): Promise<SavingsMovementWithRelations> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data: movement, error } = await supabase
    .from('savings_movements')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) throw new Error(error.message);

  // Fetch related data
  const [accountResult, domainResult, goalResult] = await Promise.all([
    movement.budget_account_id
      ? supabase.from('budget_accounts').select('id, name').eq('id', movement.budget_account_id).single()
      : { data: null },
    movement.domain_id
      ? supabase.from('life_domains').select('id, name, icon').eq('id', movement.domain_id).single()
      : { data: null },
    movement.goal_id
      ? supabase.from('goals').select('id, title').eq('id', movement.goal_id).single()
      : { data: null },
  ]);

  return {
    ...movement,
    budget_account: accountResult.data || null,
    domain: domainResult.data || null,
    goal: goalResult.data || null,
  } as SavingsMovementWithRelations;
}

export async function getSavingsForDateRange(
  startDate: string,
  endDate: string
): Promise<SavingsMovementWithRelations[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data: movements, error } = await supabase
    .from('savings_movements')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  if (!movements || movements.length === 0) return [];

  // Get unique IDs
  const accountIds = [...new Set(movements.map(m => m.budget_account_id).filter(Boolean))];
  const domainIds = [...new Set(movements.map(m => m.domain_id).filter(Boolean))];
  const goalIds = [...new Set(movements.map(m => m.goal_id).filter(Boolean))];

  // Fetch related data in parallel
  const [accountsResult, domainsResult, goalsResult] = await Promise.all([
    accountIds.length > 0
      ? supabase.from('budget_accounts').select('id, name').in('id', accountIds)
      : { data: [] },
    domainIds.length > 0
      ? supabase.from('life_domains').select('id, name, icon').in('id', domainIds)
      : { data: [] },
    goalIds.length > 0
      ? supabase.from('goals').select('id, title').in('id', goalIds)
      : { data: [] },
  ]);

  const accountsMap = new Map((accountsResult.data || []).map(a => [a.id, a]));
  const domainsMap = new Map((domainsResult.data || []).map(d => [d.id, d]));
  const goalsMap = new Map((goalsResult.data || []).map(g => [g.id, g]));

  return movements.map(movement => ({
    ...movement,
    budget_account: movement.budget_account_id ? accountsMap.get(movement.budget_account_id) || null : null,
    domain: movement.domain_id ? domainsMap.get(movement.domain_id) || null : null,
    goal: movement.goal_id ? goalsMap.get(movement.goal_id) || null : null,
  })) as SavingsMovementWithRelations[];
}

export async function getSavingsTotalForDateRange(
  startDate: string,
  endDate: string,
  domainId?: string | null,
  goalId?: string | null
): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  let query = supabase
    .from('savings_movements')
    .select('amount, movement_type')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate);

  if (domainId) query = query.eq('domain_id', domainId);
  if (goalId) query = query.eq('goal_id', goalId);

  const { data: movements, error } = await query;

  if (error) throw new Error(error.message);

  return (movements || []).reduce((sum, m) => {
    const amount = Number(m.amount);
    return m.movement_type === 'deposit' ? sum + amount : sum - amount;
  }, 0);
}
