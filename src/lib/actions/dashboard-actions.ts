'use server';

import { createClient } from '@/lib/supabase/server';
import type {
  DashboardFilters,
  ActionsSummary,
  FinanceSummary,
  DashboardSummary,
  DomainProgress,
  GoalProgress,
  FocusItem,
  PendingItem,
  ActivityFeedItem,
  ActivityFeedResponse,
  DashboardCheckinInput,
  Celebration,
  ProgressStatus,
  ActionGridData,
  WeekBucket,
  DailyGridData,
  WeeklyGridData,
  MonthlyGridData,
  OnceGridData,
} from '@/lib/types/dashboard';
import type { LifeDomain, Goal, WeeklyCheckin, FrequencyType } from '@/lib/types';

// ===== HELPER FUNCTIONS =====

function getLastDayOfMonth(year: number, month: number): string {
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

function getISOWeek(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(
    ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
  );
}

function calculateScheduledCount(
  activities: { frequency_type: string }[],
  year: number,
  month: number
): number {
  const daysInMonth = new Date(year, month, 0).getDate();
  const weeksInMonth = Math.ceil(daysInMonth / 7);

  return activities.reduce((sum, a) => {
    switch (a.frequency_type) {
      case 'DAILY':
        return sum + daysInMonth;
      case 'WEEKLY':
        return sum + weeksInMonth;
      case 'MONTHLY':
        return sum + 1;
      case 'ONCE':
        return sum + 1;
      default:
        return sum;
    }
  }, 0);
}

function calculateWeeklyConsistency(
  completions: { date: string }[],
  year: number,
  month: number
): number {
  if (!completions.length) return 0;

  const weeksWithActivity = new Set(
    completions.map(c => getISOWeek(new Date(c.date)))
  );

  const daysInMonth = new Date(year, month, 0).getDate();
  const totalWeeks = Math.ceil(daysInMonth / 7);

  return Math.round((weeksWithActivity.size / totalWeeks) * 100);
}

function getProgressStatus(completionRate: number): ProgressStatus {
  if (completionRate >= 80) return 'on-track';
  if (completionRate >= 50) return 'at-risk';
  return 'behind';
}

// ===== MAIN DASHBOARD QUERIES =====

/**
 * Get aggregated dashboard data
 */
export async function getDashboardSummary(filters: DashboardFilters): Promise<DashboardSummary> {
  const [actions, finance, focus] = await Promise.all([
    getActionsSummary(filters),
    getFinanceSummary(filters),
    getFocusItems(filters.year, filters.month),
  ]);
  return { actions, finance, focus };
}

/**
 * Get actions summary for the month
 */
export async function getActionsSummary(filters: DashboardFilters): Promise<ActionsSummary> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { year, month, domainId, goalId } = filters;
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = getLastDayOfMonth(year, month);

  // Get activities with optional filters
  let query = supabase
    .from('lifeplan_activities')
    .select('id, frequency_type, domain_id, goal_id')
    .eq('user_id', user.id)
    .eq('is_archived', false);

  if (domainId) query = query.eq('domain_id', domainId);
  if (goalId) query = query.eq('goal_id', goalId);

  const { data: activities } = await query;

  if (!activities?.length) {
    return { scheduled: 0, completed: 0, completionRate: 0, weeklyConsistency: 0 };
  }

  // Get completions for this month
  const { data: completions } = await supabase
    .from('activity_completions')
    .select('activity_id, period_key, completed, date')
    .in('activity_id', activities.map(a => a.id))
    .eq('completed', true)
    .gte('date', startDate)
    .lte('date', endDate);

  // Calculate metrics
  const scheduled = calculateScheduledCount(activities, year, month);
  const completed = completions?.length || 0;
  const completionRate = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;
  const weeklyConsistency = calculateWeeklyConsistency(completions || [], year, month);

  return { scheduled, completed, completionRate, weeklyConsistency };
}

/**
 * Get finance summary for the month
 */
