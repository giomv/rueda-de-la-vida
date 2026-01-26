'use client';

import { useRouter } from 'next/navigation';
import { Plus, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActivityCard } from './ActivityCard';
import { ProgressRing } from './ProgressRing';
import { cn } from '@/lib/utils';
import { useLifePlanStore } from '@/lib/stores/lifeplan-store';
import { toggleCompletion, archiveActivity, deleteActivity } from '@/lib/actions/lifeplan-actions';
import type { ActivityWithCompletions } from '@/lib/types/lifeplan';

interface ActivityListProps {
  date: string;
  activities: ActivityWithCompletions[];
  className?: string;
}

export function ActivityList({ date, activities, className }: ActivityListProps) {
  const router = useRouter();
  const { domains, toggleActivityCompletion } = useLifePlanStore();

  const completedCount = activities.filter((a) =>
    a.completions.some((c) => c.date === date && c.completed)
  ).length;

  const handleToggleComplete = async (activityId: string, targetDate: string) => {
    const completion = await toggleCompletion(activityId, targetDate);
    toggleActivityCompletion(activityId, targetDate, completion);
  };

  const handleEdit = (activityId: string) => {
    router.push(`/mi-plan/actividad/${activityId}`);
  };

  const handleArchive = async (activityId: string) => {
    await archiveActivity(activityId);
    // Refresh will happen through the hook
  };

  const handleDelete = async (activityId: string) => {
    if (confirm('¿Estás seguro de eliminar esta actividad?')) {
      await deleteActivity(activityId);
      // Refresh will happen through the hook
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

  if (activities.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">Sin actividades</h3>
        <p className="text-muted-foreground mb-4">
          No tienes actividades programadas para {formatDateDisplay(date).toLowerCase()}.
        </p>
        <Button onClick={() => router.push('/mi-plan/actividad/nueva')}>
          <Plus className="w-4 h-4 mr-2" />
          Crear actividad
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold capitalize">
            {formatDateDisplay(date)}
          </h2>
          <p className="text-sm text-muted-foreground">
            {completedCount} de {activities.length} completadas
          </p>
        </div>
        <ProgressRing completed={completedCount} total={activities.length} />
      </div>

      {/* Activity cards */}
      <div className="space-y-2">
        {activities.map((activity) => (
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

      {/* Add button */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => router.push('/mi-plan/actividad/nueva')}
      >
        <Plus className="w-4 h-4 mr-2" />
        Agregar actividad
      </Button>
    </div>
  );
}
