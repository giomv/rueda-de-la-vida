'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Plus, X } from 'lucide-react';
import { OdysseyProgress } from '@/components/odyssey/OdysseyProgress';
import { PrototypeSetup } from '@/components/odyssey/PrototypeSetup';
import { MilestoneSelector } from '@/components/odyssey/MilestoneSelector';
import { useOdysseyStore } from '@/lib/stores/odyssey-store';
import {
  getOdysseyData, createPrototype, savePrototypeSteps, savePrototypeActions, updatePrototypeMilestone,
} from '@/lib/actions/odyssey-actions';
import { importActionsFromOdyssey, importFromOdyssey } from '@/lib/actions/import-actions';
import { getOrCreateDomains } from '@/lib/actions/domain-actions';
import { FREQUENCY_OPTIONS } from '@/lib/types';
import type { PrototypeStepType, OdysseyMilestone, OdysseyPrototypeStep, OdysseyPrototypeAction, FrequencyType } from '@/lib/types';

type StepInput = { step_type: PrototypeStepType; title: string; description: string };
type ActionInput = { id: string; text: string; frequency_type: FrequencyType };

const DEFAULT_STEPS: StepInput[] = [
  { step_type: 'conversation', title: '', description: '' },
  { step_type: 'experiment', title: '', description: '' },
  { step_type: 'skill', title: '', description: '' },
];