export async function getFinanceSummary(filters: DashboardFilters): Promise<FinanceSummary> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { year, month, domainId, goalId } = filters;
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = getLastDayOfMonth(year, month);

  // Get base income from budget
  const { data: budget } = await supabase
    .from('monthly_budgets')
    .select('id')
    .eq('user_id', user.id)
    .eq('year', year)
    .eq('month', month)
    .single();

  let baseIncome = 0;
  if (budget) {
    const { data: incomeAccounts } = await supabase
      .from('budget_accounts')
      .select('base_budget')
      .eq('monthly_budget_id', budget.id)
      .eq('category', 'INCOME');
    baseIncome = incomeAccounts?.reduce((sum, a) => sum + Number(a.base_budget), 0) || 0;
  }

  // Get real expenses
  let expenseQuery = supabase
    .from('expenses')
    .select('amount')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate);

  if (domainId) expenseQuery = expenseQuery.eq('domain_id', domainId);
  if (goalId) expenseQuery = expenseQuery.eq('goal_id', goalId);

  const { data: expenses } = await expenseQuery;
  const realSpent = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

  // Get real savings
  let savingsQuery = supabase
    .from('savings_movements')
    .select('amount, movement_type')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate);

  if (domainId) savingsQuery = savingsQuery.eq('domain_id', domainId);
  if (goalId) savingsQuery = savingsQuery.eq('goal_id', goalId);

  const { data: savings } = await savingsQuery;
  const realSaved = savings?.reduce((sum, s) => {
    const amount = Number(s.amount);
    return s.movement_type === 'deposit' ? sum + amount : sum - amount;
  }, 0) || 0;

  const remaining = baseIncome - realSpent - realSaved;

  return { baseIncome, realSpent, realSaved, remaining };
}

// ===== DOMAIN/GOAL PROGRESS =====

/**
 * Get progress for all domains
 */
export async function getDomainsProgress(filters: DashboardFilters): Promise<DomainProgress[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { year, month } = filters;
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = getLastDayOfMonth(year, month);

  // Get domains
  const { data: domains } = await supabase
    .from('life_domains')
    .select('*')
    .eq('user_id', user.id)
    .order('order_position');

  if (!domains?.length) return [];

  // Get activities per domain
  const { data: activities } = await supabase
    .from('lifeplan_activities')
    .select('id, domain_id, frequency_type')
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .in('domain_id', domains.map(d => d.id));

  // Get completions
  const activityIds = activities?.map(a => a.id) || [];
  const { data: completions } = activityIds.length > 0
    ? await supabase
        .from('activity_completions')
        .select('activity_id, completed')
        .in('activity_id', activityIds)
        .eq('completed', true)
        .gte('date', startDate)
        .lte('date', endDate)
    : { data: [] };

  // Get expenses per domain
  const { data: expenses } = await supabase
    .from('expenses')
    .select('domain_id, amount')
    .eq('user_id', user.id)
    .in('domain_id', domains.map(d => d.id))
    .gte('date', startDate)
    .lte('date', endDate);

  // Get savings per domain
  const { data: savings } = await supabase
    .from('savings_movements')
    .select('domain_id, amount, movement_type')
    .eq('user_id', user.id)
    .in('domain_id', domains.map(d => d.id))
    .gte('date', startDate)
    .lte('date', endDate);

  // Aggregate per domain
  return domains.map(domain => {
    const domainActivities = activities?.filter(a => a.domain_id === domain.id) || [];
    const domainCompletions = completions?.filter(c =>
      domainActivities.some(a => a.id === c.activity_id)
    ) || [];

    const actionsTotal = calculateScheduledCount(domainActivities, year, month);
    const actionsCompleted = domainCompletions.length;
    const completionRate = actionsTotal > 0 ? Math.round((actionsCompleted / actionsTotal) * 100) : 0;

    const spent = expenses
      ?.filter(e => e.domain_id === domain.id)
      .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

    const saved = savings
      ?.filter(s => s.domain_id === domain.id)
      .reduce((sum, s) => s.movement_type === 'deposit' ? sum + Number(s.amount) : sum - Number(s.amount), 0) || 0;

    const status = getProgressStatus(completionRate);

    return {
      domain,
      completionRate,
      spent,
      saved,
      status,
      actionsCompleted,
      actionsTotal,
    };
  });
}

