'use server';

import { createClient } from '@/lib/supabase/server';
import type {
  LifePlanActivity,
  ActivityCompletion,
  WeeklyCheckin,
  CreateActivityInput,
  UpdateActivityInput,
  ActivityWithCompletions,
  FrequencyType,
} from '@/lib/types/lifeplan';

// Period key calculation utilities (inline to avoid import issues with 'use server')
function getISOWeek(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(
    ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
  );
}

function getISOWeekYear(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  return d.getFullYear();
}

function getWeekKey(date: Date): string {
  const weekYear = getISOWeekYear(date);
  const weekNum = getISOWeek(date);
  return `${weekYear}-W${String(weekNum).padStart(2, '0')}`;
}

function getMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getPeriodKey(frequencyType: FrequencyType, date: Date): string {
  switch (frequencyType) {
    case 'DAILY':
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    case 'WEEKLY':
      return getWeekKey(date);
    case 'MONTHLY':
      return getMonthKey(date);
    case 'ONCE':
      return 'ONCE';
    default:
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
}

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Get activities for a date range with their completions
// For period-based completion tracking, we need to fetch completions by period_key
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

  const activityIds = activities.map((a) => a.id);

  // Calculate all relevant period keys for the date range
  const startDateObj = parseLocalDate(startDate);
  const endDateObj = parseLocalDate(endDate);

  // Get period keys for the range
  const periodKeys: string[] = [];

  // Add daily period keys
  const current = new Date(startDateObj);
  while (current <= endDateObj) {
    periodKeys.push(getPeriodKey('DAILY', current));
    current.setDate(current.getDate() + 1);
  }

  // Add weekly period key for start and end dates
  const startWeekKey = getWeekKey(startDateObj);
  const endWeekKey = getWeekKey(endDateObj);
  if (!periodKeys.includes(startWeekKey)) periodKeys.push(startWeekKey);
  if (startWeekKey !== endWeekKey && !periodKeys.includes(endWeekKey)) periodKeys.push(endWeekKey);

  // Add monthly period key for start and end dates
  const startMonthKey = getMonthKey(startDateObj);
  const endMonthKey = getMonthKey(endDateObj);
  if (!periodKeys.includes(startMonthKey)) periodKeys.push(startMonthKey);
  if (startMonthKey !== endMonthKey && !periodKeys.includes(endMonthKey)) periodKeys.push(endMonthKey);

  // Always include ONCE period key
  periodKeys.push('ONCE');

  // Get completions for the relevant period keys
  const { data: completions, error: completionsError } = await supabase
    .from('activity_completions')
    .select('*')
    .in('activity_id', activityIds)
    .in('period_key', periodKeys);

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
// The period_key is computed based on the activity's frequency type
export async function toggleCompletion(activityId: string, date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Get the activity to determine frequency type
  const { data: activity } = await supabase
    .from('lifeplan_activities')
    .select('id, frequency_type')
    .eq('id', activityId)
    .eq('user_id', user.id)
    .single();

  if (!activity) throw new Error('Acción no encontrada');

  // Calculate period_key based on frequency type
  const dateObj = parseLocalDate(date);
  const periodKey = getPeriodKey(activity.frequency_type as FrequencyType, dateObj);

  // Check if completion exists for this period
  const { data: existing } = await supabase
    .from('activity_completions')
    .select('*')
    .eq('activity_id', activityId)
    .eq('period_key', periodKey)
    .single();

  if (existing) {
    // Toggle the completion status
    const { data, error } = await supabase
      .from('activity_completions')
      .update({
        completed: !existing.completed,
        completed_at: !existing.completed ? new Date().toISOString() : null,
        date, // Update date to the most recent interaction
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
        period_key: periodKey,
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

  if (!activity) throw new Error('Acción no encontrada');

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
