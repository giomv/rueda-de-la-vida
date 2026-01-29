'use client';

import { useState, useEffect, useCallback } from 'react';
import { FinancesTabs, ExpenseList, FinancesFilters } from '@/components/finances';
import { getExpensesForDateRange } from '@/lib/actions/finances-actions';
import type { ExpenseWithRelations } from '@/lib/types/finances';

function getDefaultDateRange(): { startDate: string; endDate: string } {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  // First day of current month
  const startDate = new Date(year, month, 1);
  const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-01`;

  // Today
  const endStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return { startDate: startStr, endDate: endStr };
}

export default function HistorialPage() {
  const defaultRange = getDefaultDateRange();
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [accountId, setAccountId] = useState('');
  const [domainId, setDomainId] = useState('');
  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      let data = await getExpensesForDateRange(startDate, endDate);

      // Client-side filtering
      if (accountId) {
        data = data.filter((e) => e.budget_account_id === accountId);
      }
      if (domainId) {
        data = data.filter((e) => e.domain_id === domainId);
      }

      setExpenses(data);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, accountId, domainId]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // Calculate total
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Finanzas</h1>
      </div>

      {/* View tabs */}
      <FinancesTabs className="mb-6" />

      {/* Filters */}
      <div className="mb-6">
        <FinancesFilters
          startDate={startDate}
          endDate={endDate}
          accountId={accountId}
          domainId={domainId}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onAccountChange={setAccountId}
          onDomainChange={setDomainId}
        />
      </div>

      {/* Total */}
      <div className="mb-6 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">Total del periodo</p>
        <p className="text-2xl font-bold">
          ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-sm text-muted-foreground">
          {expenses.length} transacciones
        </p>
      </div>

      {/* Expense list */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-20 bg-muted rounded-lg" />
          <div className="h-20 bg-muted rounded-lg" />
          <div className="h-20 bg-muted rounded-lg" />
        </div>
      ) : (
        <ExpenseList expenses={expenses} onExpenseDelete={loadExpenses} />
      )}
    </div>
  );
}
