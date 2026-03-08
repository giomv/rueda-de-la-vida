'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SessionNoteForm } from '@/components/specialist/SessionNoteForm';
import { useSpecialistNoteStore } from '@/lib/stores/specialist-note-store';
import { createSessionNote, publishRecommendations } from '@/lib/actions/specialist-actions';
import { createClient } from '@/lib/supabase/client';

export default function NuevaNotaPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const router = useRouter();
  const store = useSpecialistNoteStore();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('');
  const [relationId, setRelationId] = useState<string | null>(null);

  useEffect(() => {
    store.reset();

    async function loadInfo() {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', userId)
        .single();
      setUserName(profile?.display_name || 'Usuario');

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: relation } = await supabase
          .from('specialist_user_relations')
          .select('id')
          .eq('specialist_id', user.id)
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle();
        setRelationId(relation?.id || null);
      }
    }
    loadInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function handleSave(publish: boolean) {
    if (!relationId) {
      setError('No tienes una relacion activa con este usuario.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const note = await createSessionNote({
        user_id: userId,
        relation_id: relationId,
        session_type: store.session_type || undefined,
        session_date: store.session_date,
        duration_minutes: store.duration_minutes ? parseInt(store.duration_minutes) : null,
        private_notes: store.private_notes,
        private_followup: store.private_followup || undefined,
        shared_recommendations: store.shared_recommendations,
      });

      if (publish) {
        await publishRecommendations(note.id);
      }

      router.push(`/especialista/sesiones/${note.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar la nota.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/especialista/usuarios/${userId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nueva sesion</h1>
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
      />
    </div>
  );
}
