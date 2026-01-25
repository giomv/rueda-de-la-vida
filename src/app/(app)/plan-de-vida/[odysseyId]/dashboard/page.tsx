'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { OdysseyProgress } from '@/components/odyssey/OdysseyProgress';
import { DashboardSliders } from '@/components/odyssey/DashboardSliders';
import { ExcitementConcern } from '@/components/odyssey/ExcitementConcern';
import { useOdysseyStore } from '@/lib/stores/odyssey-store';
import { useOdysseyAutoSave } from '@/hooks/use-odyssey-auto-save';
import { getOdysseyData, savePlanDashboard, updateOdyssey } from '@/lib/actions/odyssey-actions';
import { PLAN_TYPES } from '@/lib/types';

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const odysseyId = params.odysseyId as string;
  const [loading, setLoading] = useState(true);

  const {
    plans, setOdysseyId, hydrate, updatePlanDashboard, isDirty,
  } = useOdysseyStore();

  useEffect(() => {
    async function load() {
      const data = await getOdysseyData(odysseyId);
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

  const saveFn = useCallback(async () => {
    const state = useOdysseyStore.getState();
    for (const plan of state.plans) {
      await savePlanDashboard(plan.id, {
        energy_score: plan.energy_score ?? undefined,
        confidence_score: plan.confidence_score ?? undefined,
        resources_score: plan.resources_score ?? undefined,
        excitement_text: plan.excitement_text ?? undefined,
        concern_text: plan.concern_text ?? undefined,
      });
    }
  }, []);

  const { isSaving } = useOdysseyAutoSave(saveFn);

  const handleContinue = async () => {
    await saveFn();
    await updateOdyssey(odysseyId, { current_step: 'comparacion' });
    router.push(`/plan-de-vida/${odysseyId}/comparacion`);
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
      <OdysseyProgress currentStep="dashboard" />

      <div className="flex-1 p-4 md:p-6 max-w-3xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-xl font-bold mb-1">Dashboard de Planes</h1>
          <p className="text-sm text-muted-foreground">
            Evalúa cada plan con los indicadores y escribe tus emociones.
          </p>
        </div>

        {plans.map((plan) => {
          const planType = PLAN_TYPES.find((p) => p.number === plan.plan_number);

          return (
            <Card key={plan.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Plan {plan.plan_number}: {planType?.title || ''}
                </CardTitle>
                {plan.headline && (
                  <p className="text-xs text-muted-foreground">{plan.headline}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <DashboardSliders
                  plan={plan}
                  onChange={(key, value) => updatePlanDashboard(plan.id, { [key]: value })}
                />
                <ExcitementConcern
                  excitement={plan.excitement_text || ''}
                  concern={plan.concern_text || ''}
                  onExcitementChange={(v) => updatePlanDashboard(plan.id, { excitement_text: v })}
                  onConcernChange={(v) => updatePlanDashboard(plan.id, { concern_text: v })}
                />
              </CardContent>
            </Card>
          );
        })}

        {isSaving && (
          <p className="text-xs text-muted-foreground">Guardando...</p>
        )}
      </div>

      <div className="sticky bottom-16 md:bottom-0 border-t bg-background p-4">
        <div className="max-w-3xl mx-auto flex justify-between">
          <Button variant="outline" onClick={() => router.push(`/plan-de-vida/${odysseyId}/preguntas`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Preguntas
          </Button>
          <Button onClick={handleContinue} disabled={isDirty || isSaving}>
            Ver Comparación
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
