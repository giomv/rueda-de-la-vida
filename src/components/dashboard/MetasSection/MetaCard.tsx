'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/format-currency';
import type { MetaSummaryItem } from '@/lib/types/dashboard';
import { CheckCircle, Clock, TrendingDown, PiggyBank } from 'lucide-react';

interface MetaCardProps {
  data: MetaSummaryItem;
  onClick?: () => void;
}

export function MetaCard({ data, onClick }: MetaCardProps) {
  const {
    title,
    domainName,
    actionsDoneCount,
    actionsPendingCount,
    spentTotal,
    savedTotal,
    goalId,
  } = data;

  const hasGoal = !!goalId;
  const totalActions = actionsDoneCount + actionsPendingCount;

  return (
    <Card
      className={cn(
        'transition-colors',
        onClick && 'cursor-pointer hover:bg-accent/50 hover:shadow-md'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{title}</h3>
            {domainName && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {domainName}
              </p>
            )}
          </div>
          {!hasGoal && (
            <Badge variant="outline" className="text-xs ml-2 shrink-0">
              Sin importar
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          {/* Actions row */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              <span className="text-muted-foreground">Hechas:</span>
              <span className="font-medium">{actionsDoneCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-muted-foreground">Pendientes:</span>
              <span className="font-medium">{actionsPendingCount}</span>
            </div>
          </div>

          {/* Finance row */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
              <span className="text-muted-foreground">Gastado:</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                {formatCurrency(spentTotal)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <PiggyBank className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-muted-foreground">Ahorrado:</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">
                {formatCurrency(savedTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* No actions indicator */}
        {hasGoal && totalActions === 0 && (
          <p className="text-xs text-muted-foreground mt-2 italic">
            Sin acciones programadas
          </p>
        )}
      </CardContent>
    </Card>
  );
}
