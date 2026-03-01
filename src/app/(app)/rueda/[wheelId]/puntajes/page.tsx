'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { WizardProgress } from '@/components/app/WizardProgress';
import { ScoreSlider } from '@/components/wheel/ScoreSlider';
import { useWizardStore } from '@/lib/stores/wizard-store';
import { useAutoSave } from '@/hooks/use-auto-save';
import { saveScores, getWheelData } from '@/lib/actions/wheel-actions';
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';

export default function PuntajesPage() {
  const params = useParams();
  const router = useRouter();
  const wheelId = params.wheelId as string;
  const [loading, setLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  const { domains, scores, updateScore, setWheelId, hydrate, isDirty } =
    useWizardStore();

  useEffect(() => {
    async function load() {
      const data = await getWheelData(wheelId);
      setWheelId(wheelId);

      // Initialize default scores (5) for domains that don't have a score yet
      const existingScoreIds = new Set(data.scores.map((s) => s.domain_id));
      const defaultScores = data.domains
        .filter((d) => !existingScoreIds.has(d.id))
        .map((d) => ({
          id: crypto.randomUUID(),
          wheel_id: wheelId,
          domain_id: d.id,
          score: 5,
          notes: null,
          scored_at: new Date().toISOString(),
        }));

      hydrate({
        domains: data.domains,
        scores: [...data.scores, ...defaultScores],
      });

      // Mark as dirty if we added default scores so they get saved
      if (defaultScores.length > 0) {
        useWizardStore.setState({ isDirty: true });
      }

      setLoading(false);
    }
    load();
  }, [wheelId, setWheelId, hydrate]);

  const saveFn = useCallback(async () => {
    const scoreData = scores.map((s) => ({
      domain_id: s.domain_id,
      score: s.score,
      notes: s.notes ?? undefined,
    }));
    if (scoreData.length > 0) {
      await saveScores(wheelId, scoreData);
    }
  }, [wheelId, scores]);

  const { isSaving } = useAutoSave(saveFn);

  const scoredCount = domains.filter((d) =>
    scores.some((s) => s.domain_id === d.id)
  ).length;

  const handleContinue = async () => {
    setIsNavigating(true);
    try {
      await saveFn();
      router.push(`/rueda/${wheelId}/resultado`);
    } finally {
      setIsNavigating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <WizardProgress currentStep={1} completedSteps={[0]} />

      <div className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold mb-1">Puntúa cada área</h1>
            <p className="text-sm text-muted-foreground">
              Del 0 (muy insatisfecho) al 10 (plenamente satisfecho)
            </p>
          </div>
          <span className="text-sm text-muted-foreground">
            {scoredCount}/{domains.length}
          </span>
        </div>

        <div className="space-y-3">
          {domains.map((domain) => {
            const existingScore = scores.find((s) => s.domain_id === domain.id);
            return (
              <ScoreSlider
                key={domain.id}
                domain={domain}
                score={existingScore?.score ?? 5}
                notes={existingScore?.notes ?? ''}
                onScoreChange={(score) => updateScore(domain.id, score)}
                onNotesChange={(notes) =>
                  updateScore(domain.id, existingScore?.score ?? 5, notes)
                }
              />
            );
          })}
        </div>

        {isSaving && (
          <p className="text-xs text-muted-foreground text-center">Guardando...</p>
        )}
      </div>

      <div className="sticky bottom-16 md:bottom-0 p-4 border-t border-border bg-background">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Button
            variant="outline"
            disabled={isDirty || isSaving}
            onClick={() => router.push(`/rueda/${wheelId}/dominios`)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Dominios
          </Button>
          <Button disabled={isDirty || isSaving || isNavigating} onClick={handleContinue} className="flex-1">
            Ver resultado
            {isNavigating ? <Loader2 className="h-4 w-4 ml-1 animate-spin" /> : <ChevronRight className="h-4 w-4 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
