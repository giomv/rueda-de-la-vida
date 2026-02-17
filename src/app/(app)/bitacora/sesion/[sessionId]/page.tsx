'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2, Archive, ArchiveRestore, Users } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { SessionDetail } from '@/components/journal/SessionDetail';
import {
  getSession,
  deleteSession,
  archiveSessionForMe,
  unarchiveSessionForMe,
} from '@/lib/actions/journal-actions';
import type { SessionWithRelations } from '@/lib/types/journal';
import { SESSION_TYPE_LABELS } from '@/lib/types/journal';
import { toast } from 'sonner';

export default function SessionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<SessionWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSession(sessionId)
      .then(setSession)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar la sesión'))
      .finally(() => setIsLoading(false));
  }, [sessionId]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteSession(sessionId);
      toast.success('Sesión eliminada');
      router.push('/bitacora/sesiones');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar la sesión');
      setIsDeleting(false);
    }
  };

  const handleArchiveToggle = async () => {
    if (!session) return;
    setIsArchiving(true);
    try {
      if (session.isArchived) {
        await unarchiveSessionForMe(sessionId);
        toast.success('Sesión restaurada');
      } else {
        await archiveSessionForMe(sessionId);
        toast.success('Sesión archivada');
      }
      const updated = await getSession(sessionId);
      setSession(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setIsArchiving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="py-12 text-center">
          <p className="text-muted-foreground">{error || 'Sesión no encontrada.'}</p>
        </div>
      </div>
    );
  }

  const typeLabel = SESSION_TYPE_LABELS[session.type] || session.type;
  const displayTitle = session.title || `Sesión de ${typeLabel}`;
  const isShared = !!session.shared_space_id;
  const canEdit = session.isOwner || session.canAddItems; // Owner or collaborator with canEdit
  const canDelete = session.isOwner; // Only creator can delete

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{displayTitle}</h1>
            {isShared && session.sharedSpaceName && (
              <div className="flex items-center gap-1 mt-1">
                <Badge variant="secondary" className="text-xs gap-1">
                  <Users className="h-3 w-3" />
                  {session.sharedSpaceName}
                </Badge>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* Archive toggle (only for shared sessions) */}
          {isShared && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleArchiveToggle}
              disabled={isArchiving}
              title={session.isArchived ? 'Restaurar' : 'Archivar para mí'}
            >
              {session.isArchived ? (
                <ArchiveRestore className="h-4 w-4" />
              ) : (
                <Archive className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Edit button */}
          {canEdit && (
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/bitacora/sesion/${sessionId}/editar`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
          )}

          {/* Delete button (owner only) */}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar sesión?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {isShared
                      ? 'Esta sesión es compartida. Se eliminará para todos los miembros del espacio. Los insights y acciones asociados también serán eliminados.'
                      : 'Esta acción no se puede deshacer. Se eliminarán todos los insights, acciones y adjuntos asociados.'}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? 'Eliminando...' : 'Eliminar'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <SessionDetail session={session} onSessionUpdate={setSession} />
    </div>
  );
}
