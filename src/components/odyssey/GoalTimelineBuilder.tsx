'use client';

import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, pointerWithin, DragStartEvent } from '@dnd-kit/core';
import { GoalYearColumn } from './GoalYearColumn';
import { GoalPool } from './GoalPool';
import { Card, CardContent } from '@/components/ui/card';
import { Target } from 'lucide-react';
import type { GoalWithAssignment } from '@/lib/types/odyssey';

interface GoalTimelineBuilderProps {
  unassignedGoals: GoalWithAssignment[];
  goalsByYear: Record<number, GoalWithAssignment[]>;
  yearNames?: Record<string, string>;
  onAssignGoal: (goalId: string, yearIndex: number) => void;
  onUnassignGoal: (goalId: string) => void;
  onEditGoal?: (goalId: string) => void;
}

export function GoalTimelineBuilder({
  unassignedGoals,
  goalsByYear,
  yearNames = {},
  onAssignGoal,
  onUnassignGoal,
  onEditGoal,
}: GoalTimelineBuilderProps) {
  const years = [1, 2, 3, 4, 5];
  const [activeGoal, setActiveGoal] = useState<GoalWithAssignment | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const item = event.active.data.current?.item as GoalWithAssignment | undefined;
    if (item) {
      setActiveGoal(item);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveGoal(null);

    const { active, over } = event;
    if (!over) return;

    const item = active.data.current?.item as GoalWithAssignment | undefined;
    if (!item) return;

    const goalId = item.goal.id;
    const overId = over.id as string;

    // Dropped on pool - unassign
    if (overId === 'goal-pool') {
      if (item.assignment) {
        onUnassignGoal(goalId);
      }
      return;
    }

    // Dropped on year column
    if (overId.startsWith('goal-year-')) {
      const newYear = parseInt(overId.replace('goal-year-', ''), 10);
      const currentYear = item.assignment?.year_index;

      if (currentYear !== newYear) {
        onAssignGoal(goalId, newYear);
      }
    }
  };

  const totalAssigned = years.reduce((sum, year) => sum + (goalsByYear[year]?.length || 0), 0);
  const totalGoals = unassignedGoals.length + totalAssigned;

  if (totalGoals === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-lg text-center">
        Esta rueda no tiene metas definidas. Ve a la rueda y agrega metas en el paso "Plan de accion".
      </div>
    );
  }

  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Unassigned goals pool */}
      <GoalPool goals={unassignedGoals} onEditGoal={onEditGoal} />

      {/* Year columns */}
      <div className="mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {years.map((year) => (
            <GoalYearColumn
              key={year}
              year={year}
              yearName={yearNames[String(year)]}
              goals={goalsByYear[year] || []}
              onEditGoal={onEditGoal}
              onUnassignGoal={onUnassignGoal}
            />
          ))}
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeGoal && (
          <Card className="shadow-xl rotate-3 w-[200px]">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-2">
                {activeGoal.domain?.icon ? (
                  <span>{activeGoal.domain.icon}</span>
                ) : (
                  <Target className="h-4 w-4 text-primary" />
                )}
                <p className="text-sm font-medium truncate">
                  {activeGoal.goal.title}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}