/**
 * Get progress for all goals
 */
export async function getGoalsProgress(filters: DashboardFilters): Promise<GoalProgress[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { year, month, domainId } = filters;
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = getLastDayOfMonth(year, month);

  // Get goals
  let goalsQuery = supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_archived', false);

  if (domainId) goalsQuery = goalsQuery.eq('domain_id', domainId);

  const { data: goals } = await goalsQuery;

  if (!goals?.length) return [];

  // Get domains for reference
  const domainIds = [...new Set(goals.map(g => g.domain_id).filter(Boolean))];
  const { data: domains } = domainIds.length > 0
    ? await supabase.from('life_domains').select('*').in('id', domainIds)
    : { data: [] };
  const domainsMap = new Map((domains || []).map(d => [d.id, d]));

  // Get activities per goal
  const { data: activities } = await supabase
    .from('lifeplan_activities')
    .select('id, goal_id, frequency_type')
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .in('goal_id', goals.map(g => g.id));

  // Get completions
  const activityIds = activities?.map(a => a.id) || [];
  const { data: completions } = activityIds.length > 0
    ? await supabase
        .from('activity_completions')
        .select('activity_id, completed')
        .in('activity_id', activityIds)
        .eq('completed', true)
        .gte('date', startDate)
        .lte('date', endDate)
    : { data: [] };

  // Get expenses per goal
  const { data: expenses } = await supabase
    .from('expenses')
    .select('goal_id, amount')
    .eq('user_id', user.id)
    .in('goal_id', goals.map(g => g.id))
    .gte('date', startDate)
    .lte('date', endDate);

  // Get savings per goal
  const { data: savings } = await supabase
    .from('savings_movements')
    .select('goal_id, amount, movement_type')
    .eq('user_id', user.id)
    .in('goal_id', goals.map(g => g.id))
    .gte('date', startDate)
    .lte('date', endDate);

  // Aggregate per goal
  return goals.map(goal => {
    const goalActivities = activities?.filter(a => a.goal_id === goal.id) || [];
    const goalCompletions = completions?.filter(c =>
      goalActivities.some(a => a.id === c.activity_id)
    ) || [];

    const actionsTotal = calculateScheduledCount(goalActivities, year, month);
    const actionsCompleted = goalCompletions.length;
    const completionRate = actionsTotal > 0 ? Math.round((actionsCompleted / actionsTotal) * 100) : 0;

    const spent = expenses
      ?.filter(e => e.goal_id === goal.id)
      .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

    const saved = savings
      ?.filter(s => s.goal_id === goal.id)
      .reduce((sum, s) => s.movement_type === 'deposit' ? sum + Number(s.amount) : sum - Number(s.amount), 0) || 0;

    return {
      goal,
      domain: goal.domain_id ? domainsMap.get(goal.domain_id) || null : null,
      completionRate,
      spent,
      saved,
      actionsCompleted,
      actionsTotal,
    };
  });
}

// ===== FOCUS MANAGEMENT =====

/**
 * Get focus items for a month
 */
