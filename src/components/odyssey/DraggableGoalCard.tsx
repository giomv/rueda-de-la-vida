'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Pencil, X, Target } from 'lucide-react';
import { OriginBadge } from '@/components/lifeplan/OriginBadge';
import { cn } from '@/lib/utils';
import type { GoalWithAssignment } from '@/lib/types/odyssey';

interface DraggableGoalCardProps {
  item: GoalWithAssignment;
  onEdit?: (goalId: string) => void;
  onUnassign?: (goalId: string) => void;
  showUnassign?: boolean;
}

export function DraggableGoalCard({
  item,
  onEdit,
  onUnassign,
  showUnassign = false,
}: DraggableGoalCardProps) {
  const { goal, domain } = item;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `goal-${goal.id}`,
    data: { goal, item },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'transition-shadow',
        isDragging && 'shadow-lg z-50'
      )}
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
          {domain ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary truncate max-w-[120px]">
              {domain.icon && <span>{domain.icon}</span>}
              <span className="truncate">{domain.name}</span>
            </span>
          ) : (
            <Target className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Content */}
        <div className="space-y-1">
          <p className="text-sm font-medium leading-tight">{goal.title}</p>
          {goal.metric && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {goal.metric}
            </p>
          )}
        </div>

        {/* Bottom row: origin badge + actions */}
        <div className="flex items-center justify-between gap-1">
          <OriginBadge origin={goal.origin} />
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onEdit(goal.id)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            )}
            {showUnassign && onUnassign && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={() => onUnassign(goal.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
