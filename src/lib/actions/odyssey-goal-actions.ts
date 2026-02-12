'use server';

import { createClient } from '@/lib/supabase/server';
import type { Wheel, LifeDomain, PlanGoal } from '@/lib/types';
import type { Goal } from '@/lib/types/lifeplan';
import type { OdysseyGoalAssignment, GoalWithAssignment } from '@/lib/types/odyssey';

// Get user's wheels for selection in Plan de Vida
export async function getUserWheelsForOdyssey(): Promise<Pick<Wheel, 'id' | 'title' | 'created_at'>[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data, error } = await supabase
    .from('wheels')
    .select('id, title, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

// Set the selected wheel for an odyssey
export async function selectWheelForOdyssey(odysseyId: string, wheelId: string | null): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { error } = await supabase
    .from('odysseys')
    .update({ selected_wheel_id: wheelId })
    .eq('id', odysseyId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

// Import goals from a wheel into the odyssey context (idempotent - reuses existing goals)
export async function importWheelGoalsToOdyssey(odysseyId: string, wheelId: string): Promise<{
  importedCount: number;
  skippedCount: number;
  totalActionPlans: number;
  goalsWithText: number;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Verify wheel belongs to user
  const { data: wheel, error: wheelError } = await supabase
    .from('wheels')
    .select('id, user_id')
    .eq('id', wheelId)
    .eq('user_id', user.id)
    .single();

  if (wheelError || !wheel) {
    console.log('[importWheelGoalsToOdyssey] Wheel not found or not owned by user');
    return { importedCount: 0, skippedCount: 0, totalActionPlans: 0, goalsWithText: 0 };
  }

  // Get action plans from the wheel (these contain goal_text)
  const { data: actionPlans, error: plansError } = await supabase
    .from('action_plans')
    .select('*, domains(id, name)')
    .eq('wheel_id', wheelId);

  console.log('[importWheelGoalsToOdyssey] Found action plans:', actionPlans?.length || 0);

  if (plansError || !actionPlans?.length) {
    console.log('[importWheelGoalsToOdyssey] No action plans found, error:', plansError);
    return { importedCount: 0, skippedCount: 0, totalActionPlans: 0, goalsWithText: 0 };
  }

  // Build flat list of goals from all plans (prefer goals array, fall back to goal_text)
  let totalGoalTexts = 0;
  const allGoalEntries: { text: string; domainName?: string }[] = [];
  for (const plan of actionPlans) {
    const planGoals: PlanGoal[] = (plan.goals as PlanGoal[] | null)?.length
      ? (plan.goals as PlanGoal[])
      : plan.goal_text
        ? [{ id: 'legacy', text: plan.goal_text }]
        : [];

    const domainName = (plan.domains as { name?: string })?.name?.toLowerCase();
    for (const pg of planGoals) {
      if (pg.text) {
        allGoalEntries.push({ text: pg.text, domainName });
        totalGoalTexts++;
      }
    }
  }

  const goalsWithText = totalGoalTexts;
  console.log('[importWheelGoalsToOdyssey] Goals with text:', goalsWithText);

  // Get user's life domains for mapping
  const { data: lifeDomains } = await supabase
    .from('life_domains')
    .select('id, slug, name')
    .eq('user_id', user.id);

  let importedCount = 0;
  let skippedCount = 0;

  for (const entry of allGoalEntries) {
    // Match domain by name (case insensitive)
    const matchedDomain = lifeDomains?.find(
      (d) => d.name.toLowerCase() === entry.domainName || d.slug === entry.domainName
    );

    // Check if goal already exists from this wheel
    const { data: existingGoal } = await supabase
      .from('goals')
      .select('id')
      .eq('user_id', user.id)
      .eq('source_wheel_id', wheelId)
      .eq('title', entry.text)
      .single();

    if (existingGoal) {
      skippedCount++;
      continue;
    }

    // Create new goal linked to wheel
    const { error: goalError } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        title: entry.text,
        domain_id: matchedDomain?.id || null,
        origin: 'WHEEL',
        source_wheel_id: wheelId,
        target_date: null,
      });

    if (!goalError) {
      importedCount++;
    }
  }

  // Update odyssey with selected wheel
  await supabase
    .from('odysseys')
    .update({ selected_wheel_id: wheelId })
    .eq('id', odysseyId)
    .eq('user_id', user.id);

  console.log('[importWheelGoalsToOdyssey] Result:', { importedCount, skippedCount, totalActionPlans: actionPlans.length, goalsWithText });
  return { importedCount, skippedCount, totalActionPlans: actionPlans.length, goalsWithText };
}

