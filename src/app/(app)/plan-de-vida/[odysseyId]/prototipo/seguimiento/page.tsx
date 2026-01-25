'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { WeeklyChecklist } from '@/components/odyssey/WeeklyChecklist';
import { useOdysseyStore } from '@/lib/stores/odyssey-store';
import { useOdysseyAutoSave } from '@/hooks/use-odyssey-auto-save';
import { getOdysseyData, saveWeeklyCheck } from '@/lib/actions/odyssey-actions';
import { PROTOTYPE_STEP_TYPES } from '@/lib/types';
import type { OdysseyWeeklyCheck } from '@/lib/types';

export default function SeguimientoPage() {
  const params = useParams();
  const router = useRouter();
  const odysseyId = params.odysseyId as string;
  const [loading, setLoading] = useState(true);

  const {
    prototype, prototypeSteps, weeklyChecks,
    setOdysseyId, hydrate, updateWeeklyCheck, isDirty,
  } = useOdysseyStore();

  useEffect(() => {
    async function load() {
      const data = await getOdysseyData(odysseyId);
      setOdysseyId(odysseyId);
      hydrate({
        plans: data.plans,
        activePlanNumber: data.odyssey.active_plan_number,
        prototype: data.prototype,
        prototypeSteps: data.prototypeSteps,
        weeklyChecks: data.weeklyChecks,
      });
      setLoading(false);
    }
    load();
  }, [odysseyId]);

  // Calculate current week based on start date
  const getCurrentWeek = () => {
    if (!prototype?.start_date) return 1;
    const start = new Date(prototype.start_date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const week = Math.min(4, Math.max(1, Math.ceil((diffDays + 1) / 7)));
    return week;
  };

  const currentWeek = getCurrentWeek();

  const saveFn = useCallback(async () => {
    if (!prototype?.id) return;
    const state = useOdysseyStore.getState();
    for (const check of state.weeklyChecks) {
      await saveWeeklyCheck(prototype.id, check.week_number, {
        conversation_done: check.conversation_done,
        experiment_done: check.experiment_done,
        skill_done: check.skill_done,
        notes: check.notes || undefined,
      });
    }
  }, [prototype?.id]);

  const { isSaving } = useOdysseyAutoSave(saveFn);

  const handleUpdate = (weekNumber: number, updates: Partial<OdysseyWeeklyCheck>) => {
    updateWeeklyCheck(weekNumber, updates);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  const daysRemaining = prototype?.start_date
    ? Math.max(0, 30 - Math.floor((new Date().getTime() - new Date(prototype.start_date).getTime()) / (1000 * 60 * 60 * 24)))
    : 30;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold mb-1">Seguimiento del Prototipo</h1>
            <p className="text-sm text-muted-foreground">
              Semana {currentWeek} de 4 &middot; {daysRemaining} días restantes
            </p>
          </div>
          <Badge variant={daysRemaining > 7 ? 'outline' : 'destructive'}>
            {daysRemaining > 0 ? `${daysRemaining}d` : 'Completado'}
          </Badge>
        </div>

        {/* Prototype steps summary */}
        {prototypeSteps.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Mis compromisos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {prototypeSteps.map((step) => {
                  const typeInfo = PROTOTYPE_STEP_TYPES.find((t) => t.key === step.step_type);
                  return (
                    <div key={step.id} className="flex items-center gap-2 text-sm">
                      <span>{typeInfo?.icon}</span>
                      <span className="font-medium">{typeInfo?.label}:</span>
                      <span className="text-muted-foreground">{step.title}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <WeeklyChecklist
          weeklyChecks={weeklyChecks}
          currentWeek={currentWeek}
          onUpdate={handleUpdate}
        />

        {isSaving && (
          <p className="text-xs text-muted-foreground">Guardando...</p>
        )}
      </div>

      <div className="sticky bottom-16 md:bottom-0 border-t bg-background p-4">
        <div className="max-w-4xl mx-auto flex justify-between">
          <Button variant="outline" onClick={() => router.push(`/plan-de-vida/${odysseyId}/prototipo`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Configuración
          </Button>
          <Button onClick={() => router.push(`/plan-de-vida/${odysseyId}/prototipo/reflexion`)}>
            Reflexión final
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
