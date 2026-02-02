'use client';

import { Receipt } from 'lucide-react';
import { ExpenseCard } from './ExpenseCard';
import { formatCurrencyWithDecimals } from '@/lib/utils/format-currency';
import type { ExpenseWithRelations } from '@/lib/types/finances';

interface ExpenseListProps {
  expenses: ExpenseWithRelations[];
  onExpenseDelete?: () => void;
}

export function ExpenseList({ expenses, onExpenseDelete }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-medium text-lg mb-2">No hay gastos</h3>
        <p className="text-muted-foreground text-sm">
          Agrega tu primer gasto para comenzar a rastrear tus finanzas.
        </p>
      </div>
    );
  }

  // Group expenses by date
  const groupedExpenses = expenses.reduce((groups, expense) => {
    const date = expense.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(expense);
    return groups;
  }, {} as Record<string, ExpenseWithRelations[]>);

  const sortedDates = Object.keys(groupedExpenses).sort((a, b) => b.localeCompare(a));

  const formatDateHeader = (dateStr: string): string => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = new Date(year, month - 1, day);
    if (dateOnly.getTime() === today.getTime()) {
      return 'Hoy';
    }
    if (dateOnly.getTime() === yesterday.getTime()) {
      return 'Ayer';
    }
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const calculateDayTotal = (expenses: ExpenseWithRelations[]): number => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  };

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => (
        <div key={date}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground capitalize">
              {formatDateHeader(date)}
            </h3>
            <span className="text-sm font-medium">
              {formatCurrencyWithDecimals(calculateDayTotal(groupedExpenses[date]))}
            </span>
          </div>
          <div className="space-y-2">
            {groupedExpenses[date].map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                onDelete={onExpenseDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
