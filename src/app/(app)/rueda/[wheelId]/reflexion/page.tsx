'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { WizardProgress } from '@/components/app/WizardProgress';
import { ReflectionForm } from '@/components/reflection/ReflectionForm';
import { getWheelData, saveReflections } from '@/lib/actions/wheel-actions';
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';

export default function ReflexionPage() {
  const params = useParams();
  const router = useRouter();
  const wheelId = params.wheelId as string;

  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getWheelData(wheelId);
      const answersMap: Record<string, string> = {};
      data.reflections.forEach((r) => {
        if (r.answer_text) answersMap[r.question_key] = r.answer_text;
      });
      setAnswers(answersMap);
      setLoading(false);
    }
    load();
  }, [wheelId]);

  const handleAnswerChange = (key: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [key]: answer }));
  };

  const handleContinue = async () => {
    setIsSaving(true);
    try {
      const reflections = Object.entries(answers)
        .filter(([, v]) => v.trim())
        .map(([key, text]) => ({ question_key: key, answer_text: text }));
      await saveReflections(wheelId, reflections);
      router.push(`/rueda/${wheelId}/vida-ideal`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <WizardProgress currentStep={4} completedSteps={[0, 1, 2, 3]} />

      <div className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full">
        <ReflectionForm answers={answers} onAnswerChange={handleAnswerChange} />
      </div>

      <div className="sticky bottom-16 md:bottom-0 p-4 border-t border-border bg-background">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/rueda/${wheelId}/prioridades`)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Prioridades
          </Button>
          <Button onClick={handleContinue} className="flex-1" disabled={isSaving}>
            Vida ideal
            {isSaving ? <Loader2 className="h-4 w-4 ml-1 animate-spin" /> : <ChevronRight className="h-4 w-4 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
