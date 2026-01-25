'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { OdysseyProgress } from '@/components/odyssey/OdysseyProgress';
import { PrototypeSetup } from '@/components/odyssey/PrototypeSetup';
import { MilestoneSelector } from '@/components/odyssey/MilestoneSelector';
import { useOdysseyStore } from '@/lib/stores/odyssey-store';
import {
  getOdysseyData, createPrototype, savePrototypeSteps, updatePrototypeMilestone,
} from '@/lib/actions/odyssey-actions';
import { getOrCreateDomains } from '@/lib/actions/domain-actions';
import { PLAN_TYPES } from '@/lib/types';
import type { PrototypeStepType, OdysseyMilestone } from '@/lib/types';

export default function PrototipoPage() {
  const params = useParams();
  const router = useRouter();
  const odysseyId = params.odysseyId as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [planMilestones, setPlanMilestones] = useState<OdysseyMilestone[]>([]);
  const [steps, setSteps] = useState<{ step_type: PrototypeStepType; title: string; description: string }[]>([
    { step_type: 'conversation', title: '', description: '' },
    { step_type: 'experiment', title: '', description: '' },
    { step_type: 'skill', title: '', description: '' },
  ]);

  const { plans, activePlanNumber, prototype, domains, setOdysseyId, hydrate, setDomains } = useOdysseyStore();

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

      // Set selected milestone from existing prototype
      if (data.prototype?.target_milestone_id) {
        setSelectedMilestoneId(data.prototype.target_milestone_id);
      }

      if (data.prototypeSteps.length > 0) {
        setSteps(data.prototypeSteps.map((s) => ({
          step_type: s.step_type as PrototypeStepType,
          title: s.title,
          description: s.description || '',
        })));
      }

      setLoading(false);
    }
    load();
  }, [odysseyId]);

  const activePlan = plans.find((p) => p.plan_number === activePlanNumber);
  const planType = activePlanNumber ? PLAN_TYPES.find((p) => p.number === activePlanNumber) : null;
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
      await savePrototypeSteps(prototypeId, validSteps);
    }

    router.push(`/plan-de-vida/${odysseyId}/prototipo/seguimiento`);
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
          <h1 className="text-xl font-bold mb-1">Configura tu Prototipo</h1>
          <p className="text-sm text-muted-foreground">
            Selecciona un hito y define 3 acciones para prototiparlo durante 30 días.
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
          <h2 className="text-sm font-semibold mb-2">1. Selecciona el hito a prototipar</h2>
          <p className="text-xs text-muted-foreground mb-3">
            Elige el hito que quieres comenzar a prototipar. Las acciones que definas deben ayudarte a avanzar hacia este hito.
          </p>
          <MilestoneSelector
            milestones={planMilestones}
            selectedId={selectedMilestoneId}
            onSelect={setSelectedMilestoneId}
            domains={domains}
          />
        </div>

        {/* Prototype Actions */}
        <div>
          <h2 className="text-sm font-semibold mb-2">2. Define tus acciones</h2>
          <p className="text-xs text-muted-foreground mb-3">
            {selectedMilestone ? (
              <>
                Define 3 acciones para avanzar hacia: <span className="font-medium">&ldquo;{selectedMilestone.title}&rdquo;</span>
              </>
            ) : (
              'Selecciona un hito arriba para personalizar tus acciones.'
            )}
          </p>
          <PrototypeSetup steps={steps} onChange={setSteps} />
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
            disabled={saving || steps.every((s) => !s.title.trim()) || (planMilestones.length > 0 && !selectedMilestoneId)}
          >
            {saving ? 'Guardando...' : 'Iniciar 30 días'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
