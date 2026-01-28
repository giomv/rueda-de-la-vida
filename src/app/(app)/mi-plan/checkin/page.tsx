'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WeeklyCheckinForm, ProgressBar } from '@/components/lifeplan';
import { useWeeklyCheckin } from '@/hooks/use-lifeplan';
import { useLifePlanStore } from '@/lib/stores/lifeplan-store';
import { useLifePlan } from '@/hooks/use-lifeplan';

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getEndOfWeek(date: Date): Date {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

export default function CheckinPage() {
  const router = useRouter();
  const { viewDate, setViewDate, setViewMode, getActivitiesForDate } = useLifePlanStore();
  const { loading: dataLoading } = useLifePlan();

  const [weekStart, setWeekStart] = useState(() => formatDate(getStartOfWeek(new Date())));
  const { checkin, loading: checkinLoading } = useWeeklyCheckin(weekStart);

  useEffect(() => {
    setViewMode('week');
  }, [setViewMode]);

  const goToPreviousWeek = () => {
    const prev = new Date(weekStart + 'T00:00:00');
    prev.setDate(prev.getDate() - 7);
    setWeekStart(formatDate(prev));
  };

  const goToNextWeek = () => {
    const next = new Date(weekStart + 'T00:00:00');
    next.setDate(next.getDate() + 7);
    setWeekStart(formatDate(next));
  };

  const goToThisWeek = () => {
    setWeekStart(formatDate(getStartOfWeek(new Date())));
  };

  const isThisWeek = weekStart === formatDate(getStartOfWeek(new Date()));
  const weekEnd = getEndOfWeek(new Date(weekStart + 'T00:00:00'));

  // Calculate week stats
  let weekTotal = 0;
  let weekCompleted = 0;

  const start = new Date(weekStart + 'T00:00:00');
  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const dateStr = formatDate(day);
    const activities = getActivitiesForDate(dateStr);
    weekTotal += activities.length;
    weekCompleted += activities.filter((a) =>
      a.completions.some((c) => c.date === dateStr && c.completed)
    ).length;
  }

  const weekRange = `${start.toLocaleDateString('es', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  const loading = dataLoading || checkinLoading;

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-40 bg-muted rounded-lg w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push('/mi-plan/hoy')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">Check-in Semanal</h1>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <div className="text-center">
          <p className="font-medium">{weekRange}</p>
          <button
            onClick={goToThisWeek}
            className="text-sm text-muted-foreground hover:text-foreground"
            disabled={isThisWeek}
          >
            {isThisWeek ? 'Esta semana' : 'Ir a esta semana'}
          </button>
        </div>

        <Button variant="ghost" size="icon" onClick={goToNextWeek}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Week summary */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Resumen de la semana</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ProgressBar completed={weekCompleted} total={weekTotal} />

          {weekTotal === 0 ? (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              No hay acciones registradas para esta semana
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">{weekCompleted}</p>
                <p className="text-xs text-muted-foreground">Completadas</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{weekTotal - weekCompleted}</p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Check-in form */}
      <WeeklyCheckinForm
        weekStart={weekStart}
        existingCheckin={checkin}
      />
    </div>
  );
}
