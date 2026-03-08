'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SessionNoteForm } from '@/components/specialist/SessionNoteForm';
import { useSpecialistNoteStore } from '@/lib/stores/specialist-note-store';
import {
  getSessionNote,
  updateSessionNote,
  publishRecommendations,
} from '@/lib/actions/specialist-actions';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditarNotaPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const store = useSpecialistNoteStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lockVersion, setLockVersion] = useState(0);
  const [userName, setUserName] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    async function loadNote() {
      try {
        const note = await getSessionNote(sessionId);
        store.hydrate(note);
        setLockVersion(note.lock_version);
        setUserName(note.user_name || note.user_email);
        setIsPublished(!!note.shared_published_at);
      } catch {
        setError('No se pudo cargar la nota.');
      } finally {
        setIsLoading(false);
      }
    }
    loadNote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function handleSave(publish: boolean) {
    setIsSaving(true);
    setError('');

    try {
      const updated = await updateSessionNote(sessionId, {
        session_type: store.session_type || undefined,
        session_date: store.session_date,
        duration_minutes: store.duration_minutes ? parseInt(store.duration_minutes) : null,
        private_notes: store.private_notes,
        private_followup: store.private_followup || undefined,
        shared_recommendations: store.shared_recommendations,
        lock_version: lockVersion,
      });

      setLockVersion(updated.lock_version);

      if (publish) {
        await publishRecommendations(sessionId);
      }

      router.push(`/especialista/sesiones/${sessionId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar la nota.');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/especialista/sesiones/${sessionId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Editar sesion</h1>
          <p className="text-sm text-muted-foreground">Para: {userName}</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          {error}
        </div>
      )}

      <SessionNoteForm
        onSaveDraft={() => handleSave(false)}
        onSaveAndPublish={() => handleSave(true)}
        isSaving={isSaving}
        isPublished={isPublished}
      />
    </div>
  );
}
