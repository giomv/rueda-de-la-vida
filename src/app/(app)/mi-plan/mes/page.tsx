'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GroupedActivityList, ViewTabs, ProgressBar } from '@/components/lifeplan';
import { useLifePlan } from '@/hooks/use-lifeplan';
import { useLifePlanStore } from '@/lib/stores/lifeplan-store';

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function MesPage() {
  const router = useRouter();
  const { viewDate, setViewDate, setViewMode, getGroupedActivitiesForView, getCompletionRateForView } = useLifePlanStore();
  const { loading } = useLifePlan();

  // Set view mode on mount
  useEffect(() => {
    setViewMode('month');
  }, [setViewMode]);

  const today = formatDate(viewDate);
  const groupedActivities = getGroupedActivitiesForView('month', viewDate);
  const { completed, total } = getCompletionRateForView('month', viewDate);

  const goToPreviousDay = () => {
    const prev = new Date(viewDate);
    prev.setDate(prev.getDate() - 1);
    setViewDate(prev);
  };

  const goToNextDay = () => {
    const next = new Date(viewDate);
    next.setDate(next.getDate() + 1);
    setViewDate(next);
  };

  const goToToday = () => {
    setViewDate(new Date());
  };

  const isToday = formatDate(viewDate) === formatDate(new Date());

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded-lg w-full" />
          <div className="h-40 bg-muted rounded-lg w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mi Plan</h1>
        <Button size="sm" onClick={() => router.push('/mi-plan/actividad/nueva')}>
          <Plus className="w-4 h-4 mr-1" />
          Nueva
        </Button>
      </div>

      {/* View tabs */}
      <ViewTabs className="mb-4" />

      {/* Date navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={goToPreviousDay}>
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <div className="text-center">
          <button
            onClick={goToToday}
            className="text-sm text-muted-foreground hover:text-foreground"
            disabled={isToday}
          >
            {isToday ? 'Hoy' : 'Ir a hoy'}
          </button>
        </div>

        <Button variant="ghost" size="icon" onClick={goToNextDay}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <ProgressBar
          completed={completed}
          total={total}
          showPendingCompleted
        />
      </div>

      {/* Activity list - grouped by frequency (monthly → once) */}
      <GroupedActivityList date={today} groupedActivities={groupedActivities} showProgressHeader={false} />
    </div>
  );
}
