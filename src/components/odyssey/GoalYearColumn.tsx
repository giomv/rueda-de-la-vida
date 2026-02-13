'use client';

import { useDroppable } from '@dnd-kit/core';
import { DraggableGoalCard } from './DraggableGoalCard';
import { cn } from '@/lib/utils';
import type { GoalWithAssignment } from '@/lib/types/odyssey';

interface GoalYearColumnProps {
  year: number;
  yearName?: string;
  goals: GoalWithAssignment[];
  onEditGoal?: (goalId: string) => void;
  onUnassignGoal?: (goalId: string) => void;
}

export function GoalYearColumn({
  year,
  yearName,
  goals,
  onEditGoal,
  onUnassignGoal,
}: GoalYearColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `goal-year-${year}`,
    data: { year, type: 'year' },
  });

  const displayName = yearName || `Año ${year}`;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground truncate">
        {displayName}
      </h4>
      <div
        ref={setNodeRef}
        className={cn(
          'space-y-2 min-h-[80px] p-2 -m-2 rounded-lg transition-colors',
          isOver && 'bg-primary/10 ring-2 ring-primary/30'
        )}
      >
        {goals.map((item) => (
          <DraggableGoalCard
            key={item.goal.id}
            item={item}
            onEdit={onEditGoal}
            onUnassign={onUnassignGoal}
            showUnassign
          />
        ))}
        {goals.length === 0 && (
          <div
            className={cn(
              'border border-dashed rounded-lg p-4 text-center transition-colors',
              isOver && 'border-primary bg-primary/5'
            )}
          >
            <p className="text-xs text-muted-foreground">
              {isOver ? 'Soltar aqui' : 'Arrastra metas'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
