'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDashboard, useDashboardUrlSync } from '@/hooks/use-dashboard';
import {
  DashboardFilters,
  EmptyState,
  ActionsSummaryCard,
  FinanceSummaryCard,
  FocusCard,
  DomainsList,
  GoalsList,
  PendingList,
  ActivityFeedList,
  CheckinDialog,
  CelebrationBanner,
  SummarySkeleton,
  ListSkeleton,
  FeedSkeleton,
} from '@/components/dashboard';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { syncFromUrl, getUrlParams } = useDashboardUrlSync();

  const {
    loading,
    hasActivePlan,
    actionsSummary,
    financeSummary,
    focusItems,
    domainsProgress,
    goalsProgress,
    pendingItems,
    activityFeed,
    filters,
  } = useDashboard();

  // Sync URL params to store on mount
  useEffect(() => {
    syncFromUrl(searchParams);
  }, []);

  // Sync store to URL on filter change
  useEffect(() => {
    const params = getUrlParams();
    router.replace(`/dashboard?${params}`, { scroll: false });
  }, [filters.year, filters.month, filters.domainId, filters.goalId]);

  if (!hasActivePlan && !loading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Mi Dashboard</h1>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <h1 className="text-2xl font-bold mb-4">Mi Dashboard</h1>

      {/* Sticky Filters */}
      <DashboardFilters className="sticky top-0 z-10 bg-background pb-4 mb-4" />

      {/* Celebration Banner */}
      <CelebrationBanner className="mb-4" />

      {/* Summary Section */}
      {loading ? (
        <SummarySkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <ActionsSummaryCard summary={actionsSummary} />
          <FinanceSummaryCard summary={financeSummary} />
          <FocusCard items={focusItems} />
        </div>
      )}

      {/* Domains Section */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Dominios</h2>
        {loading ? (
          <ListSkeleton count={4} />
        ) : (
          <DomainsList domains={domainsProgress} />
        )}
      </section>

      {/* Goals Section */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Metas</h2>
        {loading ? (
          <ListSkeleton count={4} />
        ) : (
          <GoalsList goals={goalsProgress} />
        )}
      </section>

      {/* Smart Pending */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Pendientes inteligentes</h2>
        {loading ? (
          <ListSkeleton count={2} />
        ) : (
          <PendingList items={pendingItems} />
        )}
      </section>

      {/* Activity Feed */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Actividad reciente</h2>
        {loading ? (
          <FeedSkeleton count={5} />
        ) : (
          <ActivityFeedList items={activityFeed} />
        )}
      </section>

      {/* Weekly Check-in Dialog */}
      <CheckinDialog />
    </div>
  );
}
