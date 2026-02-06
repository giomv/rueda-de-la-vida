'use client';

import { useDroppable } from '@dnd-kit/core';
import { DraggableGoalCard } from './DraggableGoalCard';
import { cn } from '@/lib/utils';
import type { GoalWithAssignment } from '@/lib/types/odyssey';

interface GoalPoolProps {
  goals: GoalWithAssignment[];
  onEditGoal?: (goalId: string) => void;
}

export function GoalPool({ goals, onEditGoal }: GoalPoolProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'goal-pool',
    data: { type: 'pool' },
  });

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground">
        Metas sin asignar ({goals.length})
      </h3>
      <div
        ref={setNodeRef}
        className={cn(
          'min-h-[100px] p-3 border border-dashed rounded-lg transition-colors',
          isOver && 'bg-primary/10 border-primary'
        )}
      >
        {goals.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            {isOver
              ? 'Soltar aqui para desasignar'
              : 'Las metas de tu rueda apareceran aqui'}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {goals.map((item) => (
              <DraggableGoalCard
                key={item.goal.id}
                item={item}
                onEdit={onEditGoal}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
