'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ViewTabs, ProgressBar, ActivityCard } from '@/components/lifeplan';
import { useLifePlan } from '@/hooks/use-lifeplan';
import { useLifePlanStore } from '@/lib/stores/lifeplan-store';
import { toggleCompletion } from '@/lib/actions/lifeplan-actions';
import { cn } from '@/lib/utils';

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDaysInMonth(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday = 0

  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = [];

  // Fill in empty days before the first day
  for (let i = 0; i < startingDay; i++) {
    currentWeek.push(null);
  }

  // Fill in the days of the month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    currentWeek.push(new Date(year, month, day));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Fill in remaining days of the last week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

const DAY_HEADERS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function MesPage() {
  const router = useRouter();
  const { viewDate, setViewDate, setViewMode, getActivitiesForDate, toggleActivityCompletion, domains } = useLifePlanStore();
  const { loading } = useLifePlan();

  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Set view mode on mount
  useEffect(() => {
    setViewMode('month');
  }, [setViewMode]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const weeks = getDaysInMonth(year, month);
  const today = formatDate(new Date());

  const goToPreviousMonth = () => {
    const prev = new Date(year, month - 1, 1);
    setViewDate(prev);
  };

  const goToNextMonth = () => {
    const next = new Date(year, month + 1, 1);
    setViewDate(next);
  };

  const goToThisMonth = () => {
    setViewDate(new Date());
  };

  const isThisMonth = month === new Date().getMonth() && year === new Date().getFullYear();

  const handleToggleComplete = async (activityId: string, date: string) => {
    const completion = await toggleCompletion(activityId, date);
    toggleActivityCompletion(activityId, date, completion);
  };

  const getDomain = (domainId: string | null) => {
    if (!domainId) return null;
    return domains.find((d) => d.id === domainId);
  };

  // Calculate monthly stats
  let monthlyTotal = 0;
  let monthlyCompleted = 0;
  weeks.forEach((week) => {
    week.forEach((day) => {
      if (day) {
        const dateStr = formatDate(day);
        const activities = getActivitiesForDate(dateStr);
        monthlyTotal += activities.length;
        monthlyCompleted += activities.filter((a) =>
          a.completions.some((c) => c.date === dateStr && c.completed)
        ).length;
      }
    });
  });

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded-lg w-full" />
          <div className="h-80 bg-muted rounded-lg w-full" />
        </div>
      </div>
    );
  }

  const selectedActivities = selectedDay ? getActivitiesForDate(selectedDay) : [];

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">
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

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <div className="text-center">
          <p className="font-medium text-lg">{MONTH_NAMES[month]} {year}</p>
          <button
            onClick={goToThisMonth}
            className="text-sm text-muted-foreground hover:text-foreground"
            disabled={isThisMonth}
          >
            {isThisMonth ? 'Este mes' : 'Ir a este mes'}
          </button>
        </div>

        <Button variant="ghost" size="icon" onClick={goToNextMonth}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Monthly progress */}
      <ProgressBar completed={monthlyCompleted} total={monthlyTotal} className="mb-6" />

      {/* Calendar grid */}
      <Card className="mb-6">
        <CardContent className="p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAY_HEADERS.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {week.map((day, dayIndex) => {
                if (!day) {
                  return <div key={dayIndex} className="p-2" />;
                }

                const dateStr = formatDate(day);
                const activities = getActivitiesForDate(dateStr);
                const completed = activities.filter((a) =>
                  a.completions.some((c) => c.date === dateStr && c.completed)
                ).length;
                const isSelected = selectedDay === dateStr;
                const isToday = dateStr === today;
                const hasActivities = activities.length > 0;
                const allCompleted = hasActivities && completed === activities.length;

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                    className={cn(
                      'p-2 rounded-lg transition-colors text-center',
                      isSelected && 'bg-primary text-primary-foreground',
                      !isSelected && isToday && 'ring-2 ring-primary',
                      !isSelected && !isToday && 'hover:bg-muted'
                    )}
                  >
                    <span className={cn(
                      'text-sm',
                      isToday && !isSelected && 'font-bold text-primary'
                    )}>
                      {day.getDate()}
                    </span>
                    {hasActivities && (
                      <div className={cn(
                        'w-1.5 h-1.5 rounded-full mx-auto mt-1',
                        allCompleted
                          ? 'bg-green-500'
                          : completed > 0
                          ? 'bg-yellow-500'
                          : 'bg-muted-foreground/30'
                      )} />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Selected day activities */}
      {selectedDay && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">
                {new Date(selectedDay + 'T00:00:00').toLocaleDateString('es', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </h3>
              <span className="text-sm text-muted-foreground">
                {selectedActivities.filter((a) =>
                  a.completions.some((c) => c.date === selectedDay && c.completed)
                ).length} / {selectedActivities.length}
              </span>
            </div>

            {selectedActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sin actividades para este día
              </p>
            ) : (
              <div className="space-y-2">
                {selectedActivities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    date={selectedDay}
                    domain={getDomain(activity.domain_id)}
                    onToggleComplete={handleToggleComplete}
                    onEdit={(id) => router.push(`/mi-plan/actividad/${id}`)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
