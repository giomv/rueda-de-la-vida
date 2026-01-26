'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ViewTabs, ProgressRing, ActivityCard } from '@/components/lifeplan';
import { useLifePlan } from '@/hooks/use-lifeplan';
import { useLifePlanStore } from '@/lib/stores/lifeplan-store';
import { toggleCompletion } from '@/lib/actions/lifeplan-actions';
import { cn } from '@/lib/utils';

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

function getDaysInWeek(startOfWeek: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    days.push(day);
  }
  return days;
}

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function SemanaPage() {
  const router = useRouter();
  const { viewDate, setViewDate, setViewMode, getActivitiesForDate, toggleActivityCompletion, domains } = useLifePlanStore();
  const { loading, error, refresh } = useLifePlan();

  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Set view mode on mount
  useEffect(() => {
    setViewMode('week');
  }, [setViewMode]);

  const startOfWeek = getStartOfWeek(viewDate);
  const weekDays = getDaysInWeek(startOfWeek);
  const today = formatDate(new Date());

  const goToPreviousWeek = () => {
    const prev = new Date(startOfWeek);
    prev.setDate(prev.getDate() - 7);
    setViewDate(prev);
  };

  const goToNextWeek = () => {
    const next = new Date(startOfWeek);
    next.setDate(next.getDate() + 7);
    setViewDate(next);
  };

  const goToThisWeek = () => {
    setViewDate(new Date());
  };

  const isThisWeek = formatDate(startOfWeek) === formatDate(getStartOfWeek(new Date()));

  // Format week range for header
  const weekRange = `${startOfWeek.toLocaleDateString('es', { day: 'numeric', month: 'short' })} - ${weekDays[6].toLocaleDateString('es', { day: 'numeric', month: 'short' })}`;

  const handleToggleComplete = async (activityId: string, date: string) => {
    const completion = await toggleCompletion(activityId, date);
    toggleActivityCompletion(activityId, date, completion);
  };

  const getDomain = (domainId: string | null) => {
    if (!domainId) return null;
    return domains.find((d) => d.id === domainId);
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded-lg w-full" />
          <div className="h-40 bg-muted rounded-lg w-full" />
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

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {weekDays.map((day, index) => {
          const dateStr = formatDate(day);
          const activities = getActivitiesForDate(dateStr);
          const completed = activities.filter((a) =>
            a.completions.some((c) => c.date === dateStr && c.completed)
          ).length;
          const isSelected = selectedDay === dateStr;
          const isToday = dateStr === today;

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDay(isSelected ? null : dateStr)}
              className={cn(
                'flex flex-col items-center p-2 rounded-lg transition-colors',
                isSelected && 'bg-primary text-primary-foreground',
                !isSelected && isToday && 'bg-primary/10',
                !isSelected && !isToday && 'hover:bg-muted'
              )}
            >
              <span className="text-xs font-medium">{DAY_NAMES[index]}</span>
              <span className={cn('text-lg font-bold', isToday && !isSelected && 'text-primary')}>
                {day.getDate()}
              </span>
              {activities.length > 0 && (
                <div className="mt-1">
                  <ProgressRing
                    completed={completed}
                    total={activities.length}
                    size="sm"
                    showLabel={false}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

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

      {/* Weekly summary when no day selected */}
      {!selectedDay && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-2">
              Selecciona un día para ver las actividades
            </p>
            <Button variant="link" onClick={() => router.push('/mi-plan/checkin')}>
              Ver reflexión semanal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