// Get goals for an odyssey plan (unassigned + assigned by year)
export async function getOdysseyGoals(odysseyId: string, planId: string): Promise<{
  unassigned: GoalWithAssignment[];
  byYear: Record<number, GoalWithAssignment[]>;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Get the odyssey to find selected wheel
  const { data: odyssey, error: odysseyError } = await supabase
    .from('odysseys')
    .select('selected_wheel_id')
    .eq('id', odysseyId)
    .eq('user_id', user.id)
    .single();

  console.log('[getOdysseyGoals] Odyssey:', odyssey, 'Error:', odysseyError);

  if (!odyssey?.selected_wheel_id) {
    console.log('[getOdysseyGoals] No selected wheel, returning empty');
    return { unassigned: [], byYear: { 1: [], 2: [], 3: [], 4: [], 5: [] } };
  }

  // Get all goals from this wheel
  const { data: goals, error: goalsError } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .eq('source_wheel_id', odyssey.selected_wheel_id)
    .eq('is_archived', false);

  console.log('[getOdysseyGoals] Goals found:', goals?.length || 0, 'Error:', goalsError);

  if (!goals?.length) {
    console.log('[getOdysseyGoals] No goals found for wheel', odyssey.selected_wheel_id);
    return { unassigned: [], byYear: { 1: [], 2: [], 3: [], 4: [], 5: [] } };
  }

  // Get life domains for enrichment
  const { data: lifeDomains } = await supabase
    .from('life_domains')
    .select('*')
    .eq('user_id', user.id);

  const domainMap = new Map((lifeDomains || []).map((d) => [d.id, d]));

  // Get assignments for this plan
  const { data: assignments } = await supabase
    .from('odyssey_goal_assignments')
    .select('*')
    .eq('plan_id', planId);

  const assignmentMap = new Map(
    (assignments || []).map((a) => [a.goal_id, a as OdysseyGoalAssignment])
  );

  // Build result
  const unassigned: GoalWithAssignment[] = [];
  const byYear: Record<number, GoalWithAssignment[]> = {
    1: [], 2: [], 3: [], 4: [], 5: []
  };

  for (const goal of goals) {
    const assignment = assignmentMap.get(goal.id) || null;
    const domain = goal.domain_id ? domainMap.get(goal.domain_id) || null : null;
    const item: GoalWithAssignment = {
      goal: goal as Goal,
      assignment,
      domain: domain as LifeDomain | null
    };

    if (assignment) {
      byYear[assignment.year_index].push(item);
    } else {
      unassigned.push(item);
    }
  }

  // Sort by order_position
  for (const year of [1, 2, 3, 4, 5]) {
    byYear[year].sort((a, b) =>
      (a.assignment?.order_position || 0) - (b.assignment?.order_position || 0)
    );
  }

  return { unassigned, byYear };
}

// Assign a goal to a specific year in a plan
export async function assignGoalToYear(
  odysseyId: string,
  planId: string,
  goalId: string,
  yearIndex: number
): Promise<OdysseyGoalAssignment> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Validate year index
  if (yearIndex < 1 || yearIndex > 5) {
    throw new Error('Year index must be between 1 and 5');
  }

  // Get max order position for this year
  const { data: existing } = await supabase
    .from('odyssey_goal_assignments')
    .select('order_position')
    .eq('plan_id', planId)
    .eq('year_index', yearIndex)
    .order('order_position', { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0
    ? existing[0].order_position + 1
    : 0;

  // Upsert assignment (handles move between years)
  const { data, error } = await supabase
    .from('odyssey_goal_assignments')
    .upsert({
      odyssey_id: odysseyId,
      plan_id: planId,
      goal_id: goalId,
      year_index: yearIndex,
      order_position: nextOrder,
    }, {
      onConflict: 'plan_id,goal_id'
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as OdysseyGoalAssignment;
}

// Remove goal assignment (return to unassigned pool)
export async function unassignGoal(planId: string, goalId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('odyssey_goal_assignments')
    .delete()
    .eq('plan_id', planId)
    .eq('goal_id', goalId);

  if (error) throw new Error(error.message);
}

// Get selected wheel info for an odyssey
export async function getSelectedWheel(odysseyId: string): Promise<Pick<Wheel, 'id' | 'title' | 'created_at'> | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data: odyssey } = await supabase
    .from('odysseys')
    .select('selected_wheel_id')
    .eq('id', odysseyId)
    .eq('user_id', user.id)
    .single();

  if (!odyssey?.selected_wheel_id) return null;

  const { data: wheel } = await supabase
    .from('wheels')
    .select('id, title, created_at')
    .eq('id', odyssey.selected_wheel_id)
    .single();

  return wheel || null;
}
