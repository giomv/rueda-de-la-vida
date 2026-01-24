'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { WizardProgress } from '@/components/app/WizardProgress';
import { IdealLifeForm } from '@/components/reflection/IdealLifeForm';
import { getWheelData, saveIdealLife } from '@/lib/actions/wheel-actions';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import type { Domain } from '@/lib/types';

interface DomainIdealState {
  visionText: string;
  promptAnswers: Record<string, string>;
}

export default function VidaIdealPage() {
  const params = useParams();
  const router = useRouter();
  const wheelId = params.wheelId as string;

  const [loading, setLoading] = useState(true);
  const [focusDomains, setFocusDomains] = useState<Domain[]>([]);
  const [idealState, setIdealState] = useState<Record<string, DomainIdealState>>({});

  useEffect(() => {
    async function load() {
      const data = await getWheelData(wheelId);
      const focusIds = data.priorities
        .filter((p) => p.is_focus)
        .map((p) => p.domain_id);
      const focus = data.domains.filter((d) => focusIds.includes(d.id));
      setFocusDomains(focus);

      const state: Record<string, DomainIdealState> = {};
      focus.forEach((domain) => {
        const existing = data.idealLife.find((il) => il.domain_id === domain.id);
        state[domain.id] = {
          visionText: existing?.vision_text || '',
          promptAnswers: (existing?.prompts_answers as Record<string, string>) || {},
        };
      });
      setIdealState(state);
      setLoading(false);
    }
    load();
  }, [wheelId]);

  const handleVisionChange = (domainId: string, text: string) => {
    setIdealState((prev) => ({
      ...prev,
      [domainId]: { ...prev[domainId], visionText: text },
    }));
  };

  const handlePromptChange = (domainId: string, promptKey: string, answer: string) => {
    setIdealState((prev) => ({
      ...prev,
      [domainId]: {
        ...prev[domainId],
        promptAnswers: { ...prev[domainId].promptAnswers, [promptKey]: answer },
      },
    }));
  };

  const handleContinue = async () => {
    const items = Object.entries(idealState).map(([domainId, state]) => ({
      domain_id: domainId,
      vision_text: state.visionText,
      prompts_answers: state.promptAnswers,
    }));
    await saveIdealLife(wheelId, items);
    router.push(`/rueda/${wheelId}/plan`);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-48 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <WizardProgress currentStep={5} completedSteps={[0, 1, 2, 3, 4]} />

      <div className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-xl font-bold mb-1">Tu vida ideal</h1>
          <p className="text-sm text-muted-foreground">
            Para cada área de enfoque, describe cómo sería un 10/10.
          </p>
        </div>

        {focusDomains.map((domain) => (
          <IdealLifeForm
            key={domain.id}
            domain={domain}
            visionText={idealState[domain.id]?.visionText || ''}
            promptAnswers={idealState[domain.id]?.promptAnswers || {}}
            onVisionChange={(text) => handleVisionChange(domain.id, text)}
            onPromptChange={(promptKey, answer) =>
              handlePromptChange(domain.id, promptKey, answer)
            }
          />
        ))}
      </div>

      <div className="sticky bottom-16 md:bottom-0 p-4 border-t border-border bg-background">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/rueda/${wheelId}/reflexion`)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Reflexión
          </Button>
          <Button onClick={handleContinue} className="flex-1">
            Plan de acción
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
