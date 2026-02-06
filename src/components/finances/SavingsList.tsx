'use client';

import { PiggyBank } from 'lucide-react';
import { SavingsCard } from './SavingsCard';
import { formatCurrencyWithDecimals } from '@/lib/utils/format-currency';
import type { SavingsMovementWithRelations } from '@/lib/types/dashboard';

interface SavingsListProps {
  savings: SavingsMovementWithRelations[];
  onSavingsDelete?: () => void;
}

export function SavingsList({ savings, onSavingsDelete }: SavingsListProps) {
  if (savings.length === 0) {
    return (
      <div className="text-center py-12">
        <PiggyBank className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-medium text-lg mb-2">No hay ahorros</h3>
        <p className="text-muted-foreground text-sm">
          Aun no registras ahorros.
        </p>
      </div>
    );
  }

  // Group savings by date
  const groupedSavings = savings.reduce((groups, item) => {
    const date = item.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, SavingsMovementWithRelations[]>);

  const sortedDates = Object.keys(groupedSavings).sort((a, b) => b.localeCompare(a));

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

  const calculateDayTotal = (items: SavingsMovementWithRelations[]): number => {
    return items.reduce((sum, s) => {
      const amount = s.movement_type === 'deposit' ? s.amount : -s.amount;
      return sum + amount;
    }, 0);
  };

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => (
        <div key={date}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground capitalize">
              {formatDateHeader(date)}
            </h3>
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              +{formatCurrencyWithDecimals(calculateDayTotal(groupedSavings[date]))}
            </span>
          </div>
          <div className="space-y-2">
            {groupedSavings[date].map((item) => (
              <SavingsCard
                key={item.id}
                savings={item}
                onDelete={onSavingsDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