export default function PrototipoPage() {
  const params = useParams();
  const router = useRouter();
  const odysseyId = params.odysseyId as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [planMilestones, setPlanMilestones] = useState<OdysseyMilestone[]>([]);
  // Store steps per milestone: milestoneId -> steps
  const [stepsByMilestone, setStepsByMilestone] = useState<Record<string, StepInput[]>>({});
  // Store actions per milestone: milestoneId -> actions
  const [actionsByMilestone, setActionsByMilestone] = useState<Record<string, ActionInput[]>>({});
  // New action input state
  const [newActionText, setNewActionText] = useState('');
  const [newActionFrequency, setNewActionFrequency] = useState<FrequencyType>('WEEKLY');

  const { plans, activePlanNumber, prototype, domains, setOdysseyId, hydrate, setDomains } = useOdysseyStore();

  // Get current steps for selected milestone
  const steps = selectedMilestoneId
    ? (stepsByMilestone[selectedMilestoneId] || [...DEFAULT_STEPS])
    : [...DEFAULT_STEPS];

  const setSteps = (newSteps: StepInput[]) => {
    if (!selectedMilestoneId) return;
    setStepsByMilestone((prev) => ({
      ...prev,
      [selectedMilestoneId]: newSteps,
    }));
  };

  // Get current actions for selected milestone
  const actions = selectedMilestoneId
    ? (actionsByMilestone[selectedMilestoneId] || [])
    : [];

  const addAction = () => {
    if (!selectedMilestoneId || !newActionText.trim()) return;
    const newAction: ActionInput = {
      id: crypto.randomUUID(),
      text: newActionText.trim(),
      frequency_type: newActionFrequency,
    };
    setActionsByMilestone((prev) => ({
      ...prev,
      [selectedMilestoneId]: [...(prev[selectedMilestoneId] || []), newAction],
    }));
    setNewActionText('');
    setNewActionFrequency('WEEKLY');
  };

  const removeAction = (actionId: string) => {
    if (!selectedMilestoneId) return;
    setActionsByMilestone((prev) => ({
      ...prev,
      [selectedMilestoneId]: (prev[selectedMilestoneId] || []).filter((a) => a.id !== actionId),
    }));
  };

  useEffect(() => {
    async function load() {
      const [data, userDomains] = await Promise.all([
        getOdysseyData(odysseyId),
        getOrCreateDomains(),
      ]);
      setOdysseyId(odysseyId);
      setDomains(userDomains);
      hydrate({
        plans: data.plans,
        milestones: Object.fromEntries(data.plans.map((p) => [p.id, p.milestones])),
        feedback: Object.fromEntries(data.plans.map((p) => [p.id, p.feedback])),
        activePlanNumber: data.odyssey.active_plan_number,
        prototype: data.prototype,
        prototypeSteps: data.prototypeSteps,
        weeklyChecks: data.weeklyChecks,
      });

      // Get milestones for the active plan
      const activePlan = data.plans.find((p) => p.plan_number === data.odyssey.active_plan_number);
      if (activePlan) {
        setPlanMilestones(activePlan.milestones);
      }

      // Group existing steps by milestone_id
      const stepsMap: Record<string, StepInput[]> = {};
      data.prototypeSteps.forEach((s: OdysseyPrototypeStep) => {
        const key = s.milestone_id || '_legacy';
        if (!stepsMap[key]) {
          stepsMap[key] = [];
        }
        stepsMap[key].push({
          step_type: s.step_type as PrototypeStepType,
          title: s.title,
          description: s.description || '',
        });
      });
      setStepsByMilestone(stepsMap);

      // Group existing actions by milestone_id
      const actionsMap: Record<string, ActionInput[]> = {};
      data.prototypeActions.forEach((a: OdysseyPrototypeAction) => {
        const key = a.milestone_id || '_legacy';
        if (!actionsMap[key]) {
          actionsMap[key] = [];
        }
        actionsMap[key].push({
          id: a.id,
          text: a.text,
          frequency_type: a.frequency_type,
        });
      });
      setActionsByMilestone(actionsMap);

      // Set selected milestone from existing prototype
      if (data.prototype?.target_milestone_id) {
        setSelectedMilestoneId(data.prototype.target_milestone_id);
      }

      setLoading(false);
    }
    load();
  }, [odysseyId]);

  const activePlan = plans.find((p) => p.plan_number === activePlanNumber);
  const selectedMilestone = planMilestones.find((m) => m.id === selectedMilestoneId);

  const handleStart = async () => {
    if (!activePlan) return;
    setSaving(true);

    let prototypeId = prototype?.id;

    if (!prototypeId) {
      const newPrototype = await createPrototype(odysseyId, activePlan.id, selectedMilestoneId);
      prototypeId = newPrototype.id;
    } else if (selectedMilestoneId !== prototype?.target_milestone_id) {
      // Update milestone if changed
      await updatePrototypeMilestone(prototypeId, selectedMilestoneId);
    }

    const validSteps = steps.filter((s) => s.title.trim());
    if (validSteps.length > 0) {
      await savePrototypeSteps(prototypeId, validSteps, selectedMilestoneId);
    }

    // Save actions for this milestone
    if (actions.length > 0) {
      await savePrototypeActions(
        prototypeId,
        actions.map((a) => ({ text: a.text, frequency_type: a.frequency_type })),
        selectedMilestoneId
      );
    }

    // Auto-import actions and steps to Mi Plan
    await importActionsFromOdyssey(prototypeId);
    await importFromOdyssey(prototypeId);

    router.push('/mi-plan');
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <OdysseyProgress currentStep="prototipo" />

      <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-xl font-bold mb-1">Diseño de vida</h1>
          <p className="text-sm text-muted-foreground">
            Ahora selecciona una de tus metas y genera 3 acciones para acercarte a lograrla.
          </p>
        </div>

        {activePlan?.headline && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <span className="text-muted-foreground">Plan {activePlanNumber}:</span>{' '}
              <span className="italic">&ldquo;{activePlan.headline}&rdquo;</span>
            </p>
          </div>
        )}

        {/* Milestone Selection */}
        <div>
          <h2 className="text-sm font-semibold mb-2">1. Selecciona la meta a prototipar</h2>
          <p className="text-xs text-muted-foreground mb-3">
            Elige la meta que quieres comenzar a prototipar. Las acciones que definas deben ayudarte a avanzar hacia esta meta.
          </p>
          <MilestoneSelector
            milestones={planMilestones}
            selectedId={selectedMilestoneId}
            onSelect={setSelectedMilestoneId}
            domains={domains}
          />
        </div>

        {/* Prototype Exploration */}
        <div>
          <h2 className="text-sm font-semibold mb-2">2. Explora tus próximos pasos</h2>
          <p className="text-xs text-muted-foreground mb-3">
            {selectedMilestone ? (
              <>
                Responde sobre qué acciones te servirían para llegar a cumplir tu meta: <span className="font-medium">&ldquo;{selectedMilestone.title}&rdquo;</span>
              </>
            ) : (
              'Selecciona una meta arriba para personalizar tus acciones.'
            )}
          </p>
          <PrototypeSetup steps={steps} onChange={setSteps} />
        </div>

        {/* Specific Actions */}
        <div>
          <h2 className="text-sm font-semibold mb-2">3. Define tus acciones</h2>
          <p className="text-xs text-muted-foreground mb-3">
            En base a lo que has explorado, define acciones específicas.
          </p>

          {selectedMilestoneId ? (
            <Card>
              <CardContent className="pt-4 space-y-4">
                {/* Existing actions */}
                {actions.length > 0 && (
                  <div className="space-y-2">
                    {actions.map((action) => {
                      const freqLabel = FREQUENCY_OPTIONS.find((f) => f.key === action.frequency_type)?.label || action.frequency_type;
                      return (
                        <div key={action.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg group">
                          <span className="flex-1 text-sm">{action.text}</span>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            {freqLabel}
                          </span>
                          <button
                            onClick={() => removeAction(action.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                          >
                            <X className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add new action */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Nueva acción..."
                    value={newActionText}
                    onChange={(e) => setNewActionText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addAction()}
                    className="flex-1"
                  />
                  <Select
                    value={newActionFrequency}
                    onValueChange={(val) => setNewActionFrequency(val as FrequencyType)}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.key} value={opt.key}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={addAction}
                    disabled={!newActionText.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Selecciona una meta arriba para definir acciones.
            </p>
          )}
        </div>
      </div>

      <div className="sticky bottom-16 md:bottom-0 border-t bg-background p-4">
        <div className="max-w-5xl mx-auto flex justify-between">
          <Button variant="outline" onClick={() => router.push(`/plan-de-vida/${odysseyId}/comparacion`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Comparación
          </Button>
          <Button
            onClick={handleStart}
            disabled={saving || (steps.every((s) => !s.title.trim()) && actions.length === 0) || (planMilestones.length > 0 && !selectedMilestoneId)}
          >
            {saving ? 'Guardando...' : 'Iniciar mi plan'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