export async function getFocusItems(year: number, month: number): Promise<FocusItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = getLastDayOfMonth(year, month);

  const { data: focusItems } = await supabase
    .from('dashboard_focus')
    .select(`
      *,
      domain:life_domains(*),
      goal:goals(*)
    `)
    .eq('user_id', user.id)
    .eq('year', year)
    .eq('month', month)
    .order('order_position');

  if (!focusItems?.length) return [];

  // For each focus, get top 3 actions and finance summary
  const result: FocusItem[] = [];

  for (const item of focusItems) {
    // Get top actions based on focus type
    let actionsQuery = supabase
      .from('lifeplan_activities')
      .select('id, title')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .limit(3);

    if (item.focus_type === 'domain' && item.domain_id) {
      actionsQuery = actionsQuery.eq('domain_id', item.domain_id);
    } else if (item.focus_type === 'goal' && item.goal_id) {
      actionsQuery = actionsQuery.eq('goal_id', item.goal_id);
    }

    const { data: activities } = await actionsQuery;

    // Get completions for these activities
    const activityIds = activities?.map(a => a.id) || [];
    const { data: completions } = activityIds.length > 0
      ? await supabase
          .from('activity_completions')
          .select('activity_id, completed')
          .in('activity_id', activityIds)
          .eq('completed', true)
          .gte('date', startDate)
          .lte('date', endDate)
      : { data: [] };

    const completedIds = new Set(completions?.map(c => c.activity_id) || []);

    const topActions = (activities || []).map(a => ({
      id: a.id,
      title: a.title,
      completed: completedIds.has(a.id),
    }));

    // Get expenses
    let expenseQuery = supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate);

    if (item.focus_type === 'domain' && item.domain_id) {
      expenseQuery = expenseQuery.eq('domain_id', item.domain_id);
    } else if (item.focus_type === 'goal' && item.goal_id) {
      expenseQuery = expenseQuery.eq('goal_id', item.goal_id);
    }

    const { data: expenses } = await expenseQuery;
    const spent = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

    // Get savings
    let savingsQuery = supabase
      .from('savings_movements')
      .select('amount, movement_type')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate);

    if (item.focus_type === 'domain' && item.domain_id) {
      savingsQuery = savingsQuery.eq('domain_id', item.domain_id);
    } else if (item.focus_type === 'goal' && item.goal_id) {
      savingsQuery = savingsQuery.eq('goal_id', item.goal_id);
    }

    const { data: savings } = await savingsQuery;
    const saved = savings?.reduce((sum, s) =>
      s.movement_type === 'deposit' ? sum + Number(s.amount) : sum - Number(s.amount), 0) || 0;

    result.push({
      id: item.id,
      type: item.focus_type,
      domain: item.domain || null,
      goal: item.goal || null,
      topActions,
      spent,
      saved,
    });
  }

  return result;
}

/**
 * Add a focus item
 */
export async function setFocusItem(
  year: number,
  month: number,
  type: 'domain' | 'goal',
  targetId: string
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Check max 3 focus items
  const { count } = await supabase
    .from('dashboard_focus')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('year', year)
    .eq('month', month);

  if ((count || 0) >= 3) {
    throw new Error('Maximo 3 focos por mes');
  }

  const { error } = await supabase
    .from('dashboard_focus')
    .insert({
      user_id: user.id,
      year,
      month,
      focus_type: type,
      domain_id: type === 'domain' ? targetId : null,
      goal_id: type === 'goal' ? targetId : null,
      order_position: count || 0,
    });

  if (error) throw new Error(error.message);
}

/**
 * Remove a focus item
 */
