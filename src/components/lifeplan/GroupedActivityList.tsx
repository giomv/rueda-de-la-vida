'use client';

import { useRouter } from 'next/navigation';
import { Plus, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActivityCard } from './ActivityCard';
import { ProgressRing } from './ProgressRing';
import { cn } from '@/lib/utils';
import { useLifePlanStore, GroupedActivities, FREQUENCY_LABELS } from '@/lib/stores/lifeplan-store';
import { toggleCompletion, archiveActivity, deleteActivity } from '@/lib/actions/lifeplan-actions';
import type { ActivityWithCompletions, FrequencyType } from '@/lib/types/lifeplan';

// Period key utilities (inline for client components)
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

interface GroupedActivityListProps {
  date: string;
  groupedActivities: GroupedActivities[];
  showHeaders?: boolean;
  showProgressHeader?: boolean;
  className?: string;
}

export function GroupedActivityList({
  date,
  groupedActivities,
  showHeaders = true,
  showProgressHeader = true,
  className
}: GroupedActivityListProps) {
  const router = useRouter();
  const { domains, toggleActivityCompletion } = useLifePlanStore();
  const dateObj = parseLocalDate(date);

  // Calculate total activities and completed count
  const allActivities = groupedActivities.flatMap(g => g.activities);
  const completedCount = allActivities.filter((a) => {
    const periodKey = getPeriodKey(a.frequency_type as FrequencyType, dateObj);
    return a.completions.some((c) => c.period_key === periodKey && c.completed);
  }).length;

  const handleToggleComplete = async (activityId: string, targetDate: string) => {
    const completion = await toggleCompletion(activityId, targetDate);
    toggleActivityCompletion(activityId, targetDate, completion);
  };

  const handleEdit = (activityId: string) => {
    router.push(`/mi-plan/actividad/${activityId}`);
  };

  const handleArchive = async (activityId: string) => {
    await archiveActivity(activityId);
  };

  const handleDelete = async (activityId: string) => {
    if (confirm('¿Estás seguro de eliminar esta acción?')) {
      await deleteActivity(activityId);
    }
  };

  const getDomain = (domainId: string | null) => {
    if (!domainId) return null;
    return domains.find((d) => d.id === domainId);
  };

  // Format date for display
  const formatDateDisplay = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isToday = d.getTime() === today.getTime();
    if (isToday) return 'Hoy';

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.getTime() === yesterday.getTime()) return 'Ayer';

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.getTime() === tomorrow.getTime()) return 'Mañana';

    return d.toLocaleDateString('es', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    });
  };

  if (allActivities.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">Sin acciones</h3>
        <p className="text-muted-foreground mb-4">
          No tienes acciones programadas para {formatDateDisplay(date).toLowerCase()}.
        </p>
        <Button onClick={() => router.push('/mi-plan/actividad/nueva')}>
          <Plus className="w-4 h-4 mr-2" />
          Crear acción
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with progress */}
      {showProgressHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold capitalize">
              {formatDateDisplay(date)}
            </h2>
            <p className="text-sm text-muted-foreground">
              {completedCount} de {allActivities.length} completadas
            </p>
          </div>
          <ProgressRing completed={completedCount} total={allActivities.length} />
        </div>
      )}

      {/* Grouped activity cards */}
      <div className="space-y-6">
        {groupedActivities.map((group) => (
          <div key={group.frequency}>
            {/* Group header - only show if showHeaders is true */}
            {showHeaders && (
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
                {group.label}
              </h3>
            )}

            {/* Activities in this group */}
            <div className="space-y-2">
              {group.activities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  date={date}
                  domain={getDomain(activity.domain_id)}
                  onToggleComplete={handleToggleComplete}
                  onEdit={handleEdit}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add button */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => router.push('/mi-plan/actividad/nueva')}
      >
        <Plus className="w-4 h-4 mr-2" />
        Agregar acción
      </Button>
    </div>
  );
}
