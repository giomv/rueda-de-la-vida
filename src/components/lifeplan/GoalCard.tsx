'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Target, MoreVertical, Edit, Trash2, Archive, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { OriginBadge } from './OriginBadge';
import type { Goal } from '@/lib/types/lifeplan';
import type { LifeDomain } from '@/lib/types';

interface GoalCardProps {
  goal: Goal;
  domain?: LifeDomain | null;
  activityCount?: number;
  onEdit?: (goalId: string) => void;
  onArchive?: (goalId: string) => void;
  onDelete?: (goalId: string) => void;
  className?: string;
}

export function GoalCard({
  goal,
  domain,
  activityCount = 0,
  onEdit,
  onArchive,
  onDelete,
  className,
}: GoalCardProps) {
  const router = useRouter();

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('es', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow',
        className
      )}
      onClick={() => router.push(`/mi-plan/metas/${goal.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            {domain?.icon ? (
              <span className="text-lg">{domain.icon}</span>
            ) : (
              <Target className="w-5 h-5 text-primary" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-medium text-sm line-clamp-2">{goal.title}</h3>
                {goal.metric && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {goal.metric}
                  </p>
                )}
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onEdit(goal.id);
                    }}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {onArchive && (
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onArchive(goal.id);
                    }}>
                      <Archive className="w-4 h-4 mr-2" />
                      Archivar
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(goal.id);
                      }}
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
                <span className="text-xs text-muted-foreground">
                  {domain.name}
                </span>
              )}
              {goal.target_date && (
                <Badge variant="outline" className="text-xs">
                  {formatDate(goal.target_date)}
                </Badge>
              )}
              <OriginBadge origin={goal.origin} />
              {activityCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {activityCount} {activityCount === 1 ? 'acción' : 'acciones'}
                </span>
              )}
            </div>
          </div>

          {/* Chevron */}
          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
