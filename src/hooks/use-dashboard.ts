'use client';

import { useEffect, useState, useCallback } from 'react';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import {
  getDashboardSummary,
  getDomainsProgress,
  getGoalsProgress,
  getSmartPendingItems,
  getRecentActivity,
  getCelebration,
  getDomains,
  getGoals,
  hasActivePlan as checkHasActivePlan,
  getActionGridData,
} from '@/lib/actions/dashboard-actions';

export function useDashboard() {
  const store = useDashboardStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    store.setIsLoading(true);
    setError(null);

    try {
      // Check if user has an active plan first
      const activePlan = await checkHasActivePlan();
      store.setHasActivePlan(activePlan);

      if (!activePlan) {
        setLoading(false);
        store.setIsLoading(false);
        return;
      }

      const filters = store.getFilters();

      // Fetch all data in parallel
      const [
        summary,
        domainsProgress,
        goalsProgress,
        pendingItems,
        activityResponse,
        celebration,
        domains,
        goals,
        actionGridData,
      ] = await Promise.all([
        getDashboardSummary(filters),
        getDomainsProgress(filters),
        getGoalsProgress(filters),
        getSmartPendingItems(),
        getRecentActivity(filters, 10),
        getCelebration(),
        getDomains(),
        getGoals(filters.domainId),
        getActionGridData(filters),
      ]);

      // Update store with all data
      store.hydrate({
        actionsSummary: summary.actions,
        financeSummary: summary.finance,
        focusItems: summary.focus,
        domainsProgress,
        goalsProgress,
        pendingItems,
        activityFeed: activityResponse.items,
        activityNextCursor: activityResponse.nextCursor,
        activityHasMore: activityResponse.hasMore,
        celebration,
        domains,
        goals,
        actionGridData,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
      store.setIsLoading(false);
    }
  }, [store.year, store.month, store.domainId, store.goalId]);

  // Initial load and refresh on filter change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh goals when domain filter changes
  useEffect(() => {
    async function updateGoals() {
      const goals = await getGoals(store.domainId);
      store.setGoals(goals);
    }
    updateGoals();
  }, [store.domainId]);

  // Load more activity items
  const loadMoreActivity = useCallback(async () => {
    if (!store.activityHasMore || store.isLoadingMoreActivity) return;

    store.setIsLoadingMoreActivity(true);
    try {
      const filters = store.getFilters();
      const response = await getRecentActivity(
        filters,
        10,
        store.activityNextCursor || undefined
      );
      store.appendActivityFeed(response.items);
      store.setActivityNextCursor(response.nextCursor);
      store.setActivityHasMore(response.hasMore);
    } catch (err) {
      console.error('Error loading more activity:', err);
    } finally {
      store.setIsLoadingMoreActivity(false);
    }
  }, [store.activityNextCursor, store.activityHasMore, store.isLoadingMoreActivity]);

  return {
    // State
    loading,
    error,
    hasActivePlan: store.hasActivePlan,

    // Data
    actionsSummary: store.actionsSummary,
    financeSummary: store.financeSummary,
    focusItems: store.focusItems,
    domainsProgress: store.domainsProgress,
    goalsProgress: store.goalsProgress,
    pendingItems: store.pendingItems,
    activityFeed: store.activityFeed,
    activityHasMore: store.activityHasMore,
    isLoadingMoreActivity: store.isLoadingMoreActivity,
    celebration: store.celebration,
    actionGridData: store.actionGridData,

    // Reference data
    domains: store.domains,
    goals: store.goals,

    // Filters
    filters: store.getFilters(),

    // Actions
    refresh: fetchData,
    loadMoreActivity,
    setYear: store.setYear,
    setMonth: store.setMonth,
    setDomainId: store.setDomainId,
    setGoalId: store.setGoalId,
    clearFilters: store.clearFilters,
  };
}

// Hook for filter URL sync
export function useDashboardUrlSync() {
  const store = useDashboardStore();

  const syncFromUrl = useCallback((searchParams: URLSearchParams) => {
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const domain = searchParams.get('domain');
    const goal = searchParams.get('goal');

    if (year) store.setYear(parseInt(year));
    if (month) store.setMonth(parseInt(month));
    if (domain) store.setDomainId(domain);
    if (goal) store.setGoalId(goal);
  }, []);

  const getUrlParams = useCallback(() => {
    const params = new URLSearchParams();
    params.set('year', store.year.toString());
    params.set('month', store.month.toString());
    if (store.domainId) params.set('domain', store.domainId);
    if (store.goalId) params.set('goal', store.goalId);
    return params.toString();
  }, [store.year, store.month, store.domainId, store.goalId]);

  return { syncFromUrl, getUrlParams };
}
