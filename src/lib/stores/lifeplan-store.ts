'use client';

import { create } from 'zustand';
import type {
  LifePlanActivity,
  ActivityCompletion,
  Goal,
  WeeklyCheckin,
  ViewMode,
  FilterType,
  ActivityWithCompletions,
  FrequencyType,
} from '@/lib/types/lifeplan';
import type { LifeDomain } from '@/lib/types';

// Period key calculation utilities (inline for client-side use)
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

function getDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getPeriodKey(frequencyType: FrequencyType, date: Date): string {
  switch (frequencyType) {
    case 'DAILY':
      return getDayKey(date);
    case 'WEEKLY':
      return getWeekKey(date);
    case 'MONTHLY':
      return getMonthKey(date);
    case 'ONCE':
      return 'ONCE';
    default:
      return getDayKey(date);
  }
}

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

interface LifePlanStoreState {
  // Data
  activities: ActivityWithCompletions[];
  goals: Goal[];
  domains: LifeDomain[];
  weeklyCheckin: WeeklyCheckin | null;

  // View state
  viewDate: Date;
  viewMode: ViewMode;
  filter: FilterType;
  selectedDomainId: string | null;
  selectedGoalId: string | null;

  // UI state
  isLoading: boolean;
  isSyncing: boolean;
  isDirty: boolean;
  lastSyncResult: { fromWheel: number; fromOdyssey: number } | null;

  // Actions - Data
  setActivities: (activities: ActivityWithCompletions[]) => void;
  addActivity: (activity: LifePlanActivity) => void;
  updateActivity: (activityId: string, updates: Partial<LifePlanActivity>) => void;
  removeActivity: (activityId: string) => void;
  toggleActivityCompletion: (activityId: string, date: string, completion: ActivityCompletion) => void;

  // Actions - Goals
  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (goalId: string, updates: Partial<Goal>) => void;
  removeGoal: (goalId: string) => void;

  // Actions - Domains
  setDomains: (domains: LifeDomain[]) => void;

  // Actions - Check-in
  setWeeklyCheckin: (checkin: WeeklyCheckin | null) => void;

  // Actions - View
  setViewDate: (date: Date) => void;
  setViewMode: (mode: ViewMode) => void;
  setFilter: (filter: FilterType) => void;
  setSelectedDomainId: (id: string | null) => void;
  setSelectedGoalId: (id: string | null) => void;

  // Actions - UI
  setIsLoading: (loading: boolean) => void;
  setIsSyncing: (syncing: boolean) => void;
  setLastSyncResult: (result: { fromWheel: number; fromOdyssey: number } | null) => void;
  markClean: () => void;
  reset: () => void;
  hydrate: (data: Partial<LifePlanStoreState>) => void;

  // Computed / helpers
  getActivitiesForDate: (date: string) => ActivityWithCompletions[];
  getActivitiesForView: (viewMode: ViewMode, date: Date) => ActivityWithCompletions[];
  getCompletionRate: (date: string) => { completed: number; total: number };
  isCompletedForPeriod: (activity: ActivityWithCompletions, date: Date) => boolean;
}

const initialState = {
  activities: [],
  goals: [],
  domains: [],
  weeklyCheckin: null,
  viewDate: new Date(),
  viewMode: 'day' as ViewMode,
  filter: 'all' as FilterType,
  selectedDomainId: null,
  selectedGoalId: null,
  isLoading: false,
  isSyncing: false,
  isDirty: false,
  lastSyncResult: null,
};

