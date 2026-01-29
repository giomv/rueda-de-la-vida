'use client';

import { useState, useEffect, useCallback } from 'react';
import { FinancesTabs, MonthPicker, BudgetTable } from '@/components/finances';
import { getBudgetSummary, getOrCreateMonthlyBudget } from '@/lib/actions/finances-actions';
import type { BudgetSummary } from '@/lib/types/finances';

export default function PresupuestoPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      // Ensure budget exists
      await getOrCreateMonthlyBudget(year, month);
      // Get summary
      const data = await getBudgetSummary(year, month);
      setSummary(data);
    } catch (error) {
      console.error('Error loading budget:', error);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Finanzas</h1>
      </div>

      {/* View tabs */}
      <FinancesTabs className="mb-6" />

      {/* Month picker */}
      <div className="flex justify-center mb-6">
        <MonthPicker year={year} month={month} onChange={handleMonthChange} />
      </div>

      {/* Budget table */}
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-muted rounded-lg" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      ) : summary ? (
        <BudgetTable summary={summary} onRefresh={loadSummary} />
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No se pudo cargar el presupuesto
        </div>
      )}
    </div>
  );
}
