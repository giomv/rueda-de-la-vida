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
        activityFeed,
        celebration,
        domains,
        goals,
      ] = await Promise.all([
        getDashboardSummary(filters),
        getDomainsProgress(filters),
        getGoalsProgress(filters),
        getSmartPendingItems(),
        getRecentActivity(filters),
        getCelebration(),
        getDomains(),
        getGoals(filters.domainId),
      ]);

      // Update store with all data
      store.hydrate({
        actionsSummary: summary.actions,
        financeSummary: summary.finance,
        focusItems: summary.focus,
        domainsProgress,
        goalsProgress,
        pendingItems,
        activityFeed,
        celebration,
        domains,
        goals,
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
    celebration: store.celebration,

    // Reference data
    domains: store.domains,
    goals: store.goals,

    // Filters
    filters: store.getFilters(),

    // Actions
    refresh: fetchData,
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