export async function removeFocusItem(focusId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { error } = await supabase
    .from('dashboard_focus')
    .delete()
    .eq('id', focusId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

// ===== SMART PENDING =====

/**
 * Get smart pending items
 */
export async function getSmartPendingItems(limit = 5): Promise<PendingItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const items: PendingItem[] = [];

  // 1. Expenses in "Otros" account (unclassified)
  const { data: otrosAccounts } = await supabase
    .from('budget_accounts')
    .select('id')
    .eq('is_otros_account', true);

  if (otrosAccounts?.length) {
    const otrosIds = otrosAccounts.map(a => a.id);
    const { count: otrosCount } = await supabase
      .from('expenses')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .in('budget_account_id', otrosIds);

    if (otrosCount && otrosCount > 0) {
      items.push({
        type: 'unclassified_expense',
        id: 'otros-expenses',
        title: 'Clasifica gastos en "Otros"',
        description: `Tienes ${otrosCount} gasto${otrosCount > 1 ? 's' : ''} sin categoria especifica`,
        ctaLabel: 'Clasificar',
        ctaHref: '/finanzas/historial?account=otros',
      });
    }
  }

  // 2. Savings without goal
  const { count: unlinkedSavingsCount } = await supabase
    .from('savings_movements')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id)
    .is('goal_id', null);

  if (unlinkedSavingsCount && unlinkedSavingsCount > 0) {
    items.push({
      type: 'savings_no_goal',
      id: 'unlinked-savings',
      title: 'Ahorros sin meta',
      description: 'Vincula tus ahorros a una meta',
      ctaLabel: 'Vincular',
      ctaHref: '/dashboard/vincular?type=savings',
    });
  }

  // 3. Goals without actions
  const { data: allGoals } = await supabase
    .from('goals')
    .select('id, title')
    .eq('user_id', user.id)
    .eq('is_archived', false);

  const { data: activitiesWithGoal } = await supabase
    .from('lifeplan_activities')
    .select('goal_id')
    .eq('user_id', user.id)
    .not('goal_id', 'is', null);

  const goalIdsWithActions = new Set(activitiesWithGoal?.map(a => a.goal_id));
  const goalsNoActions = allGoals?.filter(g => !goalIdsWithActions.has(g.id));

  if (goalsNoActions?.length) {
    items.push({
      type: 'goal_without_actions',
      id: goalsNoActions[0].id,
      title: 'Meta sin acciones',
      description: `"${goalsNoActions[0].title}" no tiene acciones`,
      ctaLabel: 'Agregar accion',
      ctaHref: `/mi-plan/actividad/nueva?goal=${goalsNoActions[0].id}`,
    });
  }

  // 4. Activities without domain
  const { count: activitiesNoDomainCount } = await supabase
    .from('lifeplan_activities')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .is('domain_id', null);

  if (activitiesNoDomainCount && activitiesNoDomainCount > 0) {
    items.push({
      type: 'activity_no_domain',
      id: 'unlinked-activities',
      title: 'Acciones sin dominio',
      description: 'Organiza tus acciones por dominio',
      ctaLabel: 'Organizar',
      ctaHref: '/mi-plan/metas?filter=uncategorized',
    });
  }

  return items.slice(0, limit);
}

// ===== ACTIVITY FEED =====

/**
 * Get recent activity feed
 */