export const useLifePlanStore = create<LifePlanStoreState>((set, get) => ({
  ...initialState,

  // Data setters
  setActivities: (activities) => set({ activities }),

  addActivity: (activity) =>
    set((state) => ({
      activities: [...state.activities, { ...activity, completions: [] }],
      isDirty: true,
    })),

  updateActivity: (activityId, updates) =>
    set((state) => ({
      activities: state.activities.map((a) =>
        a.id === activityId ? { ...a, ...updates } : a
      ),
      isDirty: true,
    })),

  removeActivity: (activityId) =>
    set((state) => ({
      activities: state.activities.filter((a) => a.id !== activityId),
      isDirty: true,
    })),

  toggleActivityCompletion: (activityId, date, completion) =>
    set((state) => ({
      activities: state.activities.map((a) => {
        if (a.id !== activityId) return a;

        // Match by period_key instead of date for proper period-based tracking
        const existingIndex = a.completions.findIndex((c) => c.period_key === completion.period_key);
        let newCompletions: ActivityCompletion[];

        if (existingIndex >= 0) {
          newCompletions = a.completions.map((c, i) =>
            i === existingIndex ? completion : c
          );
        } else {
          newCompletions = [...a.completions, completion];
        }

        return { ...a, completions: newCompletions };
      }),
      isDirty: true,
    })),

  // Goals
  setGoals: (goals) => set({ goals }),

  addGoal: (goal) =>
    set((state) => ({
      goals: [...state.goals, goal],
      isDirty: true,
    })),

  updateGoal: (goalId, updates) =>
    set((state) => ({
      goals: state.goals.map((g) =>
        g.id === goalId ? { ...g, ...updates } : g
      ),
      isDirty: true,
    })),

  removeGoal: (goalId) =>
    set((state) => ({
      goals: state.goals.filter((g) => g.id !== goalId),
      isDirty: true,
    })),

  // Domains
  setDomains: (domains) => set({ domains }),

  // Check-in
  setWeeklyCheckin: (weeklyCheckin) => set({ weeklyCheckin }),

  // View state
  setViewDate: (viewDate) => set({ viewDate }),
  setViewMode: (viewMode) => set({ viewMode }),
  setFilter: (filter) => set({ filter }),
  setSelectedDomainId: (selectedDomainId) => set({ selectedDomainId }),
  setSelectedGoalId: (selectedGoalId) => set({ selectedGoalId }),

  // UI state
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsSyncing: (isSyncing) => set({ isSyncing }),
  setLastSyncResult: (lastSyncResult) => set({ lastSyncResult }),
  markClean: () => set({ isDirty: false }),
  reset: () => set(initialState),
  hydrate: (data) => set({ ...data, isDirty: false }),

  // Check if an activity is completed for a given period
  isCompletedForPeriod: (activity, date) => {
    const periodKey = getPeriodKey(activity.frequency_type as FrequencyType, date);
    return activity.completions.some((c) => c.period_key === periodKey && c.completed);
  },

  // Get activities for a specific date (Day view logic)
  // Shows: daily + pending weekly + pending monthly + pending once
  getActivitiesForDate: (date) => {
    const state = get();
    const dateObj = parseLocalDate(date);
    const dayOfWeek = dateObj.getDay();
    const dayKeys = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
    const dayKey = dayKeys[dayOfWeek];

    // Get period keys for checking completion
    const dayPeriodKey = getDayKey(dateObj);
    const weekPeriodKey = getWeekKey(dateObj);
    const monthPeriodKey = getMonthKey(dateObj);

    return state.activities.filter((activity) => {
      if (activity.is_archived) return false;

      // Apply filters
      if (state.filter === 'domain' && state.selectedDomainId) {
        if (activity.domain_id !== state.selectedDomainId) return false;
      }
      if (state.filter === 'goal' && state.selectedGoalId) {
        if (activity.goal_id !== state.selectedGoalId) return false;
      }
      if (state.filter === 'uncategorized') {
        if (activity.domain_id || activity.goal_id) return false;
      }

      // Check if completed for its relevant period
      const isCompletedForPeriod = (periodKey: string) =>
        activity.completions.some((c) => c.period_key === periodKey && c.completed);

      switch (activity.frequency_type) {
        case 'DAILY':
          // Always show daily activities for the selected day
          return true;
        case 'WEEKLY':
          // Show if it's a scheduled day OR if pending (not completed this week)
          if (activity.scheduled_days?.length) {
            // If scheduled days are set, only show on those days
            // OR if it's pending for the week
            const isScheduledDay = activity.scheduled_days.includes(dayKey);
            const isPending = !isCompletedForPeriod(weekPeriodKey);
            return isScheduledDay || isPending;
          }
          // If no scheduled days, always show
          return true;
        case 'MONTHLY':
          // Show if pending (not completed this month)
          return !isCompletedForPeriod(monthPeriodKey);
        case 'ONCE':
          // Show if never completed
          return !isCompletedForPeriod('ONCE');
        default:
          return true;
      }
    });
  },

  // Get activities for a specific view mode
  getActivitiesForView: (viewMode, date) => {
    const state = get();
    const weekPeriodKey = getWeekKey(date);
    const monthPeriodKey = getMonthKey(date);

    return state.activities.filter((activity) => {
      if (activity.is_archived) return false;

      // Apply filters
      if (state.filter === 'domain' && state.selectedDomainId) {
        if (activity.domain_id !== state.selectedDomainId) return false;
      }
      if (state.filter === 'goal' && state.selectedGoalId) {
        if (activity.goal_id !== state.selectedGoalId) return false;
      }
      if (state.filter === 'uncategorized') {
        if (activity.domain_id || activity.goal_id) return false;
      }

      // Check if completed for its relevant period
      const isCompletedForPeriod = (periodKey: string) =>
        activity.completions.some((c) => c.period_key === periodKey && c.completed);

      switch (viewMode) {
        case 'day':
          // Day view handled by getActivitiesForDate
          return true;

        case 'week':
          // Week view: weekly activities + pending monthly + pending once
          switch (activity.frequency_type) {
            case 'DAILY':
              return false; // Daily shown in day view only
            case 'WEEKLY':
              return true; // All weekly activities
            case 'MONTHLY':
              return !isCompletedForPeriod(monthPeriodKey); // Pending monthly
            case 'ONCE':
              return !isCompletedForPeriod('ONCE'); // Pending once
            default:
              return false;
          }

        case 'month':
          // Month view: monthly activities + pending once
          switch (activity.frequency_type) {
            case 'DAILY':
            case 'WEEKLY':
              return false;
            case 'MONTHLY':
              return true; // All monthly activities
            case 'ONCE':
              return !isCompletedForPeriod('ONCE'); // Pending once
            default:
              return false;
          }

        case 'once':
          // Once view: all once activities with their status
          return activity.frequency_type === 'ONCE';

        default:
          return true;
      }
    });
  },

  getCompletionRate: (date) => {
    const state = get();
    const activities = state.getActivitiesForDate(date);
    const dateObj = parseLocalDate(date);

    const completed = activities.filter((a) => {
      const periodKey = getPeriodKey(a.frequency_type as FrequencyType, dateObj);
      return a.completions.some((c) => c.period_key === periodKey && c.completed);
    }).length;

    return { completed, total: activities.length };
  },
}));
