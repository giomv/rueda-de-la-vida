'use client';

import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/format-currency';

interface KPICardProps {
  label: string;
  value: number;
  className?: string;
  isNegative?: boolean;
}

export function KPICard({ label, value, className, isNegative }: KPICardProps) {
  const isNeg = isNegative ?? value < 0;

  return (
    <div
      className={cn(
        'rounded-lg p-4 border',
        isNeg
          ? 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900'
          : 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900',
        className
      )}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          'text-2xl font-bold',
          isNeg ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
        )}
      >
        {formatCurrency(value)}
      </p>
    </div>
  );
}
