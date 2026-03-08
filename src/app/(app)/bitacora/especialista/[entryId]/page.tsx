'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Stethoscope, ListChecks, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import { convertRecommendationToActivity } from '@/lib/actions/specialist-user-actions';
import type { SpecialistBitacoraEntry, RecommendationItem } from '@/lib/types/specialist';

export default function SpecialistEntryDetailPage({ params }: { params: Promise<{ entryId: string }> }) {
  const { entryId } = use(params);
  const [entry, setEntry] = useState<SpecialistBitacoraEntry | null>(null);
  const [specialistName, setSpecialistName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [convertedItems, setConvertedItems] = useState<Set<string>>(new Set());
  const [convertingId, setConvertingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadEntry() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('specialist_bitacora_entries')
        .select('*')
        .eq('id', entryId)
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        setIsLoading(false);
        return;
      }

      setEntry(data as SpecialistBitacoraEntry);

      // Get specialist name
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', data.specialist_id)
        .single();
      setSpecialistName(profile?.display_name || 'Especialista');

      setIsLoading(false);
    }
    loadEntry();
  }, [entryId]);

  async function handleConvert(rec: RecommendationItem) {
    setConvertingId(rec.id);
    try {
      await convertRecommendationToActivity(entryId, rec.text);
      setConvertedItems((prev) => new Set([...prev, rec.id]));
    } catch {
      // Silently handled
    } finally {
      setConvertingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">Entrada no encontrada.</p>
        <Button asChild className="mt-4">
          <Link href="/bitacora/sesiones">Volver a Bitácora</Link>
        </Button>
      </div>
    );
  }

  const formattedDate = new Date(entry.date + 'T12:00:00').toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const recommendations = entry.shared_recommendations_snapshot || [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/bitacora/sesiones">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{entry.title || 'Recomendaciones'}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Stethoscope className="h-4 w-4" />
              {specialistName}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formattedDate}
            </span>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ListChecks className="h-4 w-4 text-primary" />
            Recomendaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recommendations.map((rec) => {
            const isConverted = convertedItems.has(rec.id);
            return (
              <div key={rec.id} className="p-3 bg-primary/5 rounded-lg flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm">{rec.text}</p>
                  {rec.category && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {rec.category}
                    </Badge>
                  )}
                </div>
                {isConverted ? (
                  <Badge variant="default" className="shrink-0 gap-1">
                    <Check className="h-3 w-3" />
                    En Mi Plan
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleConvert(rec)}
                    disabled={convertingId === rec.id}
                    className="shrink-0"
                  >
                    {convertingId === rec.id ? 'Agregando...' : 'Agregar a Mi Plan'}
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
