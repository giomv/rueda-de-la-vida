'use client';

import Link from 'next/link';
import { Calendar, Clock, CheckCircle, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { SpecialistSessionNoteWithUser } from '@/lib/types/specialist';

interface SessionNoteCardProps {
  note: SpecialistSessionNoteWithUser;
}

export function SessionNoteCard({ note }: SessionNoteCardProps) {
  const formattedDate = new Date(note.session_date + 'T12:00:00').toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const isPublished = !!note.shared_published_at;
  const recCount = (note.shared_recommendations || []).filter(r => r.text.trim()).length;

  return (
    <Link href={`/especialista/sesiones/${note.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {note.session_type && (
                  <Badge variant="outline" className="text-xs">
                    {note.session_type}
                  </Badge>
                )}
                {isPublished ? (
                  <Badge variant="default" className="text-xs gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Publicada
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Borrador
                  </Badge>
                )}
              </div>
              <p className="font-medium truncate">
                {note.user_name || note.user_email}
              </p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formattedDate}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {note.duration_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {note.duration_minutes} min
              </span>
            )}
            {recCount > 0 && (
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {recCount} recomendacion{recCount !== 1 ? 'es' : ''}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
