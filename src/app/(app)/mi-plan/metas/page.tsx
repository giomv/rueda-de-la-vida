'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Target, ChevronLeft } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { GoalCard } from '@/components/lifeplan';
import { getGoals, createGoal, archiveGoal, deleteGoal } from '@/lib/actions/goal-actions';
import { createClient } from '@/lib/supabase/client';
import type { Goal } from '@/lib/types/lifeplan';
import type { LifeDomain } from '@/lib/types';

export default function MetasPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [domains, setDomains] = useState<LifeDomain[]>([]);
  const [loading, setLoading] = useState(true);

  // New goal form
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDomainId, setNewDomainId] = useState<string | null>(null);
  const [newMetric, setNewMetric] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/iniciar-sesion');
      return;
    }

    const [goalsData, { data: domainsData }] = await Promise.all([
      getGoals(),
      supabase
        .from('life_domains')
        .select('*')
        .eq('user_id', user.id)
        .order('order_position'),
    ]);

    setGoals(goalsData);
    setDomains(domainsData || []);
    setLoading(false);
  }

  const handleCreateGoal = async () => {
    if (!newTitle.trim()) return;

    setCreating(true);
    try {
      const goal = await createGoal({
        title: newTitle.trim(),
        domain_id: newDomainId,
        metric: newMetric.trim() || undefined,
        target_date: newTargetDate || null,
      });

      setGoals([goal, ...goals]);
      setShowNewGoal(false);
      setNewTitle('');
      setNewDomainId(null);
      setNewMetric('');
      setNewTargetDate('');
    } finally {
      setCreating(false);
    }
  };

  const handleArchive = async (goalId: string) => {
    await archiveGoal(goalId);
    setGoals(goals.filter((g) => g.id !== goalId));
  };

  const handleDelete = async (goalId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta meta?')) return;
    await deleteGoal(goalId);
    setGoals(goals.filter((g) => g.id !== goalId));
  };

  const getDomain = (domainId: string | null) => {
    if (!domainId) return null;
    return domains.find((d) => d.id === domainId);
  };

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-24 bg-muted rounded-lg w-full" />
          <div className="h-24 bg-muted rounded-lg w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/mi-plan/hoy')}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Mis Metas</h1>
        </div>

        <Button size="sm" onClick={() => setShowNewGoal(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Nueva meta
        </Button>
      </div>

      {/* Goals list */}
      {goals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Sin metas</h3>
            <p className="text-muted-foreground mb-4">
              Las metas te ayudan a organizar tus acciones.
            </p>
            <Button onClick={() => setShowNewGoal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crear primera meta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              domain={getDomain(goal.domain_id)}
              onEdit={(id) => router.push(`/mi-plan/metas/${id}`)}
              onArchive={handleArchive}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* New goal dialog */}
      <Dialog open={showNewGoal} onOpenChange={setShowNewGoal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Meta</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="goalTitle">Título *</Label>
              <Input
                id="goalTitle"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ej: Mejorar mi condición física"
              />
            </div>

            <div className="space-y-2">
              <Label>Dominio de vida (opcional)</Label>
              <Select
                value={newDomainId || 'none'}
                onValueChange={(value) => setNewDomainId(value === 'none' ? null : value)}
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
              <Label htmlFor="goalMetric">Métrica (opcional)</Label>
              <Input
                id="goalMetric"
                value={newMetric}
                onChange={(e) => setNewMetric(e.target.value)}
                placeholder="Ej: Correr 5km en menos de 30 min"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goalDate">Fecha objetivo (opcional)</Label>
              <Input
                id="goalDate"
                type="date"
                value={newTargetDate}
                onChange={(e) => setNewTargetDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewGoal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateGoal} disabled={creating || !newTitle.trim()}>
              {creating ? 'Creando...' : 'Crear meta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
