'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityCard, GoalCard, ProgressRing } from '@/components/lifeplan';
import { toggleCompletion } from '@/lib/actions/lifeplan-actions';
import { createClient } from '@/lib/supabase/client';
import type { ActivityWithCompletions, Goal } from '@/lib/types/lifeplan';
import type { LifeDomain } from '@/lib/types';

export default function DomainDetailPage() {
  const router = useRouter();
  const params = useParams();
  const domainId = params.domainId as string;

  const [domain, setDomain] = useState<LifeDomain | null>(null);
  const [activities, setActivities] = useState<ActivityWithCompletions[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/iniciar-sesion');
        return;
      }

      try {
        const [
          { data: domainData },
          { data: activitiesData },
          { data: goalsData },
          { data: completionsData },
        ] = await Promise.all([
          supabase
            .from('life_domains')
            .select('*')
            .eq('id', domainId)
            .eq('user_id', user.id)
            .single(),
          supabase
            .from('lifeplan_activities')
            .select('*')
            .eq('domain_id', domainId)
            .eq('user_id', user.id)
            .eq('is_archived', false)
            .order('order_position'),
          supabase
            .from('goals')
            .select('*')
            .eq('domain_id', domainId)
            .eq('user_id', user.id)
            .eq('is_archived', false)
            .order('created_at', { ascending: false }),
          supabase
            .from('activity_completions')
            .select('*')
            .eq('date', today),
        ]);

        if (!domainData) {
          router.push('/mi-plan/hoy');
          return;
        }

        setDomain(domainData);
        setGoals(goalsData || []);

        // Merge activities with completions
        const activityIds = (activitiesData || []).map((a) => a.id);
        const relevantCompletions = (completionsData || []).filter((c) =>
          activityIds.includes(c.activity_id)
        );

        setActivities(
          (activitiesData || []).map((activity) => ({
            ...activity,
            completions: relevantCompletions.filter((c) => c.activity_id === activity.id),
          }))
        );
      } catch (error) {
        console.error('Error loading domain data:', error);
        router.push('/mi-plan/hoy');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [domainId, router, today]);

  const handleToggleComplete = async (activityId: string, date: string) => {
    const completion = await toggleCompletion(activityId, date);

    setActivities((prev) =>
      prev.map((a) => {
        if (a.id !== activityId) return a;

        const existingIndex = a.completions.findIndex((c) => c.date === date);
        let newCompletions;

        if (existingIndex >= 0) {
          newCompletions = a.completions.map((c, i) =>
            i === existingIndex ? completion : c
          );
        } else {
          newCompletions = [...a.completions, completion];
        }

        return { ...a, completions: newCompletions };
      })
    );
  };

  const completedToday = activities.filter((a) =>
    a.completions.some((c) => c.date === today && c.completed)
  ).length;

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

  if (!domain) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground mb-4">Dominio no encontrado</p>
        <Button onClick={() => router.push('/mi-plan/hoy')}>Volver</Button>
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
        <div className="flex items-center gap-3">
          {domain.icon && <span className="text-2xl">{domain.icon}</span>}
          <h1 className="text-xl font-bold">{domain.name}</h1>
        </div>
      </div>

      {/* Today's progress */}
      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium">Progreso de hoy</p>
              <p className="text-sm text-muted-foreground">
                {completedToday} de {activities.length} acciones completadas
              </p>
            </div>
            <ProgressRing completed={completedToday} total={activities.length} size="lg" />
          </div>
        </CardContent>
      </Card>

      {/* Goals */}
      {goals.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Metas</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/mi-plan/metas')}
            >
              Ver todas
            </Button>
          </div>
          <div className="space-y-2">
            {goals.slice(0, 3).map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                domain={domain}
                onEdit={(id) => router.push(`/mi-plan/metas/${id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Activities */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Acciones</h2>
          <Button
            size="sm"
            onClick={() => router.push('/mi-plan/actividad/nueva')}
          >
            <Plus className="w-4 h-4 mr-1" />
            Nueva
          </Button>
        </div>

        {activities.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">
                No hay acciones en este dominio
              </p>
              <Button onClick={() => router.push('/mi-plan/actividad/nueva')}>
                Crear acción
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {activities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                date={today}
                domain={domain}
                onToggleComplete={handleToggleComplete}
                onEdit={(id) => router.push(`/mi-plan/actividad/${id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
