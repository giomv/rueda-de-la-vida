'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLifePlanStore } from '@/lib/stores/lifeplan-store';
import type { ActivityWithCompletions, Goal, WeeklyCheckin, FrequencyType } from '@/lib/types/lifeplan';
import type { LifeDomain } from '@/lib/types';

// Format date as YYYY-MM-DD
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get start of week (Monday)
function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Get end of week (Sunday)
function getEndOfWeek(date: Date): Date {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

// Get start of month
function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

// Get end of month
function getEndOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

// Period key utilities
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

export function useLifePlan() {
  const store = useLifePlanStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('No autenticado');
        setLoading(false);
        return;
      }

      // Calculate date range and period keys based on view mode
      let startDate: string;
      let endDate: string;
      const periodKeys: string[] = [];

      switch (store.viewMode) {
        case 'week':
          startDate = formatDate(getStartOfWeek(store.viewDate));
          endDate = formatDate(getEndOfWeek(store.viewDate));
          periodKeys.push(getWeekKey(store.viewDate));
          periodKeys.push(getMonthKey(store.viewDate));
          break;
        case 'month':
          startDate = formatDate(getStartOfMonth(store.viewDate));
          endDate = formatDate(getEndOfMonth(store.viewDate));
          periodKeys.push(getMonthKey(store.viewDate));
          break;
        case 'once':
          // For once view, fetch all ONCE completions
          startDate = '1970-01-01';
          endDate = '2099-12-31';
          break;
        case 'day':
        default:
          startDate = formatDate(store.viewDate);
          endDate = formatDate(store.viewDate);
          periodKeys.push(formatDate(store.viewDate));
          periodKeys.push(getWeekKey(store.viewDate));
          periodKeys.push(getMonthKey(store.viewDate));
      }

      // Always include ONCE period key
      periodKeys.push('ONCE');

      // Fetch activities first
      const [
        { data: activities, error: activitiesError },
        { data: goals, error: goalsError },
        { data: domains, error: domainsError },
      ] = await Promise.all([
        supabase
          .from('lifeplan_activities')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_archived', false)
          .order('order_position'),
        supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_archived', false)
          .order('created_at', { ascending: false }),
        supabase
          .from('life_domains')
          .select('*')
          .eq('user_id', user.id)
          .order('order_position'),
      ]);

      if (activitiesError) throw new Error(activitiesError.message);
      if (goalsError) throw new Error(goalsError.message);
      if (domainsError) throw new Error(domainsError.message);

      const activityIds = (activities || []).map((a) => a.id);

      // Build period keys for daily activities in the date range
      if (store.viewMode !== 'once') {
        const current = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T00:00:00');
        while (current <= end) {
          const dayKey = formatDate(current);
          if (!periodKeys.includes(dayKey)) {
            periodKeys.push(dayKey);
          }
          current.setDate(current.getDate() + 1);
        }
      }

      // Fetch completions by period keys
      const { data: completions, error: completionsError } = await supabase
        .from('activity_completions')
        .select('*')
        .in('activity_id', activityIds)
        .in('period_key', periodKeys);

      if (completionsError) throw new Error(completionsError.message);

      // Filter completions to only those belonging to user's activities
      const userCompletions = (completions || []).filter((c) =>
        activityIds.includes(c.activity_id)
      );

      // Merge activities with completions
      const activitiesWithCompletions: ActivityWithCompletions[] = (activities || []).map((activity) => ({
        ...activity,
        completions: userCompletions.filter((c) => c.activity_id === activity.id),
      }));

      // Update store
      store.setActivities(activitiesWithCompletions);
      store.setGoals(goals || []);
      store.setDomains(domains || []);
      store.markClean();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [store.viewDate, store.viewMode]);

  // Initial load and refresh on date/mode change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    activities: store.activities,
    goals: store.goals,
    domains: store.domains,
    loading,
    error,
    refresh: fetchData,
  };
}

// Hook for weekly check-in
export function useWeeklyCheckin(weekStart: string) {
  const [checkin, setCheckin] = useState<WeeklyCheckin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCheckin() {
      const supabase = createClient();
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('weekly_checkins')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .single();

      setCheckin(data);
      setLoading(false);
    }

    fetchCheckin();
  }, [weekStart]);

  return { checkin, loading };
}

// Hook for sync status
export function useLifePlanSync() {
  const store = useLifePlanStore();
  const [syncing, setSyncing] = useState(false);

  const sync = useCallback(async () => {
    setSyncing(true);
    store.setIsSyncing(true);

    try {
      const { syncLifePlanActivities } = await import('@/lib/actions/import-actions');
      const result = await syncLifePlanActivities();
      store.setLastSyncResult(result);
      return result;
    } finally {
      setSyncing(false);
      store.setIsSyncing(false);
    }
  }, []);

  return {
    sync,
    syncing,
    lastSyncResult: store.lastSyncResult,
  };
}