export async function getRecentActivity(
  filters: DashboardFilters,
  limit = 10,
  cursor?: string
): Promise<ActivityFeedResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { year, month, domainId, goalId } = filters;
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = getLastDayOfMonth(year, month);

  const feed: ActivityFeedItem[] = [];

  // Get activities for filtering
  let activitiesQuery = supabase
    .from('lifeplan_activities')
    .select('id, title, domain_id, goal_id')
    .eq('user_id', user.id);

  if (domainId) activitiesQuery = activitiesQuery.eq('domain_id', domainId);
  if (goalId) activitiesQuery = activitiesQuery.eq('goal_id', goalId);

  const { data: activities } = await activitiesQuery;
  const activityIds = activities?.map(a => a.id) || [];
  const activityMap = new Map(activities?.map(a => [a.id, a]) || []);

  // Fetch more items than needed to properly determine hasMore
  const fetchLimit = limit + 1;

  // Completed actions
  if (activityIds.length > 0) {
    let completionsQuery = supabase
      .from('activity_completions')
      .select('id, activity_id, completed_at')
      .in('activity_id', activityIds)
      .eq('completed', true)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('completed_at', { ascending: false })
      .limit(fetchLimit);

    if (cursor) {
      completionsQuery = completionsQuery.lt('completed_at', cursor);
    }

    const { data: completions } = await completionsQuery;

    completions?.forEach(c => {
      const activity = activityMap.get(c.activity_id);
      feed.push({
        id: c.id,
        type: 'action_completed',
        title: activity?.title || 'Accion completada',
        timestamp: c.completed_at || new Date().toISOString(),
      });
    });
  }

  // Expenses
  let expensesQuery = supabase
    .from('expenses')
    .select('id, amount, note, created_at')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('created_at', { ascending: false })
    .limit(fetchLimit);

  if (domainId) expensesQuery = expensesQuery.eq('domain_id', domainId);
  if (goalId) expensesQuery = expensesQuery.eq('goal_id', goalId);
  if (cursor) expensesQuery = expensesQuery.lt('created_at', cursor);

  const { data: expenses } = await expensesQuery;

  expenses?.forEach(e => {
    feed.push({
      id: e.id,
      type: 'expense_added',
      title: e.note || 'Gasto registrado',
      amount: Number(e.amount),
      timestamp: e.created_at,
    });
  });

  // Savings
  let savingsQuery = supabase
    .from('savings_movements')
    .select('id, amount, note, movement_type, created_at')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('created_at', { ascending: false })
    .limit(fetchLimit);

  if (domainId) savingsQuery = savingsQuery.eq('domain_id', domainId);
  if (goalId) savingsQuery = savingsQuery.eq('goal_id', goalId);
  if (cursor) savingsQuery = savingsQuery.lt('created_at', cursor);

  const { data: savingsData } = await savingsQuery;

  savingsData?.forEach(s => {
    feed.push({
      id: s.id,
      type: 'savings_added',
      title: s.note || (s.movement_type === 'deposit' ? 'Ahorro registrado' : 'Retiro registrado'),
      amount: Number(s.amount),
      timestamp: s.created_at,
    });
  });

  // Sort by timestamp descending
  const sortedFeed = feed.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Take only the requested limit
  const items = sortedFeed.slice(0, limit);
  const hasMore = sortedFeed.length > limit;
  const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].timestamp : null;

  return { items, nextCursor, hasMore };
}

// ===== WEEKLY CHECK-IN =====

/**
 * Save dashboard check-in
 */
export async function saveDashboardCheckin(
  weekStart: string,
  data: DashboardCheckinInput
): Promise<WeeklyCheckin> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data: result, error } = await supabase
    .from('weekly_checkins')
    .upsert({
      user_id: user.id,
      week_start: weekStart,
      what_worked: data.whatWorked,
      what_to_adjust: data.whatToAdjust,
      satisfaction_score: data.satisfactionScore,
      mood_emoji: data.moodEmoji,
    }, {
      onConflict: 'user_id,week_start',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return result as WeeklyCheckin;
}

/**
 * Get last check-in
 */
export async function getLastCheckin(): Promise<WeeklyCheckin | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data } = await supabase
    .from('weekly_checkins')
    .select('*')
    .eq('user_id', user.id)
    .order('week_start', { ascending: false })
    .limit(1)
    .single();

  return data as WeeklyCheckin | null;
}

// ===== CELEBRATIONS =====

/**
 * Get celebration data
 */
export async function getCelebration(): Promise<Celebration | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Check for streak
  const { data: recentCompletions } = await supabase
    .from('activity_completions')
    .select('date')
    .in('activity_id', (await supabase
      .from('lifeplan_activities')
      .select('id')
      .eq('user_id', user.id)
      .eq('frequency_type', 'DAILY')
    ).data?.map(a => a.id) || [])
    .eq('completed', true)
    .gte('date', new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .lte('date', todayStr)
    .order('date', { ascending: false });

  if (recentCompletions?.length) {
    // Calculate streak
    const uniqueDates = [...new Set(recentCompletions.map(c => c.date))].sort().reverse();
    let streak = 0;
    let currentDate = new Date(todayStr);

    for (const dateStr of uniqueDates) {
      const expectedDate = currentDate.toISOString().split('T')[0];
      if (dateStr === expectedDate) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    if (streak >= 3) {
      return {
        type: 'streak',
        value: streak,
        message: `${streak} dias consecutivos activo`,
      };
    }
  }

  return null;
}

// ===== DOMAINS & GOALS FOR SELECTORS =====

/**
 * Get all domains for the user
 */
export async function getDomains(): Promise<LifeDomain[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data: domains } = await supabase
    .from('life_domains')
    .select('*')
    .eq('user_id', user.id)
    .order('order_position');

  return domains || [];
}

