'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { FrequencySelector } from './FrequencySelector';
import { createActivity, updateActivity } from '@/lib/actions/lifeplan-actions';
import { createGoal } from '@/lib/actions/goal-actions';
import { cn } from '@/lib/utils';
import type { LifePlanActivity, FrequencyType, CreateActivityInput, SourceType, Goal } from '@/lib/types/lifeplan';
import type { LifeDomain } from '@/lib/types';

interface ActivityFormProps {
  activity?: LifePlanActivity;
  domains: LifeDomain[];
  goals: Goal[];
  onSave?: (activity: LifePlanActivity) => void;
  onCancel?: () => void;
  onGoalCreated?: (goal: Goal) => void;
  className?: string;
}

const getOriginSuffix = (origin: SourceType): string => {
  switch (origin) {
    case 'ODYSSEY':
      return ' (PV)';
    case 'WHEEL':
      return ' (RV)';
    default:
      return '';
  }
};

export function ActivityForm({
  activity,
  domains,
  goals,
  onSave,
  onCancel,
  onGoalCreated,
  className,
}: ActivityFormProps) {
  const router = useRouter();
  const isEditing = !!activity;

  // Form state
  const [title, setTitle] = useState(activity?.title || '');
  const [notes, setNotes] = useState(activity?.notes || '');
  const [domainId, setDomainId] = useState<string | null>(activity?.domain_id || null);
  const [goalId, setGoalId] = useState<string | null>(activity?.goal_id || null);
  const [frequencyType, setFrequencyType] = useState<FrequencyType>(
    activity?.frequency_type || 'WEEKLY'
  );
  const [frequencyValue, setFrequencyValue] = useState(activity?.frequency_value || 1);
  const [scheduledDays, setScheduledDays] = useState<string[]>(
    activity?.scheduled_days || []
  );
  const [timeOfDay, setTimeOfDay] = useState(activity?.time_of_day || '');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New goal dialog state
  const [showNewGoalDialog, setShowNewGoalDialog] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalMetric, setNewGoalMetric] = useState('');
  const [creatingGoal, setCreatingGoal] = useState(false);

  // Filter goals by selected domain
  const filteredGoals = domainId
    ? goals.filter((g) => g.domain_id === domainId || !g.domain_id)
    : goals;

  const handleGoalSelection = (value: string) => {
    if (value === 'none') {
      setGoalId(null);
    } else if (value === 'new') {
      setShowNewGoalDialog(true);
    } else {
      setGoalId(value);
    }
  };

  const handleCreateGoal = async () => {
    if (!newGoalTitle.trim()) return;

    setCreatingGoal(true);
    try {
      const newGoal = await createGoal({
        title: newGoalTitle.trim(),
        domain_id: domainId,
        metric: newGoalMetric.trim() || undefined,
      });

      setGoalId(newGoal.id);
      onGoalCreated?.(newGoal);
      setShowNewGoalDialog(false);
      setNewGoalTitle('');
      setNewGoalMetric('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear meta');
    } finally {
      setCreatingGoal(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('El título es requerido');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const input: CreateActivityInput = {
        title: title.trim(),
        notes: notes.trim() || undefined,
        domain_id: domainId,
        goal_id: goalId,
        frequency_type: frequencyType,
        frequency_value: frequencyValue,
        scheduled_days: scheduledDays.length > 0 ? scheduledDays : undefined,
        time_of_day: timeOfDay || null,
      };

      let saved: LifePlanActivity;
      if (isEditing && activity) {
        saved = await updateActivity(activity.id, input);
      } else {
        saved = await createActivity(input);
      }

      onSave?.(saved);
      router.push('/mi-plan/hoy');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
          {error}
        </div>
      )}

      {/* Basic info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Meditar 10 minutos"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Agrega detalles o instrucciones..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Categorization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categorización</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Dominio de vida (opcional)</Label>
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
            <Label>Meta relacionada (opcional)</Label>
            <Select
              value={goalId || 'none'}
              onValueChange={handleGoalSelection}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar meta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin meta</SelectItem>
                <SelectSeparator />
                <SelectItem value="new">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva meta
                </SelectItem>
                {filteredGoals.length > 0 && (
                  <>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectLabel>Metas actuales</SelectLabel>
                      {filteredGoals.map((goal) => (
                        <SelectItem key={goal.id} value={goal.id}>
                          {goal.title}{getOriginSuffix(goal.origin)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Frequency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Frecuencia</CardTitle>
        </CardHeader>
        <CardContent>
          <FrequencySelector
            frequencyType={frequencyType}
            frequencyValue={frequencyValue}
            scheduledDays={scheduledDays}
            onFrequencyTypeChange={setFrequencyType}
            onFrequencyValueChange={setFrequencyValue}
            onScheduledDaysChange={setScheduledDays}
          />
        </CardContent>
      </Card>

      {/* Time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Horario (opcional)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="timeOfDay">Hora del día</Label>
            <Input
              id="timeOfDay"
              type="time"
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Agrega un horario para recordatorios (próximamente)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSaving} className="flex-1">
          {isSaving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear acción'}
        </Button>
      </div>

      {/* New Goal Dialog */}
      <Dialog open={showNewGoalDialog} onOpenChange={setShowNewGoalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newGoalTitle">Título *</Label>
              <Input
                id="newGoalTitle"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                placeholder="Ej: Correr un maratón"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newGoalMetric">Métrica (opcional)</Label>
              <Input
                id="newGoalMetric"
                value={newGoalMetric}
                onChange={(e) => setNewGoalMetric(e.target.value)}
                placeholder="Ej: 42 km en menos de 4 horas"
              />
            </div>
            {domainId && (
              <p className="text-xs text-muted-foreground">
                Esta meta se vinculará al dominio seleccionado.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNewGoalDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCreateGoal}
              disabled={creatingGoal || !newGoalTitle.trim()}
            >
              {creatingGoal ? 'Creando...' : 'Crear meta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
