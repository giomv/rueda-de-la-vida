'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SessionForm } from '@/components/journal/SessionForm';
import { getUserDomains } from '@/lib/actions/domain-actions';
import { getGoals } from '@/lib/actions/goal-actions';
import { createSession } from '@/lib/actions/journal-actions';
import type { LifeDomain } from '@/lib/types';
import type { Goal } from '@/lib/types/lifeplan';
import type { CreateSessionInput } from '@/lib/types/journal';

export default function NuevaSesionPage() {
  const router = useRouter();
  const [domains, setDomains] = useState<LifeDomain[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getUserDomains(), getGoals()])
      .then(([d, g]) => {
        setDomains(d);
        setGoals(g);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (input: CreateSessionInput) => {
    setIsSaving(true);
    setError(null);
    try {
      const session = await createSession(input);
      router.push(`/bitacora/sesion/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la sesión');
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Nueva sesión</h1>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
          {error}
        </div>
      )}

      <SessionForm
        domains={domains}
        goals={goals}
        onSave={handleSave}
        onCancel={() => router.back()}
        isSaving={isSaving}
      />
    </div>
  );
}