/**
 * Get all goals for the user
 */
export async function getGoals(domainId?: string | null): Promise<Goal[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  let query = supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_archived', false);

  if (domainId) query = query.eq('domain_id', domainId);

  const { data: goals } = await query.order('created_at', { ascending: false });

  return goals || [];
}

/**
 * Check if user has an active life plan
 */
export async function hasActivePlan(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: odyssey } = await supabase
    .from('odysseys')
    .select('active_plan_number')
    .eq('user_id', user.id)
    .not('active_plan_number', 'is', null)
    .limit(1)
    .single();

  return !!odyssey;
}

// ===== ACTION GRID DATA =====

/**
 * Calculate week buckets for a given month
 * Returns calendar weeks that intersect with the month, labeled "Semana 1..W"
 */
function calculateWeekBuckets(year: number, month: number): WeekBucket[] {
  const buckets: WeekBucket[] = [];
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0);
  const daysInMonth = lastDayOfMonth.getDate();

  let currentDate = new Date(firstDayOfMonth);
  let weekIndex = 1;

  while (currentDate <= lastDayOfMonth) {
    // Find start of the week (Sunday)
    const dayOfWeek = currentDate.getDay();
    const weekStart = new Date(currentDate);

    // For the first week, the start is the first day of the month
    // For subsequent weeks, go back to Sunday
    if (weekIndex > 1 || dayOfWeek === 0) {
      // Already at Sunday or first day of month
    }

    // Find end of the week (Saturday) or end of month
    const weekEnd = new Date(currentDate);
    const daysUntilSaturday = 6 - weekEnd.getDay();
    weekEnd.setDate(weekEnd.getDate() + daysUntilSaturday);

    // Cap at end of month
    if (weekEnd > lastDayOfMonth) {
      weekEnd.setTime(lastDayOfMonth.getTime());
    }

    // Calculate ISO week key
    const isoWeekNum = getISOWeek(currentDate);
    const isoYear = getISOWeekYear(currentDate);
    const isoWeekKey = `${isoYear}-W${String(isoWeekNum).padStart(2, '0')}`;

    buckets.push({
      index: weekIndex,
      label: `Semana ${weekIndex}`,
      start: formatDateYMD(currentDate),
      end: formatDateYMD(weekEnd),
      isoWeekKey,
    });

    // Move to next Sunday
    currentDate = new Date(weekEnd);
    currentDate.setDate(currentDate.getDate() + 1);
    weekIndex++;
  }

  return buckets;
}

function getISOWeekYear(date: Date): number {
  const d = new Date(date);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  return d.getFullYear();
}

function formatDateYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get action grid data for the dashboard
 */
