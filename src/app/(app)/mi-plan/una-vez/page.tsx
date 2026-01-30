'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ViewTabs, OriginBadge, ProgressBar } from '@/components/lifeplan';
import { useLifePlan } from '@/hooks/use-lifeplan';
import { useLifePlanStore } from '@/lib/stores/lifeplan-store';
import { toggleCompletion, archiveActivity, deleteActivity } from '@/lib/actions/lifeplan-actions';
import { cn } from '@/lib/utils';

export default function UnaVezPage() {
  const router = useRouter();
  const { setViewMode, activities, toggleActivityCompletion, domains } = useLifePlanStore();
  const { loading, error, refresh } = useLifePlan();

  // Set view mode on mount
  useEffect(() => {
    setViewMode('once');
  }, [setViewMode]);

  // Filter for ONCE activities only
  const onceActivities = activities.filter(
    (a) => !a.is_archived && a.frequency_type === 'ONCE'
  );

  // Separate completed and pending, then sort by created_at (oldest first)
  const pendingActivities = onceActivities
    .filter((a) => !a.completions.some((c) => c.period_key === 'ONCE' && c.completed))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const completedActivities = onceActivities
    .filter((a) => a.completions.some((c) => c.period_key === 'ONCE' && c.completed))
    .sort((a, b) => {
      // Sort by completion date (most recent first)
      const aCompletion = a.completions.find((c) => c.period_key === 'ONCE' && c.completed);
      const bCompletion = b.completions.find((c) => c.period_key === 'ONCE' && c.completed);
      const aDate = aCompletion?.completed_at ? new Date(aCompletion.completed_at).getTime() : 0;
      const bDate = bCompletion?.completed_at ? new Date(bCompletion.completed_at).getTime() : 0;
      return bDate - aDate; // Most recent first
    });

  const handleToggleComplete = async (activityId: string) => {
    // For ONCE activities, we pass today's date but completion is stored with period_key 'ONCE'
    const today = new Date().toISOString().split('T')[0];
    const completion = await toggleCompletion(activityId, today);
    toggleActivityCompletion(activityId, today, completion);
  };

  const handleEdit = (activityId: string) => {
    router.push(`/mi-plan/actividad/${activityId}`);
  };

  const handleArchive = async (activityId: string) => {
    await archiveActivity(activityId);
    refresh();
  };

  const handleDelete = async (activityId: string) => {
    if (confirm('¿Estás seguro de eliminar esta acción?')) {
      await deleteActivity(activityId);
      refresh();
    }
  };

  const getDomain = (domainId: string | null) => {
    if (!domainId) return null;
    return domains.find((d) => d.id === domainId);
  };

  const formatCompletionDate = (activity: typeof onceActivities[0]) => {
    const completion = activity.completions.find(
      (c) => c.period_key === 'ONCE' && c.completed
    );
    if (!completion?.completed_at) return null;
    return new Date(completion.completed_at).toLocaleDateString('es', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded-lg w-full" />
          <div className="h-40 bg-muted rounded-lg w-full" />
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
        <Button size="sm" onClick={() => router.push('/mi-plan/actividad/nueva')}>
          <Plus className="w-4 h-4 mr-1" />
          Nueva
        </Button>
      </div>

      {/* View tabs */}
      <ViewTabs className="mb-4" />

      {/* Progress */}
      <div className="mb-6">
        <ProgressBar
          completed={completedActivities.length}
          total={onceActivities.length}
          showPendingCompleted
        />
      </div>

      {/* Empty state */}
      {onceActivities.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Circle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Sin tareas únicas</h3>
            <p className="text-muted-foreground mb-4">
              Las tareas con frecuencia &ldquo;Una vez&rdquo; aparecerán aquí.
            </p>
            <Button onClick={() => router.push('/mi-plan/actividad/nueva')}>
              <Plus className="w-4 h-4 mr-2" />
              Crear tarea
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pending activities */}
      {pendingActivities.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Pendientes</h2>
          <div className="space-y-2">
            {pendingActivities.map((activity) => {
              const domain = getDomain(activity.domain_id);
              return (
                <Card key={activity.id} className="transition-all hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Toggle button */}
                      <button
                        onClick={() => handleToggleComplete(activity.id)}
                        className="mt-0.5 w-6 h-6 rounded-full border-2 border-muted-foreground/30 hover:border-primary flex items-center justify-center transition-colors"
                      >
                        <Circle className="w-4 h-4 text-transparent" />
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm">{activity.title}</h3>
                        {activity.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {activity.notes}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {domain && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              {domain.icon && <span>{domain.icon}</span>}
                              {domain.name}
                            </span>
                          )}
                          <OriginBadge origin={activity.source_type} />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(activity.id)}
                        >
                          Editar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed activities */}
      {completedActivities.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-muted-foreground">
            Completadas
          </h2>
          <div className="space-y-2">
            {completedActivities.map((activity) => {
              const domain = getDomain(activity.domain_id);
              const completionDate = formatCompletionDate(activity);
              return (
                <Card key={activity.id} className="opacity-60">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Toggle button */}
                      <button
                        onClick={() => handleToggleComplete(activity.id)}
                        className="mt-0.5 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm line-through text-muted-foreground">
                          {activity.title}
                        </h3>
                        {completionDate && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Completada el {completionDate}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {domain && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              {domain.icon && <span>{domain.icon}</span>}
                              {domain.name}
                            </span>
                          )}
                          <OriginBadge origin={activity.source_type} />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchive(activity.id)}
                        >
                          Archivar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
