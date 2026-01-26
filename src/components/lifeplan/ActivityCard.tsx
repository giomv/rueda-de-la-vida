'use client';

import { useState } from 'react';
import { Check, MoreVertical, Edit, Trash2, Archive, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { OriginBadge } from './OriginBadge';
import type { ActivityWithCompletions } from '@/lib/types/lifeplan';
import type { LifeDomain } from '@/lib/types';

interface ActivityCardProps {
  activity: ActivityWithCompletions;
  date: string;
  domain?: LifeDomain | null;
  onToggleComplete: (activityId: string, date: string) => void;
  onEdit?: (activityId: string) => void;
  onArchive?: (activityId: string) => void;
  onDelete?: (activityId: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ActivityCard({
  activity,
  date,
  domain,
  onToggleComplete,
  onEdit,
  onArchive,
  onDelete,
  disabled = false,
  className,
}: ActivityCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const completion = activity.completions.find((c) => c.date === date);
  const isCompleted = completion?.completed || false;

  const handleToggle = async () => {
    if (disabled || isUpdating) return;
    setIsUpdating(true);
    try {
      await onToggleComplete(activity.id, date);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card
      className={cn(
        'transition-all',
        isCompleted && 'opacity-60',
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={handleToggle}
            disabled={disabled || isUpdating}
            className={cn(
              'mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
              isCompleted
                ? 'bg-primary border-primary text-primary-foreground'
                : 'border-muted-foreground/30 hover:border-primary',
              (disabled || isUpdating) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isCompleted && <Check className="w-4 h-4" />}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3
                  className={cn(
                    'font-medium text-sm',
                    isCompleted && 'line-through text-muted-foreground'
                  )}
                >
                  {activity.title}
                </h3>
                {activity.notes && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {activity.notes}
                  </p>
                )}
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(activity.id)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {onArchive && (
                    <DropdownMenuItem onClick={() => onArchive(activity.id)}>
                      <Archive className="w-4 h-4 mr-2" />
                      Archivar
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(activity.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Metadata row */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {domain && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  {domain.icon && <span>{domain.icon}</span>}
                  {domain.name}
                </span>
              )}
              {activity.time_of_day && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {activity.time_of_day}
                </span>
              )}
              <OriginBadge origin={activity.source_type} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
