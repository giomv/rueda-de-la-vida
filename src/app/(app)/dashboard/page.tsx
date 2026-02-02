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
  MetasSection,
  PendingList,
  ActivityFeedList,
  CheckinDialog,
  CelebrationBanner,
  SummarySkeleton,
  ListSkeleton,
  FeedSkeleton,
  ActionGridsSection,
  GridSkeleton,
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
    pendingItems,
    activityFeed,
    activityHasMore,
    isLoadingMoreActivity,
    loadMoreActivity,
    actionGridData,
    domainsSummary,
    metasSummary,
    metasYearIndex,
    fetchMetasForYear,
    filters,
    handlePinDomain,
    handleUnpinDomain,
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

      {/* Action Grids Section */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Progreso de acciones</h2>
        {loading ? (
          <GridSkeleton />
        ) : (
          <ActionGridsSection data={actionGridData} />
        )}
      </section>

      {/* Celebration Banner */}
      <h2 className="text-lg font-semibold mb-3">Mi resumen del mes</h2>
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
          <DomainsList
            domainsSummary={domainsSummary}
            onPinDomain={handlePinDomain}
            onUnpinDomain={handleUnpinDomain}
            showAddButton={!filters.domainId}
          />
        )}
      </section>

      {/* Metas Section (Plan de Vida) */}
      <section className="mb-6">
        {loading ? (
          <ListSkeleton count={4} />
        ) : (
          <MetasSection
            metasSummary={metasSummary}
            selectedYearIndex={metasYearIndex}
            onYearChange={fetchMetasForYear}
            globalGoalFilter={filters.goalId}
            loading={loading}
          />
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
        <h2 className="text-lg font-semibold mb-3">La actividad reciente</h2>
        {loading ? (
          <FeedSkeleton count={5} />
        ) : (
          <ActivityFeedList
            items={activityFeed}
            hasMore={activityHasMore}
            isLoadingMore={isLoadingMoreActivity}
            onLoadMore={loadMoreActivity}
          />
        )}
      </section>

      {/* Weekly Check-in Dialog */}
      <CheckinDialog />
    </div>
  );
}