export async function getActionGridData(filters: DashboardFilters): Promise<ActionGridData> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { year, month, domainId, goalId } = filters;
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = getLastDayOfMonth(year, month);
  const daysInMonth = new Date(year, month, 0).getDate();
  const weekBuckets = calculateWeekBuckets(year, month);
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  // Fetch all non-archived activities
  let activitiesQuery = supabase
    .from('lifeplan_activities')
    .select('id, title, frequency_type, domain_id, goal_id')
    .eq('user_id', user.id)
    .eq('is_archived', false);

  if (domainId) activitiesQuery = activitiesQuery.eq('domain_id', domainId);
  if (goalId) activitiesQuery = activitiesQuery.eq('goal_id', goalId);

  const { data: activities } = await activitiesQuery;

  if (!activities?.length) {
    return {
      month: monthStr,
      daysInMonth,
      weekBuckets,
      daily: { actions: [] },
      weekly: { actions: [] },
      monthly: { actions: [] },
      once: { actions: [] },
    };
  }

  // Group activities by frequency type
  const dailyActivities = activities.filter(a => a.frequency_type === 'DAILY');
  const weeklyActivities = activities.filter(a => a.frequency_type === 'WEEKLY');
  const monthlyActivities = activities.filter(a => a.frequency_type === 'MONTHLY');
  const onceActivities = activities.filter(a => a.frequency_type === 'ONCE');

  // Fetch all completions for the month
  const activityIds = activities.map(a => a.id);
  const { data: completions } = await supabase
    .from('activity_completions')
    .select('activity_id, period_key, completed, completed_at, date')
    .in('activity_id', activityIds)
    .eq('completed', true)
    .gte('date', startDate)
    .lte('date', endDate);

  const completionsList = completions || [];

  // Build ISO week key to bucket index map
  const weekKeyToIndex = new Map<string, number>();
  weekBuckets.forEach(bucket => {
    weekKeyToIndex.set(bucket.isoWeekKey, bucket.index);
  });

  // Build daily grid data
  const daily: DailyGridData = {
    actions: dailyActivities.map(activity => {
      const statusByDay: Record<number, boolean> = {};
      completionsList
        .filter(c => c.activity_id === activity.id)
        .forEach(c => {
          // period_key for daily is YYYY-MM-DD
          const dayMatch = c.period_key.match(/^\d{4}-\d{2}-(\d{2})$/);
          if (dayMatch) {
            const day = parseInt(dayMatch[1], 10);
            statusByDay[day] = true;
          }
        });
      return {
        id: activity.id,
        name: activity.title,
        statusByDay,
      };
    }),
  };

  // Build weekly grid data
  const weekly: WeeklyGridData = {
    actions: weeklyActivities.map(activity => {
      const statusByWeekIndex: Record<number, boolean> = {};
      completionsList
        .filter(c => c.activity_id === activity.id)
        .forEach(c => {
          // period_key for weekly is YYYY-Www
          const weekIndex = weekKeyToIndex.get(c.period_key);
          if (weekIndex !== undefined) {
            statusByWeekIndex[weekIndex] = true;
          }
        });
      return {
        id: activity.id,
        name: activity.title,
        statusByWeekIndex,
      };
    }),
  };

  // Build monthly grid data
  const monthly: MonthlyGridData = {
    actions: monthlyActivities.map(activity => {
      const completion = completionsList.find(c => c.activity_id === activity.id);
      let completedWeekIndex: number | null = null;
      const statusByWeekIndex: Record<number, boolean> = {};

      if (completion && completion.completed_at) {
        // Find which week the completion occurred in
        const completedDate = new Date(completion.completed_at);
        for (const bucket of weekBuckets) {
          const bucketStart = new Date(bucket.start);
          const bucketEnd = new Date(bucket.end);
          bucketEnd.setHours(23, 59, 59, 999);
          if (completedDate >= bucketStart && completedDate <= bucketEnd) {
            completedWeekIndex = bucket.index;
            statusByWeekIndex[bucket.index] = true;
            break;
          }
        }
      }

      return {
        id: activity.id,
        name: activity.title,
        completedWeekIndex,
        statusByWeekIndex,
      };
    }),
  };

  // Build once grid data
  const once: OnceGridData = {
    actions: onceActivities.map(activity => {
      const completion = completionsList.find(c => c.activity_id === activity.id);
      return {
        id: activity.id,
        name: activity.title,
        completed: !!completion,
        completedAt: completion?.completed_at || null,
      };
    }),
  };

  return {
    month: monthStr,
    daysInMonth,
    weekBuckets,
    daily,
    weekly,
    monthly,
    once,
  };
}
