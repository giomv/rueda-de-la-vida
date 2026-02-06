'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/format-currency';
import type { MetaSummaryItem, ProgressStatus } from '@/lib/types/dashboard';
import { STATUS_LABELS } from '@/lib/types/dashboard';

interface MetaCardProps {
  data: MetaSummaryItem;
  onClick?: () => void;
  showYearLabel?: boolean;
}

function getStatusFromCompletionRate(rate: number): ProgressStatus {
  if (rate >= 80) return 'on-track';
  if (rate >= 50) return 'at-risk';
  return 'behind';
}

function getStatusVariant(status: ProgressStatus): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'on-track':
      return 'default';
    case 'at-risk':
      return 'secondary';
    case 'behind':
      return 'destructive';
  }
}

export function MetaCard({ data, onClick, showYearLabel = false }: MetaCardProps) {
  const {
    title,
    domainName,
    actionsDoneCount,
    actionsPendingCount,
    spentTotal,
    savedTotal,
    goalId,
    yearIndex,
  } = data;

  const hasGoal = !!goalId;
  const totalActions = actionsDoneCount + actionsPendingCount;
  const completionRate = totalActions > 0
    ? Math.round((actionsDoneCount / totalActions) * 100)
    : 0;
  const status = getStatusFromCompletionRate(completionRate);

  return (
    <Card
      className={cn(
        'cursor-pointer transition-colors hover:bg-accent/50',
        onClick && 'hover:shadow-md'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {showYearLabel && yearIndex && (
              <Badge variant="outline" className="text-xs font-bold bg-primary/10 text-primary border-primary/30">
                Año {yearIndex}
              </Badge>
            )}
            <h3 className="font-medium truncate">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            {hasGoal ? (
              <Badge variant={getStatusVariant(status)} className="text-xs">
                {STATUS_LABELS[status]}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                Sin importar
              </Badge>
            )}
          </div>
        </div>

        {domainName && (
          <p className="text-xs text-muted-foreground mb-3">
            {domainName}
          </p>
        )}

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-medium">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {actionsDoneCount}/{totalActions} acciones
            </p>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-muted-foreground">Gastado: </span>
              <span className="font-medium text-red-600 dark:text-red-400">
                {formatCurrency(spentTotal)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Ahorrado: </span>
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
