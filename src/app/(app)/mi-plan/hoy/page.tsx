'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Download, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActivityList, ViewTabs, FilterChips, ImportDialog, ProgressRing } from '@/components/lifeplan';
import { useLifePlan, useLifePlanSync } from '@/hooks/use-lifeplan';
import { useLifePlanStore } from '@/lib/stores/lifeplan-store';

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function HoyPage() {
  const router = useRouter();
  const { viewDate, setViewDate, setViewMode, getActivitiesForDate, getCompletionRate } = useLifePlanStore();
  const { activities, goals, domains, loading, error, refresh } = useLifePlan();
  const { sync, syncing, lastSyncResult } = useLifePlanSync();

  const [showImport, setShowImport] = useState(false);

  // Set view mode on mount
  useEffect(() => {
    setViewMode('day');
  }, [setViewMode]);

  // Auto-sync on first load
  useEffect(() => {
    if (!loading && activities.length === 0 && !lastSyncResult) {
      sync();
    }
  }, [loading, activities.length, lastSyncResult, sync]);

  const today = formatDate(viewDate);
  const todayActivities = getActivitiesForDate(today);
  const { completed, total } = getCompletionRate(today);

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

  const handleImportComplete = useCallback(() => {
    refresh();
    setShowImport(false);
  }, [refresh]);

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded-lg w-full" />
          <div className="h-40 bg-muted rounded-lg w-full" />
          <div className="h-20 bg-muted rounded-lg w-full" />
          <div className="h-20 bg-muted rounded-lg w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={refresh}>Reintentar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mi Plan</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImport(true)}
            disabled={syncing}
          >
            {syncing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </Button>
          <Button size="sm" onClick={() => router.push('/mi-plan/actividad/nueva')}>
            <Plus className="w-4 h-4 mr-1" />
            Nueva
          </Button>
        </div>
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

      {/* Filters */}
      <FilterChips className="mb-6" />

      {/* Sync notification */}
      {lastSyncResult && (lastSyncResult.fromWheel > 0 || lastSyncResult.fromOdyssey > 0) && (
        <div className="mb-4 p-3 bg-primary/10 text-primary text-sm rounded-lg">
          Se importaron {lastSyncResult.fromWheel + lastSyncResult.fromOdyssey} acciones desde Rueda/Plan de vida
        </div>
      )}

      {/* Activity list */}
      <ActivityList date={today} activities={todayActivities} />

      {/* Import dialog */}
      <ImportDialog
        open={showImport}
        onOpenChange={setShowImport}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}
