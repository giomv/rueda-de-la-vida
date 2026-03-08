'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { SessionNoteCard } from '@/components/specialist/SessionNoteCard';
import { listSessionNotes } from '@/lib/actions/specialist-actions';
import { createClient } from '@/lib/supabase/client';
import type { SpecialistSessionNoteWithUser } from '@/lib/types/specialist';

export default function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const [notes, setNotes] = useState<SpecialistSessionNoteWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [relationId, setRelationId] = useState<string | null>(null);

  const loadUserInfo = useCallback(async () => {
    const supabase = createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, email')
      .eq('id', userId)
      .single();
    setUserName(profile?.display_name || '');
    setUserEmail(profile?.email || '');

    // Find active relation
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
  }, [userId]);

  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listSessionNotes({ user_id: userId, limit: 20 });
      setNotes(result.items);
      setHasMore(result.hasMore);
      setNextCursor(result.nextCursor);
    } catch {
      // Empty state will show
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUserInfo();
    loadNotes();
  }, [loadUserInfo, loadNotes]);

  const loadMore = async () => {
    if (!nextCursor) return;
    try {
      const result = await listSessionNotes({ user_id: userId, cursor: nextCursor, limit: 20 });
      setNotes((prev) => [...prev, ...result.items]);
      setHasMore(result.hasMore);
      setNextCursor(result.nextCursor);
    } catch {
      // Silently handled
    }
  };

  // Filter published notes for recommendations tab
  const publishedNotes = notes.filter(n => n.shared_published_at);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/especialista/usuarios">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{userName || userEmail || 'Usuario'}</h1>
          {userName && <p className="text-sm text-muted-foreground">{userEmail}</p>}
        </div>
        {relationId && (
          <Button asChild>
            <Link href={`/especialista/sesiones/nueva/${userId}`}>
              <Plus className="h-4 w-4" />
              Nueva sesion
            </Link>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Linea de tiempo</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendaciones activas</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-3 mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-muted-foreground">No hay sesiones registradas.</p>
              {relationId && (
                <Button asChild>
                  <Link href={`/especialista/sesiones/nueva/${userId}`}>
                    Nueva sesion
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              {notes.map((note) => (
                <SessionNoteCard key={note.id} note={note} />
              ))}
              {hasMore && (
                <div className="pt-2 text-center">
                  <Button variant="outline" onClick={loadMore}>
                    Cargar mas
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-3 mt-4">
          {publishedNotes.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No hay recomendaciones publicadas.</p>
            </div>
          ) : (
            publishedNotes.map((note) => (
              <SessionNoteCard key={note.id} note={note} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
