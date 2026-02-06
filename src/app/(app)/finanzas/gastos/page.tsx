'use client';

import { useState, useEffect, useCallback } from 'react';
import { FinancesTabs, ExpenseForm, ExpenseList, SavingsForm, SavingsList } from '@/components/finances';
import { Button } from '@/components/ui/button';
import { getExpensesForDateRange } from '@/lib/actions/finances-actions';
import { getSavingsForDateRange } from '@/lib/actions/savings-actions';
import type { ExpenseWithRelations } from '@/lib/types/finances';
import type { SavingsMovementWithRelations } from '@/lib/types/dashboard';

function getDateRangeForToday(): { startDate: string; endDate: string } {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  // Show last 7 days, but use end of current month to catch any timezone issues
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 7);
  const startYear = startDate.getFullYear();
  const startMonth = String(startDate.getMonth() + 1).padStart(2, '0');
  const startDay = String(startDate.getDate()).padStart(2, '0');

  // End of current month
  const lastDay = new Date(year, month + 1, 0).getDate();

  return {
    startDate: `${startYear}-${startMonth}-${startDay}`,
    endDate: `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
  };
}

export default function GastosPage() {
  const [activeTab, setActiveTab] = useState<'expense' | 'savings'>('expense');
  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>([]);
  const [savings, setSavings] = useState<SavingsMovementWithRelations[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [loadingSavings, setLoadingSavings] = useState(true);

  const loadExpenses = useCallback(async () => {
    setLoadingExpenses(true);
    const { startDate, endDate } = getDateRangeForToday();
    try {
      const data = await getExpensesForDateRange(startDate, endDate);
      setExpenses(data);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoadingExpenses(false);
    }
  }, []);

  const loadSavings = useCallback(async () => {
    setLoadingSavings(true);
    const { startDate, endDate } = getDateRangeForToday();
    try {
      const data = await getSavingsForDateRange(startDate, endDate);
      setSavings(data);
    } catch (error) {
      console.error('Error loading savings:', error);
    } finally {
      setLoadingSavings(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
    loadSavings();
  }, [loadExpenses, loadSavings]);

  const handleExpenseAdded = () => {
    loadExpenses();
  };

  const handleSavingsAdded = () => {
    loadSavings();
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Finanzas</h1>
      </div>

      {/* View tabs */}
      <FinancesTabs className="mb-6" />

      {/* Add section with toggle */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Agregar</h2>
          {/* Toggle buttons */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={activeTab === 'expense' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('expense')}
            >
              Gasto
            </Button>
            <Button
              variant={activeTab === 'savings' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('savings')}
            >
              Ahorro
            </Button>
          </div>
        </div>

        {activeTab === 'expense' ? (
          <ExpenseForm onSuccess={handleExpenseAdded} />
        ) : (
          <SavingsForm onSuccess={handleSavingsAdded} />
        )}
      </div>

      {/* Recent items - show based on active tab */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          {activeTab === 'expense' ? 'Gastos recientes' : 'Ahorros recientes'}
        </h2>
        {activeTab === 'expense' ? (
          loadingExpenses ? (
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
          )
        ) : (
          loadingSavings ? (
            <div className="animate-pulse space-y-3">
              <div className="h-20 bg-muted rounded-lg" />
              <div className="h-20 bg-muted rounded-lg" />
              <div className="h-20 bg-muted rounded-lg" />
            </div>
          ) : (
            <SavingsList
              savings={savings.slice(0, 5)}
              onSavingsDelete={loadSavings}
            />
          )
        )}
      </div>
    </div>
  );
}
