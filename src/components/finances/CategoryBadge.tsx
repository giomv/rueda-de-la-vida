'use client';

import { cn } from '@/lib/utils';
import type { BudgetCategory } from '@/lib/types/finances';

interface CategoryBadgeProps {
  category: BudgetCategory;
  className?: string;
}

const categoryStyles: Record<BudgetCategory, string> = {
  INCOME: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  EXPENSE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  SAVINGS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const categoryLabels: Record<BudgetCategory, string> = {
  INCOME: 'Ingreso',
  EXPENSE: 'Gasto',
  SAVINGS: 'Ahorro',
};

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        categoryStyles[category],
        className
      )}
    >
      {categoryLabels[category]}
    </span>
  );
}
