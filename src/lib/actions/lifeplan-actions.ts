'use server';

import { createClient } from '@/lib/supabase/server';
import type {
  LifePlanActivity,
  ActivityCompletion,
  WeeklyCheckin,
  CreateActivityInput,
  UpdateActivityInput,
  ActivityWithCompletions,
} from '@/lib/types/lifeplan';

// Get activities for a date range with their completions
export async function getActivitiesForDateRange(startDate: string, endDate: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Get all non-archived activities
  const { data: activities, error: activitiesError } = await supabase
    .from('lifeplan_activities')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .order('order_position');

  if (activitiesError) throw new Error(activitiesError.message);

  if (!activities?.length) return [];

  // Get completions for the date range
  const activityIds = activities.map((a) => a.id);
  const { data: completions, error: completionsError } = await supabase
    .from('activity_completions')
    .select('*')
    .in('activity_id', activityIds)
    .gte('date', startDate)
    .lte('date', endDate);

  if (completionsError) throw new Error(completionsError.message);

  // Merge activities with their completions
  const activitiesWithCompletions: ActivityWithCompletions[] = activities.map((activity) => ({
    ...activity,
    completions: (completions || []).filter((c) => c.activity_id === activity.id),
  }));

  return activitiesWithCompletions;
}

// Get a single activity by ID
export async function getActivity(activityId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data, error } = await supabase
    .from('lifeplan_activities')
    .select('*')
    .eq('id', activityId)
    .eq('user_id', user.id)
    .single();

  if (error) throw new Error(error.message);
  return data as LifePlanActivity;
}

// Create a new activity
export async function createActivity(input: CreateActivityInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Get max order position
  const { data: maxOrder } = await supabase
    .from('lifeplan_activities')
    .select('order_position')
    .eq('user_id', user.id)
    .order('order_position', { ascending: false })
    .limit(1)
    .single();

  const { data, error } = await supabase
    .from('lifeplan_activities')
    .insert({
      user_id: user.id,
      title: input.title,
      notes: input.notes || null,
      domain_id: input.domain_id || null,
      goal_id: input.goal_id || null,
      frequency_type: input.frequency_type,
      frequency_value: input.frequency_value || 1,
      scheduled_days: input.scheduled_days || null,
      time_of_day: input.time_of_day || null,
      source_type: 'MANUAL',
      order_position: (maxOrder?.order_position ?? -1) + 1,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as LifePlanActivity;
}

// Update an activity
export async function updateActivity(activityId: string, input: UpdateActivityInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const updates: Record<string, unknown> = {};
  if (input.title !== undefined) updates.title = input.title;
  if (input.notes !== undefined) updates.notes = input.notes;
  if (input.domain_id !== undefined) updates.domain_id = input.domain_id;
  if (input.goal_id !== undefined) updates.goal_id = input.goal_id;
  if (input.frequency_type !== undefined) updates.frequency_type = input.frequency_type;
  if (input.frequency_value !== undefined) updates.frequency_value = input.frequency_value;
  if (input.scheduled_days !== undefined) updates.scheduled_days = input.scheduled_days;
  if (input.time_of_day !== undefined) updates.time_of_day = input.time_of_day;
  if (input.is_archived !== undefined) updates.is_archived = input.is_archived;

  const { data, error } = await supabase
    .from('lifeplan_activities')
    .update(updates)
    .eq('id', activityId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as LifePlanActivity;
}

// Archive an activity (soft delete)
export async function archiveActivity(activityId: string) {
  return updateActivity(activityId, { is_archived: true });
}

// Delete an activity permanently
export async function deleteActivity(activityId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { error } = await supabase
    .from('lifeplan_activities')
    .delete()
    .eq('id', activityId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

// Toggle activity completion for a specific date
export async function toggleCompletion(activityId: string, date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Verify the activity belongs to the user
  const { data: activity } = await supabase
    .from('lifeplan_activities')
    .select('id')
    .eq('id', activityId)
    .eq('user_id', user.id)
    .single();

  if (!activity) throw new Error('Actividad no encontrada');

  // Check if completion exists
  const { data: existing } = await supabase
    .from('activity_completions')
    .select('*')
    .eq('activity_id', activityId)
    .eq('date', date)
    .single();

  if (existing) {
    // Toggle the completion status
    const { data, error } = await supabase
      .from('activity_completions')
      .update({
        completed: !existing.completed,
        completed_at: !existing.completed ? new Date().toISOString() : null,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ActivityCompletion;
  } else {
    // Create new completion
    const { data, error } = await supabase
      .from('activity_completions')
      .insert({
        activity_id: activityId,
        date,
        completed: true,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ActivityCompletion;
  }
}

// Update completion notes
export async function updateCompletionNotes(activityId: string, date: string, notes: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Verify the activity belongs to the user
  const { data: activity } = await supabase
    .from('lifeplan_activities')
    .select('id')
    .eq('id', activityId)
    .eq('user_id', user.id)
    .single();

  if (!activity) throw new Error('Actividad no encontrada');

  const { data, error } = await supabase
    .from('activity_completions')
    .upsert(
      {
        activity_id: activityId,
        date,
        notes,
      },
      { onConflict: 'activity_id,date' }
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ActivityCompletion;
}

// Reorder activities
export async function reorderActivities(activityIds: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Update each activity with its new position
  await Promise.all(
    activityIds.map((id, index) =>
      supabase
        .from('lifeplan_activities')
        .update({ order_position: index })
        .eq('id', id)
        .eq('user_id', user.id)
    )
  );
}

// Get weekly check-in
export async function getWeeklyCheckin(weekStart: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data, error } = await supabase
    .from('weekly_checkins')
    .select('*')
    .eq('user_id', user.id)
    .eq('week_start', weekStart)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data as WeeklyCheckin | null;
}

// Save weekly check-in
export async function saveWeeklyCheckin(weekStart: string, whatWorked: string, whatToAdjust: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data, error } = await supabase
    .from('weekly_checkins')
    .upsert(
      {
        user_id: user.id,
        week_start: weekStart,
        what_worked: whatWorked,
        what_to_adjust: whatToAdjust,
      },
      { onConflict: 'user_id,week_start' }
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as WeeklyCheckin;
}

// Get all activities (including archived)
export async function getAllActivities() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data, error } = await supabase
    .from('lifeplan_activities')
    .select('*')
    .eq('user_id', user.id)
    .order('order_position');

  if (error) throw new Error(error.message);
  return data as LifePlanActivity[];
}
