'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { GoalProgress } from '@/lib/types/dashboard';

interface GoalCardProps {
  data: GoalProgress;
  onClick?: () => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function GoalCard({ data, onClick }: GoalCardProps) {
  const { goal, domain, completionRate, spent, saved, actionsCompleted, actionsTotal } = data;

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
          <div>
            <h3 className="font-medium">{goal.title}</h3>
            {domain && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                {domain.icon && <span>{domain.icon}</span>}
                {domain.name}
              </p>
            )}
          </div>
          {goal.metric && (
            <Badge variant="outline" className="text-xs">
              {goal.metric}
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-medium">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
            {actionsTotal > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {actionsCompleted} de {actionsTotal} acciones
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-muted-foreground">Gastado: </span>
              <span className="font-medium text-red-600 dark:text-red-400">
                {formatCurrency(spent)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Ahorrado: </span>
              <span className="font-medium text-blue-600 dark:text-blue-400">
                {formatCurrency(saved)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
