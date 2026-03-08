'use client';

import Link from 'next/link';
import { ArrowRight, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { RelationStatusBadge } from './RelationStatusBadge';
import type { SpecialistUserListItem } from '@/lib/types/specialist';

interface SpecialistUserCardProps {
  item: SpecialistUserListItem;
}

export function SpecialistUserCard({ item }: SpecialistUserCardProps) {
  const { relation, user_name, user_email, last_session_date, session_count } = item;
  const isActive = relation.status === 'active';

  const formattedDate = last_session_date
    ? new Date(last_session_date + 'T12:00:00').toLocaleDateString('es-PE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  const content = (
    <Card className={isActive ? 'hover:bg-accent/50 transition-colors cursor-pointer' : ''}>
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="font-medium truncate">{user_name || user_email}</p>
            <RelationStatusBadge status={relation.status} />
          </div>
          {user_name && (
            <p className="text-sm text-muted-foreground truncate">{user_email}</p>
          )}
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {formattedDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Ultima: {formattedDate}
              </span>
            )}
            {session_count > 0 && (
              <span>{session_count} sesion{session_count !== 1 ? 'es' : ''}</span>
            )}
          </div>
        </div>
        {isActive && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />}
      </CardContent>
    </Card>
  );

  if (isActive && relation.user_id) {
    return <Link href={`/especialista/usuarios/${relation.user_id}`}>{content}</Link>;
  }

  return content;
}
