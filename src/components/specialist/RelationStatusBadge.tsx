'use client';

import { Badge } from '@/components/ui/badge';
import type { SpecialistRelationStatus } from '@/lib/types/specialist';

const STATUS_CONFIG: Record<SpecialistRelationStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  invited: { label: 'Pendiente', variant: 'secondary' },
  active: { label: 'Activo', variant: 'default' },
  revoked: { label: 'Revocado', variant: 'destructive' },
};

interface RelationStatusBadgeProps {
  status: SpecialistRelationStatus;
}

export function RelationStatusBadge({ status }: RelationStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant={config.variant} className="text-xs">
      {config.label}
    </Badge>
  );
}
