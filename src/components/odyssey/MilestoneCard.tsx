'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, GripVertical } from 'lucide-react';
import { DomainBadge } from './DomainSelector';
import type { OdysseyMilestone, MilestoneTag, LifeDomain } from '@/lib/types';

interface MilestoneCardProps {
  milestone: OdysseyMilestone;
  onEdit: () => void;
  onDelete: () => void;
  domains?: LifeDomain[];
}

const TAG_INDICATOR: Record<MilestoneTag, string> = {
  normal: '',
  wild: 'border-l-4 border-l-red-400',
  experiment: 'border-l-4 border-l-amber-400',
};

export function MilestoneCard({ milestone, onEdit, onDelete, domains = [] }: MilestoneCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: milestone.id,
    data: { milestone },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  // Find the domain for this milestone
  const domain = milestone.domain_id
    ? domains.find((d) => d.id === milestone.domain_id)
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`${milestone.tag ? TAG_INDICATOR[milestone.tag] : ''} ${isDragging ? 'shadow-lg z-50' : ''}`}
    >
      <CardContent className="py-2 px-3 space-y-2">
        {/* Top row: drag handle + domain badge */}
        <div className="flex items-center justify-between gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none shrink-0"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <DomainBadge domain={domain} fallbackCategory={milestone.category} />
        </div>

        {/* Content: title + description (full width) */}
        <div className="space-y-1">
          <p className="text-sm font-medium leading-tight">{milestone.title}</p>
          {milestone.description && (
            <p className="text-xs text-muted-foreground line-clamp-3">
              {milestone.description}
            </p>
          )}
        </div>

        {/* Bottom row: action buttons */}
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onEdit}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
