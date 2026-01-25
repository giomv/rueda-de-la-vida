'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { ReflectionFields } from '@/components/odyssey/ReflectionFields';
import { useOdysseyStore } from '@/lib/stores/odyssey-store';
import { getOdysseyData, savePrototypeReflection, completePrototype } from '@/lib/actions/odyssey-actions';

export default function ReflexionPage() {
  const params = useParams();
  const router = useRouter();
  const odysseyId = params.odysseyId as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [learned, setLearned] = useState('');
  const [adjust, setAdjust] = useState('');
  const [nextStep, setNextStep] = useState('');

  const { prototype, setOdysseyId, hydrate } = useOdysseyStore();

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

      if (data.prototype) {
        setLearned(data.prototype.reflection_learned || '');
        setAdjust(data.prototype.reflection_adjust || '');
        setNextStep(data.prototype.reflection_next_step || '');
      }
      setLoading(false);
    }
    load();
  }, [odysseyId]);

  const handleComplete = async () => {
    if (!prototype?.id) return;
    setSaving(true);

    await savePrototypeReflection(prototype.id, {
      reflection_learned: learned,
      reflection_adjust: adjust,
      reflection_next_step: nextStep,
    });

    await completePrototype(prototype.id);
    router.push(`/plan-de-vida/${odysseyId}/resultado`);
  };

  const handleSaveDraft = async () => {
    if (!prototype?.id) return;
    setSaving(true);
    await savePrototypeReflection(prototype.id, {
      reflection_learned: learned,
      reflection_adjust: adjust,
      reflection_next_step: nextStep,
    });
    setSaving(false);
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
      <div className="flex-1 p-4 md:p-6 max-w-3xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-xl font-bold mb-1">Reflexión Final</h1>
          <p className="text-sm text-muted-foreground">
            Reflexiona sobre tu experiencia de 30 días prototipando este plan.
          </p>
        </div>

        <ReflectionFields
          learned={learned}
          adjust={adjust}
          nextStep={nextStep}
          onLearnedChange={setLearned}
          onAdjustChange={setAdjust}
          onNextStepChange={setNextStep}
        />
      </div>

      <div className="sticky bottom-16 md:bottom-0 border-t bg-background p-4">
        <div className="max-w-3xl mx-auto flex justify-between">
          <Button variant="outline" onClick={() => router.push(`/plan-de-vida/${odysseyId}/prototipo/seguimiento`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Seguimiento
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
              Guardar borrador
            </Button>
            <Button onClick={handleComplete} disabled={saving}>
              {saving ? 'Guardando...' : 'Completar'}
              <CheckCircle2 className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
