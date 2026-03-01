'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { WizardProgress } from '@/components/app/WizardProgress';
import { PriorityRanking } from '@/components/wheel/PriorityRanking';
import { getWheelData, savePriorities } from '@/lib/actions/wheel-actions';
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import type { Domain, Score } from '@/lib/types';

export default function PrioridadesPage() {
  const params = useParams();
  const router = useRouter();
  const wheelId = params.wheelId as string;

  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [focusDomains, setFocusDomains] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getWheelData(wheelId);
      setDomains(data.domains);
      setScores(data.scores);

      if (data.priorities.length > 0) {
        const sorted = [...data.priorities].sort((a, b) => a.rank - b.rank);
        setOrderedIds(sorted.map((p) => p.domain_id));
        setFocusDomains(sorted.filter((p) => p.is_focus).map((p) => p.domain_id));
      } else {
        setOrderedIds(data.domains.map((d) => d.id));
      }
      setLoading(false);
    }
    load();
  }, [wheelId]);

  const handleReorder = (ids: string[]) => {
    setOrderedIds(ids);
  };

  const handleToggleFocus = (domainId: string) => {
    setFocusDomains((prev) => {
      if (prev.includes(domainId)) {
        return prev.filter((id) => id !== domainId);
      }
      if (prev.length >= 3) return prev;
      return [...prev, domainId];
    });
  };

  const handleContinue = async () => {
    setIsSaving(true);
    try {
      const priorities = orderedIds.map((id, index) => ({
        domain_id: id,
        rank: index + 1,
        is_focus: focusDomains.includes(id),
      }));
      await savePriorities(wheelId, priorities);
      router.push(`/rueda/${wheelId}/reflexion`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <WizardProgress currentStep={3} completedSteps={[0, 1, 2]} />

      <div className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-xl font-bold mb-1">Prioriza tus áreas</h1>
          <p className="text-sm text-muted-foreground">
            Ordena por importancia y selecciona 1-3 áreas de enfoque.
          </p>
        </div>

        <PriorityRanking
          domains={domains}
          scores={scores}
          focusDomains={focusDomains}
          onReorder={handleReorder}
          onToggleFocus={handleToggleFocus}
        />
      </div>

      <div className="sticky bottom-16 md:bottom-0 p-4 border-t border-border bg-background">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/rueda/${wheelId}/resultado`)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Resultado
          </Button>
          <Button
            onClick={handleContinue}
            className="flex-1"
            disabled={focusDomains.length === 0 || isSaving}
          >
            Continuar a reflexión
            {isSaving ? <Loader2 className="h-4 w-4 ml-1 animate-spin" /> : <ChevronRight className="h-4 w-4 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
