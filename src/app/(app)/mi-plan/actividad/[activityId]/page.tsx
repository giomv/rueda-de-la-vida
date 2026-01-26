'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActivityForm } from '@/components/lifeplan';
import { getActivity, deleteActivity } from '@/lib/actions/lifeplan-actions';
import { createClient } from '@/lib/supabase/client';
import type { LifePlanActivity } from '@/lib/types/lifeplan';
import type { LifeDomain, Goal } from '@/lib/types';

export default function EditActivityPage() {
  const router = useRouter();
  const params = useParams();
  const activityId = params.activityId as string;

  const [activity, setActivity] = useState<LifePlanActivity | null>(null);
  const [domains, setDomains] = useState<LifeDomain[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/iniciar-sesion');
        return;
      }

      try {
        const [activityData, { data: domainsData }, { data: goalsData }] = await Promise.all([
          getActivity(activityId),
          supabase
            .from('life_domains')
            .select('*')
            .eq('user_id', user.id)
            .order('order_position'),
          supabase
            .from('goals')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_archived', false)
            .order('created_at', { ascending: false }),
        ]);

        setActivity(activityData);
        setDomains(domainsData || []);
        setGoals(goalsData || []);
      } catch (error) {
        console.error('Error loading activity:', error);
        router.push('/mi-plan/hoy');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [activityId, router]);

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar esta actividad? Se perderán todos los registros de completado.')) {
      return;
    }

    setDeleting(true);
    try {
      await deleteActivity(activityId);
      router.push('/mi-plan/hoy');
    } catch (error) {
      console.error('Error deleting activity:', error);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-40 bg-muted rounded-lg w-full" />
          <div className="h-40 bg-muted rounded-lg w-full" />
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground mb-4">Actividad no encontrada</p>
        <Button onClick={() => router.push('/mi-plan/hoy')}>Volver</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Editar Actividad</h1>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          {deleting ? 'Eliminando...' : 'Eliminar'}
        </Button>
      </div>

      {/* Form */}
      <ActivityForm activity={activity} domains={domains} goals={goals} />
    </div>
  );
}
