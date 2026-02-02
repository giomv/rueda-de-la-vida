'use client';

import { MetaCard } from './MetaCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Target, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { MetasSummaryResponse } from '@/lib/types/dashboard';

interface MetasSectionProps {
  metasSummary: MetasSummaryResponse | null;
  selectedYearIndex: number;
  onYearChange: (yearIndex: number) => void;
  globalGoalFilter?: string | null;
  loading?: boolean;
}

export function MetasSection({
  metasSummary,
  selectedYearIndex,
  onYearChange,
  globalGoalFilter,
  loading = false,
}: MetasSectionProps) {
  // Loading state
  if (loading || !metasSummary) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5" />
            Metas
          </h2>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <p>Cargando metas...</p>
        </div>
      </div>
    );
  }

  const { odysseyId, odysseyTitle, availableYears, metas } = metasSummary;

  // No active Plan de Vida
  if (!odysseyId || availableYears.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5" />
            Metas
          </h2>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <p>No tienes un Plan de Vida activo.</p>
          <Button variant="link" className="mt-2" asChild>
            <Link href="/plan-de-vida">
              Crear Plan de Vida
              <ExternalLink className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Determine if year filter should be disabled (when global goal filter is active)
  const isYearFilterDisabled = !!globalGoalFilter;

  return (
    <div className="space-y-4">
      {/* Header with title and year filter */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5" />
          Metas
        </h2>

        <Select
          value={selectedYearIndex.toString()}
          onValueChange={(value) => onYearChange(parseInt(value))}
          disabled={isYearFilterDisabled}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Seleccionar año" />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                Año {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subtitle with plan info */}
      {odysseyTitle && (
        <p className="text-sm text-muted-foreground -mt-2">
          {odysseyTitle}
        </p>
      )}

      {/* Empty state for selected year */}
      {metas.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Aun no tienes metas en este año.</p>
          <Button variant="link" className="mt-2" asChild>
            <Link href={odysseyId ? `/plan-de-vida/${odysseyId}/plan-1` : '/plan-de-vida'}>
              Ir a Plan de Vida
              <ExternalLink className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      )}

      {/* Metas list */}
      {metas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metas.map((meta) => (
            <MetaCard
              key={meta.id}
              data={meta}
            />
          ))}
        </div>
      )}
    </div>
  );
}
