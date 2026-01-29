'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FinancesTabs, AnnualSummary } from '@/components/finances';
import { getAnnualSummary } from '@/lib/actions/finances-actions';
import type { AnnualSummary as AnnualSummaryType } from '@/lib/types/finances';

export default function AnualPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [summary, setSummary] = useState<AnnualSummaryType | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAnnualSummary(year);
      setSummary(data);
    } catch (error) {
      console.error('Error loading annual summary:', error);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const isCurrentYear = year === today.getFullYear();

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Finanzas</h1>
      </div>

      {/* View tabs */}
      <FinancesTabs className="mb-6" />

      {/* Year picker */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => setYear(year - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xl font-semibold min-w-[80px] text-center">{year}</span>
        <Button variant="outline" size="icon" onClick={() => setYear(year + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        {!isCurrentYear && (
          <Button variant="ghost" size="sm" onClick={() => setYear(today.getFullYear())}>
            Hoy
          </Button>
        )}
      </div>

      {/* Annual summary */}
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-muted rounded-lg" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-20 bg-muted rounded-lg" />
            <div className="h-20 bg-muted rounded-lg" />
            <div className="h-20 bg-muted rounded-lg" />
          </div>
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      ) : summary ? (
        <AnnualSummary summary={summary} />
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No se pudo cargar el resumen anual
        </div>
      )}
    </div>
  );
}
