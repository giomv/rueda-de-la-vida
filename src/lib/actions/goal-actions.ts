'use server';

import { createClient } from '@/lib/supabase/server';
import type {
  Goal,
  GoalWithActivities,
  CreateGoalInput,
  UpdateGoalInput,
} from '@/lib/types/lifeplan';

// Get all goals for the current user
export async function getGoals(includeArchived = false) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  let query = supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (!includeArchived) {
    query = query.eq('is_archived', false);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as Goal[];
}

// Get a single goal by ID with its linked activities
export async function getGoalWithActivities(goalId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const [{ data: goal, error: goalError }, { data: activities, error: activitiesError }] = await Promise.all([
    supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('lifeplan_activities')
      .select('*')
      .eq('goal_id', goalId)
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('order_position'),
  ]);

  if (goalError) throw new Error(goalError.message);
  if (activitiesError) throw new Error(activitiesError.message);

  return {
    ...goal,
    activities: activities || [],
  } as GoalWithActivities;
}

// Create a new goal
export async function createGoal(input: CreateGoalInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: user.id,
      title: input.title,
      domain_id: input.domain_id || null,
      metric: input.metric || null,
      target_date: input.target_date || null,
      origin: 'MANUAL',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Goal;
}

// Update a goal
export async function updateGoal(goalId: string, input: UpdateGoalInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const updates: Record<string, unknown> = {};
  if (input.title !== undefined) updates.title = input.title;
  if (input.domain_id !== undefined) updates.domain_id = input.domain_id;
  if (input.metric !== undefined) updates.metric = input.metric;
  if (input.target_date !== undefined) updates.target_date = input.target_date;
  if (input.is_archived !== undefined) updates.is_archived = input.is_archived;

  const { data, error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', goalId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Goal;
}

// Archive a goal (soft delete)
export async function archiveGoal(goalId: string) {
  return updateGoal(goalId, { is_archived: true });
}

// Delete a goal permanently
export async function deleteGoal(goalId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', goalId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

// Get goals grouped by domain
export async function getGoalsByDomain() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data: goals, error } = await supabase
    .from('goals')
    .select('*, life_domains(id, name, icon, slug)')
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  // Group by domain
  const grouped: Record<string, Goal[]> = { uncategorized: [] };
  for (const goal of goals || []) {
    const domainId = goal.domain_id || 'uncategorized';
    if (!grouped[domainId]) grouped[domainId] = [];
    grouped[domainId].push(goal);
  }

  return grouped;
}
