'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Pin, PinOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/format-currency';
import type { DomainSummaryData, ProgressStatus } from '@/lib/types/dashboard';
import { STATUS_LABELS } from '@/lib/types/dashboard';

interface DomainSummaryCardProps {
  data: DomainSummaryData;
  onClick?: () => void;
  onPin?: () => void;
  onUnpin?: () => void;
  showPinButton?: boolean;
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

export function DomainSummaryCard({
  data,
  onClick,
  onPin,
  onUnpin,
  showPinButton = true,
}: DomainSummaryCardProps) {
  const {
    domain,
    completionRate,
    spent,
    saved,
    status,
    actionsCompleted,
    actionsTotal,
    wheelPosition,
    isPinned,
  } = data;

  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPinned && onUnpin) {
      onUnpin();
    } else if (!isPinned && onPin) {
      onPin();
    }
  };

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
            {wheelPosition && (
              <Badge variant="outline" className="text-xs font-bold bg-primary/10 text-primary border-primary/30">
                #{wheelPosition}
              </Badge>
            )}
            {domain.icon && <span className="text-lg">{domain.icon}</span>}
            <h3 className="font-medium">{domain.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusVariant(status)} className="text-xs">
              {STATUS_LABELS[status]}
            </Badge>
            {showPinButton && !wheelPosition && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handlePinClick}
                title={isPinned ? 'Desanclar dominio' : 'Anclar dominio'}
              >
                {isPinned ? (
                  <PinOff className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <Pin className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-medium">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {actionsCompleted}/{actionsTotal} acciones
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
