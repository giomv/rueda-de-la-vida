'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FinancesTabs, ExpenseForm, ExpenseList } from '@/components/finances';
import { getExpensesForDateRange } from '@/lib/actions/finances-actions';
import type { ExpenseWithRelations } from '@/lib/types/finances';

function getDateRangeForToday(): { startDate: string; endDate: string } {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  // Show last 7 days
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 7);
  const startYear = startDate.getFullYear();
  const startMonth = String(startDate.getMonth() + 1).padStart(2, '0');
  const startDay = String(startDate.getDate()).padStart(2, '0');

  return {
    startDate: `${startYear}-${startMonth}-${startDay}`,
    endDate: `${year}-${month}-${day}`,
  };
}

export default function GastosPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  const loadExpenses = useCallback(async () => {
    const { startDate, endDate } = getDateRangeForToday();
    try {
      const data = await getExpensesForDateRange(startDate, endDate);
      setExpenses(data);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleExpenseAdded = () => {
    loadExpenses();
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Finanzas</h1>
      </div>

      {/* View tabs */}
      <FinancesTabs className="mb-6" />

      {/* Add expense form */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Agregar gasto</h2>
        <ExpenseForm onSuccess={handleExpenseAdded} />
      </div>

      {/* Recent expenses */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Gastos recientes</h2>
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-20 bg-muted rounded-lg" />
            <div className="h-20 bg-muted rounded-lg" />
            <div className="h-20 bg-muted rounded-lg" />
          </div>
        ) : (
          <ExpenseList
            expenses={expenses.slice(0, 5)}
            onExpenseDelete={loadExpenses}
          />
        )}
      </div>
    </div>
  );
}
