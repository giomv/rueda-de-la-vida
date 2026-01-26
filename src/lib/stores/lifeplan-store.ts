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
} from '@/lib/types/lifeplan';
import type { LifeDomain } from '@/lib/types';

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
  getCompletionRate: (date: string) => { completed: number; total: number };
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

        const existingIndex = a.completions.findIndex((c) => c.date === date);
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

  // Computed helpers
  getActivitiesForDate: (date) => {
    const state = get();
    // Parse date string as local time to avoid timezone issues
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();
    const dayKeys = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
    const dayKey = dayKeys[dayOfWeek];

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

      // Check frequency
      switch (activity.frequency_type) {
        case 'DAILY':
          return true;
        case 'WEEKLY':
          if (activity.scheduled_days?.length) {
            return activity.scheduled_days.includes(dayKey);
          }
          return true; // If no specific days, show every day
        case 'MONTHLY':
          // Show on first day of week for monthly activities
          return dayKey === 'L';
        case 'ONCE':
          // Always show ONCE activities until completed
          const isCompleted = activity.completions.some(
            (c) => c.completed && c.date <= date
          );
          return !isCompleted;
        default:
          return true;
      }
    });
  },

  getCompletionRate: (date) => {
    const activities = get().getActivitiesForDate(date);
    const completed = activities.filter((a) =>
      a.completions.some((c) => c.date === date && c.completed)
    ).length;
    return { completed, total: activities.length };
  },
}));
