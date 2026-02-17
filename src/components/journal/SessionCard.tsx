'use client';

import Link from 'next/link';
import { MessageSquare, Zap, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { SessionListItem } from '@/lib/types/journal';
import { SESSION_TYPE_LABELS } from '@/lib/types/journal';

interface SessionCardProps {
  session: SessionListItem;
}

export function SessionCard({ session }: SessionCardProps) {
  const formattedDate = new Date(session.date + 'T12:00:00').toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const typeLabel = SESSION_TYPE_LABELS[session.type] || session.type;
  const displayTitle = session.title || `Sesión de ${typeLabel}`;

  return (
    <Link href={`/bitacora/sesion/${session.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant="outline" className="text-xs shrink-0">
                  {typeLabel}
                </Badge>
                {session.isShared && (
                  <Badge variant="secondary" className="text-xs shrink-0 gap-1">
                    <Users className="h-3 w-3" />
                    {session.sharedSpaceName || 'Compartida'}
                  </Badge>
                )}
                {session.visibility === 'PRIVATE' && (
                  <Badge variant="outline" className="text-xs shrink-0">
                    Privada
                  </Badge>
                )}
              </div>
              <p className="font-medium truncate">{displayTitle}</p>
              {session.provider_name && (
                <p className="text-sm text-muted-foreground truncate">
                  {session.provider_name}
                </p>
              )}
              {session.isShared && session.createdByName && (
                <p className="text-xs text-muted-foreground">
                  Creada por: {session.createdByName}
                </p>
              )}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formattedDate}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {session.domain_name && (
              <span className="flex items-center gap-1">
                {session.domain_icon && <span>{session.domain_icon}</span>}
                {session.domain_name}
              </span>
            )}
            {session.insight_count > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {session.insight_count} insight{session.insight_count !== 1 ? 's' : ''}
              </span>
            )}
            {session.action_count > 0 && (
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {session.action_count} acción{session.action_count !== 1 ? 'es' : ''}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
