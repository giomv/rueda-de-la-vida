'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Trash2, Plus, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ActivityCard, OriginBadge } from '@/components/lifeplan';
import { getGoalWithActivities, updateGoal, deleteGoal } from '@/lib/actions/goal-actions';
import { toggleCompletion } from '@/lib/actions/lifeplan-actions';
import { createClient } from '@/lib/supabase/client';
import type { GoalWithActivities } from '@/lib/types/lifeplan';
import type { LifeDomain } from '@/lib/types';

export default function GoalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const goalId = params.goalId as string;

  const [goal, setGoal] = useState<GoalWithActivities | null>(null);
  const [domains, setDomains] = useState<LifeDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit state
  const [title, setTitle] = useState('');
  const [domainId, setDomainId] = useState<string | null>(null);
  const [metric, setMetric] = useState('');
  const [targetDate, setTargetDate] = useState('');

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/iniciar-sesion');
        return;
      }

      try {
        const [goalData, { data: domainsData }] = await Promise.all([
          getGoalWithActivities(goalId),
          supabase
            .from('life_domains')
            .select('*')
            .eq('user_id', user.id)
            .order('order_position'),
        ]);

        setGoal(goalData);
        setTitle(goalData.title);
        setDomainId(goalData.domain_id);
        setMetric(goalData.metric || '');
        setTargetDate(goalData.target_date || '');
        setDomains(domainsData || []);
      } catch (error) {
        console.error('Error loading goal:', error);
        router.push('/mi-plan/metas');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [goalId, router]);

  const handleSave = async () => {
    if (!title.trim()) return;

    setSaving(true);
    try {
      const updated = await updateGoal(goalId, {
        title: title.trim(),
        domain_id: domainId,
        metric: metric.trim() || undefined,
        target_date: targetDate || null,
      });

      setGoal({ ...goal!, ...updated });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar esta meta? Las acciones vinculadas no se eliminarán.')) {
      return;
    }

    setDeleting(true);
    try {
      await deleteGoal(goalId);
      router.push('/mi-plan/metas');
    } catch (error) {
      console.error('Error deleting goal:', error);
      setDeleting(false);
    }
  };

  const handleToggleComplete = async (activityId: string, date: string) => {
    await toggleCompletion(activityId, date);
    // Reload goal data
    const updated = await getGoalWithActivities(goalId);
    setGoal(updated);
  };

  const getDomain = (id: string | null) => {
    if (!id) return null;
    return domains.find((d) => d.id === id);
  };

  const today = new Date().toISOString().split('T')[0];

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

  if (!goal) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground mb-4">Meta no encontrada</p>
        <Button onClick={() => router.push('/mi-plan/metas')}>Volver</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/mi-plan/metas')}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Detalle de Meta</h1>
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

      {/* Goal info */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Información</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Dominio de vida</Label>
            <Select
              value={domainId || 'none'}
              onValueChange={(value) => setDomainId(value === 'none' ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar dominio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin dominio</SelectItem>
                {domains.map((domain) => (
                  <SelectItem key={domain.id} value={domain.id}>
                    {domain.icon && <span className="mr-2">{domain.icon}</span>}
                    {domain.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metric">Métrica</Label>
            <Input
              id="metric"
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              placeholder="Ej: Correr 5km en menos de 30 min"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetDate">Fecha objetivo</Label>
            <Input
              id="targetDate"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <OriginBadge origin={goal.origin} />
            <span className="text-sm text-muted-foreground">
              Creada {new Date(goal.created_at).toLocaleDateString('es')}
            </span>
          </div>

          <Button onClick={handleSave} disabled={saving || !title.trim()} className="w-full">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </CardContent>
      </Card>

      {/* Linked activities */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Acciones vinculadas</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/mi-plan/actividad/nueva')}
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {goal.activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay acciones vinculadas a esta meta
            </p>
          ) : (
            <div className="space-y-2">
              {goal.activities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={{ ...activity, completions: [] }}
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
