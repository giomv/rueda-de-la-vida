'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SessionForm } from '@/components/journal/SessionForm';
import { getSession, updateSession } from '@/lib/actions/journal-actions';
import { getUserDomains } from '@/lib/actions/domain-actions';
import { getGoals } from '@/lib/actions/goal-actions';
import type { LifeDomain } from '@/lib/types';
import type { Goal } from '@/lib/types/lifeplan';
import type { SessionWithRelations, CreateSessionInput, SessionConflictInfo } from '@/lib/types/journal';
import { toast } from 'sonner';

export default function EditarSesionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<SessionWithRelations | null>(null);
  const [domains, setDomains] = useState<LifeDomain[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<SessionConflictInfo | null>(null);

  useEffect(() => {
    Promise.all([getSession(sessionId), getUserDomains(), getGoals()])
      .then(([s, d, g]) => {
        setSession(s);
        setDomains(d);
        setGoals(g);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar'))
      .finally(() => setIsLoading(false));
  }, [sessionId]);

  const handleSave = async (input: CreateSessionInput) => {
    setIsSaving(true);
    setError(null);
    setConflict(null);
    try {
      await updateSession(sessionId, {
        ...input,
        lockVersion: session?.lockVersion,
      });
      toast.success('Cambios guardados');
      router.push(`/bitacora/sesion/${sessionId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar los cambios';

      // Check for conflict error
      if (message.startsWith('CONFLICT:')) {
        try {
          const conflictInfo: SessionConflictInfo = JSON.parse(message.slice(9));
          setConflict(conflictInfo);
        } catch {
          setError(message);
        }
      } else {
        setError(message);
        toast.error(message);
      }
      setIsSaving(false);
    }
  };

  const handleReload = async () => {
    setConflict(null);
    setIsLoading(true);
    try {
      const s = await getSession(sessionId);
      setSession(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al recargar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceRetry = () => {
    // Clear conflict and allow re-save with updated lock version
    setConflict(null);
    if (session) {
      // Fetch latest version to get current lockVersion, then retry
      getSession(sessionId).then((s) => {
        setSession((prev) => prev ? { ...prev, lockVersion: s.lockVersion } : prev);
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="py-12 text-center">
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Editar sesión</h1>
      </div>

      {/* Conflict banner */}
      {conflict && (
        <div className="p-4 border border-yellow-400/50 bg-yellow-50/30 dark:bg-yellow-950/10 rounded-lg space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Conflicto de edición
              </p>
              <p className="text-xs text-muted-foreground">
                {conflict.lastEditedByName} editó esta sesión mientras la modificabas.
                Tus cambios no se guardaron.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleReload}>
              <RefreshCw className="h-4 w-4" />
              Ver versión actual
            </Button>
            <Button size="sm" onClick={handleForceRetry}>
              Reintentar con mis cambios
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
          {error}
        </div>
      )}

      {session && (
        <SessionForm
          domains={domains}
          goals={goals}
          session={{
            ...session,
            // Only show current user's items in the edit form
            insights: session.insights.filter(i => i.user_id === session.currentUserId),
            actions: session.actions.filter(a => a.user_id === session.currentUserId),
            attachments: session.attachments.filter(a => a.user_id === session.currentUserId),
          }}
          onSave={handleSave}
          onCancel={() => router.back()}
          isSaving={isSaving}
          isOwner={session.isOwner}
        />
      )}
    </div>
  );
}
