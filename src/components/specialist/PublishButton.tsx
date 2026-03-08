'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { publishRecommendations } from '@/lib/actions/specialist-actions';

interface PublishButtonProps {
  noteId: string;
  onPublished?: () => void;
}

export function PublishButton({ noteId, onPublished }: PublishButtonProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState('');

  async function handlePublish() {
    setIsPublishing(true);
    setError('');
    try {
      await publishRecommendations(noteId);
      onPublished?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al publicar');
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button disabled={isPublishing}>
            <Send className="h-4 w-4" />
            {isPublishing ? 'Publicando...' : 'Publicar recomendaciones'}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publicar recomendaciones</AlertDialogTitle>
            <AlertDialogDescription>
              Las recomendaciones seran visibles para el usuario en su Bitacora.
              Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublish}>
              Publicar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}
