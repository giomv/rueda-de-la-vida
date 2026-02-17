'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { OdysseyProgress } from '@/components/odyssey/OdysseyProgress';
import { ComparisonGrid } from '@/components/odyssey/ComparisonGrid';
import { ComparisonInsights } from '@/components/odyssey/ComparisonInsights';
import { useOdysseyStore } from '@/lib/stores/odyssey-store';
import { getOdysseyData, selectActivePlan, updateOdyssey } from '@/lib/actions/odyssey-actions';
import { getGoalAssignmentCountsByPlan } from '@/lib/actions/odyssey-goal-actions';
import type { PlanWithMilestones } from '@/lib/types';

export default function ComparacionPage() {
  const params = useParams();
  const router = useRouter();
  const odysseyId = params.odysseyId as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [goalCounts, setGoalCounts] = useState<Record<string, number>>({});

  const {
    plans, activePlanNumber, setOdysseyId, hydrate, setActivePlanNumber,
  } = useOdysseyStore();

  useEffect(() => {
    async function load() {
      const [data, counts] = await Promise.all([
        getOdysseyData(odysseyId),
        getGoalAssignmentCountsByPlan(odysseyId),
      ]);
      setGoalCounts(counts);
      setOdysseyId(odysseyId);
      hydrate({
        plans: data.plans,
        milestones: Object.fromEntries(data.plans.map((p) => [p.id, p.milestones])),
        feedback: Object.fromEntries(data.plans.map((p) => [p.id, p.feedback])),
        activePlanNumber: data.odyssey.active_plan_number,
      });
      setLoading(false);
    }
    load();
  }, [odysseyId]);

  const handleSelectPlan = async (planNumber: number) => {
    setActivePlanNumber(planNumber);
    await selectActivePlan(odysseyId, planNumber);
  };

  const handleContinue = async () => {
    if (!activePlanNumber) return;
    setSaving(true);
    await updateOdyssey(odysseyId, { current_step: 'prototipo' });
    router.push(`/plan-de-vida/${odysseyId}/prototipo`);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  // Build PlanWithMilestones from store
  const milestones = useOdysseyStore.getState().milestones;
  const storedFeedback = useOdysseyStore.getState().feedback;
  const plansWithData: PlanWithMilestones[] = plans.map((p) => ({
    ...p,
    milestones: milestones[p.id] || [],
    feedback: storedFeedback[p.id] || [],
  }));

  return (
    <div className="flex flex-col h-full">
      <OdysseyProgress currentStep="comparacion" />

      <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-xl font-bold mb-1">Comparación de Planes</h1>
          <p className="text-sm text-muted-foreground">
            Compara tus 3 planes y elige el que quieres prototipar durante 30 días.
          </p>
        </div>

        <ComparisonGrid
          plans={plansWithData}
          activePlanNumber={activePlanNumber}
          onSelectPlan={handleSelectPlan}
          goalCounts={goalCounts}
        />

        <ComparisonInsights plans={plansWithData} goalCounts={goalCounts} />

        {!activePlanNumber && (
          <p className="text-sm text-muted-foreground text-center">
            Haz clic en un plan para seleccionarlo como tu plan activo.
          </p>
        )}
      </div>

      <div className="sticky bottom-16 md:bottom-0 border-t bg-background p-4">
        <div className="max-w-5xl mx-auto flex justify-between">
          <Button variant="outline" onClick={() => router.push(`/plan-de-vida/${odysseyId}/plan-3`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Plan 3
          </Button>
          <Button onClick={handleContinue} disabled={!activePlanNumber || saving}>
            {saving ? 'Guardando...' : 'Configurar Prototipo'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
