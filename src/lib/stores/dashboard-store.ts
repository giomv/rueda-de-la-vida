'use client';

import { create } from 'zustand';
import type {
  DashboardFilters,
  ActionsSummary,
  FinanceSummary,
  DomainProgress,
  GoalProgress,
  FocusItem,
  PendingItem,
  ActivityFeedItem,
  Celebration,
  ActionGridData,
} from '@/lib/types/dashboard';
import type { LifeDomain, Goal } from '@/lib/types';

interface DashboardState {
  // Filters
  year: number;
  month: number;
  domainId: string | null;
  goalId: string | null;

  // Data
  actionsSummary: ActionsSummary | null;
  financeSummary: FinanceSummary | null;
  domainsProgress: DomainProgress[];
  goalsProgress: GoalProgress[];
  focusItems: FocusItem[];
  pendingItems: PendingItem[];
  activityFeed: ActivityFeedItem[];
  activityNextCursor: string | null;
  activityHasMore: boolean;
  celebration: Celebration | null;
  actionGridData: ActionGridData | null;

  // Reference data
  domains: LifeDomain[];
  goals: Goal[];

  // UI state
  isLoading: boolean;
  isLoadingMoreActivity: boolean;
  hasActivePlan: boolean;

  // Filter actions
  setYear: (year: number) => void;
  setMonth: (month: number) => void;
  setDomainId: (id: string | null) => void;
  setGoalId: (id: string | null) => void;
  clearFilters: () => void;
  getFilters: () => DashboardFilters;

  // Data setters
  setActionsSummary: (s: ActionsSummary | null) => void;
  setFinanceSummary: (s: FinanceSummary | null) => void;
  setDomainsProgress: (d: DomainProgress[]) => void;
  setGoalsProgress: (g: GoalProgress[]) => void;
  setFocusItems: (f: FocusItem[]) => void;
  setPendingItems: (p: PendingItem[]) => void;
  setActivityFeed: (a: ActivityFeedItem[]) => void;
  appendActivityFeed: (a: ActivityFeedItem[]) => void;
  setActivityNextCursor: (c: string | null) => void;
  setActivityHasMore: (h: boolean) => void;
  setCelebration: (c: Celebration | null) => void;
  setActionGridData: (data: ActionGridData | null) => void;

  // Reference data setters
  setDomains: (d: LifeDomain[]) => void;
  setGoals: (g: Goal[]) => void;

  // UI setters
  setIsLoading: (l: boolean) => void;
  setIsLoadingMoreActivity: (l: boolean) => void;
  setHasActivePlan: (h: boolean) => void;

  // Bulk update
  hydrate: (data: Partial<DashboardState>) => void;
  reset: () => void;
}

const now = new Date();

const initialState = {
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  domainId: null,
  goalId: null,

  actionsSummary: null,
  financeSummary: null,
  domainsProgress: [],
  goalsProgress: [],
  focusItems: [],
  pendingItems: [],
  activityFeed: [],
  activityNextCursor: null,
  activityHasMore: false,
  celebration: null,
  actionGridData: null,

  domains: [],
  goals: [],

  isLoading: true,
  isLoadingMoreActivity: false,
  hasActivePlan: true,
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  ...initialState,

  // Filter actions
  setYear: (year) => set({ year }),
  setMonth: (month) => set({ month }),
  setDomainId: (domainId) => set({ domainId }),
  setGoalId: (goalId) => set({ goalId }),

  clearFilters: () => set({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    domainId: null,
    goalId: null,
  }),

  getFilters: () => {
    const state = get();
    return {
      year: state.year,
      month: state.month,
      domainId: state.domainId,
      goalId: state.goalId,
    };
  },

  // Data setters
  setActionsSummary: (actionsSummary) => set({ actionsSummary }),
  setFinanceSummary: (financeSummary) => set({ financeSummary }),
  setDomainsProgress: (domainsProgress) => set({ domainsProgress }),
  setGoalsProgress: (goalsProgress) => set({ goalsProgress }),
  setFocusItems: (focusItems) => set({ focusItems }),
  setPendingItems: (pendingItems) => set({ pendingItems }),
  setActivityFeed: (activityFeed) => set({ activityFeed }),
  appendActivityFeed: (items) => set((state) => ({
    activityFeed: [...state.activityFeed, ...items]
  })),
  setActivityNextCursor: (activityNextCursor) => set({ activityNextCursor }),
  setActivityHasMore: (activityHasMore) => set({ activityHasMore }),
  setCelebration: (celebration) => set({ celebration }),
  setActionGridData: (actionGridData) => set({ actionGridData }),

  // Reference data setters
  setDomains: (domains) => set({ domains }),
  setGoals: (goals) => set({ goals }),

  // UI setters
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsLoadingMoreActivity: (isLoadingMoreActivity) => set({ isLoadingMoreActivity }),
  setHasActivePlan: (hasActivePlan) => set({ hasActivePlan }),

  // Bulk update
  hydrate: (data) => set(data),
  reset: () => set(initialState),
}));
