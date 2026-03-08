'use client';

import Link from 'next/link';
import { Stethoscope, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { SpecialistBitacoraEntryListItem } from '@/lib/types/specialist';

interface SpecialistEntryCardProps {
  entry: SpecialistBitacoraEntryListItem;
}

export function SpecialistEntryCard({ entry }: SpecialistEntryCardProps) {
  const formattedDate = new Date(entry.date + 'T12:00:00').toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const recCount = (entry.shared_recommendations_snapshot || []).length;

  return (
    <Link href={`/bitacora/especialista/${entry.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant="outline" className="text-xs gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                  <Stethoscope className="h-3 w-3" />
                  Especialista
                </Badge>
              </div>
              <p className="font-medium truncate">{entry.title || 'Recomendaciones'}</p>
              <p className="text-sm text-muted-foreground">
                De: {entry.specialist_name}
              </p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formattedDate}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
