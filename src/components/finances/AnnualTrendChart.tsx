'use client';

import { MONTH_NAMES } from '@/lib/types/finances';
import { formatCurrency } from '@/lib/utils/format-currency';

interface AnnualTrendChartProps {
  data: { month: number; actual: number }[];
}

export function AnnualTrendChart({ data }: AnnualTrendChartProps) {
  const maxValue = Math.max(...data.map((d) => d.actual), 1);

  return (
    <div className="space-y-2">
      {data.map((item) => {
        const percentage = (item.actual / maxValue) * 100;
        return (
          <div key={item.month} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-8">
              {MONTH_NAMES[item.month - 1].slice(0, 3)}
            </span>
            <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
              <div
                className="h-full bg-red-500 dark:bg-red-600 rounded transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs font-medium w-20 text-right">
              {formatCurrency(item.actual)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
