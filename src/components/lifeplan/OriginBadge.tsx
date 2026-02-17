'use client';

import { Badge } from '@/components/ui/badge';
import type { SourceType } from '@/lib/types/lifeplan';
import { cn } from '@/lib/utils';

interface OriginBadgeProps {
  origin: SourceType;
  className?: string;
}

const ORIGIN_CONFIG: Record<SourceType, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  WHEEL: { label: 'Rueda', variant: 'default' },
  ODYSSEY: { label: 'Plan de vida', variant: 'secondary' },
  MANUAL: { label: 'Manual', variant: 'outline' },
  JOURNAL: { label: 'Bitácora', variant: 'secondary' },
};

export function OriginBadge({ origin, className }: OriginBadgeProps) {
  const config = ORIGIN_CONFIG[origin];

  return (
    <Badge variant={config.variant} className={cn('text-xs', className)}>
      {config.label}
    </Badge>
  );
}
