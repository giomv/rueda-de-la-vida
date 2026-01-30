'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { DomainProgress, ProgressStatus } from '@/lib/types/dashboard';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/types/dashboard';

interface DomainCardProps {
  data: DomainProgress;
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

export function DomainCard({ data, onClick }: DomainCardProps) {
  const { domain, completionRate, spent, saved, status, actionsCompleted, actionsTotal } = data;

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
            {domain.icon && <span className="text-lg">{domain.icon}</span>}
            <h3 className="font-medium">{domain.name}</h3>
          </div>
          <Badge variant={getStatusVariant(status)} className="text-xs">
            {STATUS_LABELS[status]}
          </Badge>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-medium">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {actionsCompleted} de {actionsTotal} acciones
            </p>
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
