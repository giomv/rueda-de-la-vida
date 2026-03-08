'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Lock, Share2, Pencil, Trash2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
import { PublishButton } from '@/components/specialist/PublishButton';
import { getSessionNote, deleteSessionNote } from '@/lib/actions/specialist-actions';
import type { SpecialistSessionNoteWithUser } from '@/lib/types/specialist';

export default function SessionNoteDetailPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const [note, setNote] = useState<SpecialistSessionNoteWithUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  function loadNote() {
    setIsLoading(true);
    getSessionNote(sessionId)
      .then(setNote)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadNote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteSessionNote(sessionId);
      router.push(`/especialista/usuarios/${note?.user_id}`);
    } catch {
      setIsDeleting(false);
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

  if (!note) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Nota no encontrada.</p>
        <Button asChild className="mt-4">
          <Link href="/especialista/usuarios">Volver</Link>
        </Button>
      </div>
    );
  }

  const isPublished = !!note.shared_published_at;
  const formattedDate = new Date(note.session_date + 'T12:00:00').toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const privateNotes = note.private_notes || [];
  const recommendations = note.shared_recommendations || [];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/especialista/usuarios/${note.user_id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-2xl font-bold">Detalle de sesion</h1>
            {isPublished ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Publicada
              </Badge>
            ) : (
              <Badge variant="secondary">Borrador</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Paciente: {note.user_name || note.user_email}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/especialista/sesiones/${sessionId}/editar`}>
              <Pencil className="h-4 w-4" />
              Editar
            </Link>
          </Button>
          {!isPublished && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={isDeleting}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminar nota</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta accion no se puede deshacer. La nota sera eliminada permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Session Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 text-sm flex-wrap">
            {note.session_type && (
              <Badge variant="outline">{note.session_type}</Badge>
            )}
            <span className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {formattedDate}
            </span>
            {note.duration_minutes && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                {note.duration_minutes} min
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Private Notes */}
      {(privateNotes.length > 0 || note.private_followup) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="h-4 w-4 text-muted-foreground" />
              Notas privadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {privateNotes.map((pn, i) => (
              <div key={i} className="p-3 bg-muted rounded-lg text-sm">
                {pn.text}
              </div>
            ))}
            {note.private_followup && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Seguimiento</p>
                  <p className="text-sm">{note.private_followup}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Shared Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Share2 className="h-4 w-4 text-primary" />
              Recomendaciones compartidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recommendations.map((rec, i) => (
              <div key={i} className="p-3 bg-primary/5 rounded-lg">
                <p className="text-sm">{rec.text}</p>
                {rec.category && (
                  <Badge variant="outline" className="mt-1 text-xs">
                    {rec.category}
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Publish Action */}
      {!isPublished && recommendations.length > 0 && (
        <PublishButton noteId={sessionId} onPublished={loadNote} />
      )}
    </div>
  );
}
