'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ViewTabs, ActivityCard } from '@/components/lifeplan';
import { useLifePlan } from '@/hooks/use-lifeplan';
import { useLifePlanStore } from '@/lib/stores/lifeplan-store';
import { toggleCompletion } from '@/lib/actions/lifeplan-actions';
import type { FrequencyType, ActivityWithCompletions } from '@/lib/types/lifeplan';

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Period key utilities
function getISOWeek(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(
    ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
  );
}

function getISOWeekYear(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  return d.getFullYear();
}

function getWeekKey(date: Date): string {
  return `${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, '0')}`;
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getPeriodKey(frequencyType: FrequencyType, date: Date): string {
  switch (frequencyType) {
    case 'DAILY': return getDayKey(date);
    case 'WEEKLY': return getWeekKey(date);
    case 'MONTHLY': return getMonthKey(date);
    case 'ONCE': return 'ONCE';
    default: return getDayKey(date);
  }
}

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function isCompletedForPeriod(activity: ActivityWithCompletions, date: Date): boolean {
  const periodKey = getPeriodKey(activity.frequency_type as FrequencyType, date);
  return activity.completions.some((c) => c.period_key === periodKey && c.completed);
}

export default function SemanaPage() {
  const router = useRouter();
  const { setViewMode, getActivitiesForDate, toggleActivityCompletion, domains } = useLifePlanStore();
  const { loading } = useLifePlan();

  // Set view mode on mount
  useEffect(() => {
    setViewMode('week');
  }, [setViewMode]);

  const today = formatDate(new Date());

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

  const todayActivities = getActivitiesForDate(today);

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

      {/* Today's activities */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">
              {new Date(today + 'T00:00:00').toLocaleDateString('es', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </h3>
            <span className="text-sm text-muted-foreground">
              {todayActivities.filter((a) =>
                isCompletedForPeriod(a, parseLocalDate(today))
              ).length} / {todayActivities.length}
            </span>
          </div>

          {todayActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Sin acciones para hoy
            </p>
          ) : (
            <div className="space-y-2">
              {todayActivities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  date={today}
                  domain={getDomain(activity.domain_id)}
                  onToggleComplete={handleToggleComplete}
                  onEdit={(id) => router.push(`/mi-plan/actividad/${id}`)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
