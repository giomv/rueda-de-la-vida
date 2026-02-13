'use client';

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, pointerWithin } from '@dnd-kit/core';
import { useState } from 'react';
import { YearColumn } from './YearColumn';
import { GoalPool } from './GoalPool';
import { Card, CardContent } from '@/components/ui/card';
import { Target } from 'lucide-react';
import { DomainBadge } from './DomainSelector';
import type { OdysseyMilestone, MilestoneCategory, MilestoneTag, LifeDomain } from '@/lib/types';
import type { GoalWithAssignment } from '@/lib/types/odyssey';

interface TimelineBuilderProps {
  milestones: OdysseyMilestone[];
  yearNames?: Record<string, string>;
  onAdd: (data: { title: string; description: string; category: MilestoneCategory | null; domain_id: string | null; tag: MilestoneTag; year: number; replicateToAllYears?: boolean }) => void;
  onEdit: (milestoneId: string, data: { title: string; description: string; category: MilestoneCategory | null; domain_id: string | null; tag: MilestoneTag; year: number }) => void;
  onDelete: (milestoneId: string) => void;
  onYearNameChange?: (year: number, name: string) => void;
  onMoveMilestone?: (milestoneId: string, newYear: number) => void;
  showTags?: boolean;
  domains?: LifeDomain[];
  // Goal-related props (optional)
  unassignedGoals?: GoalWithAssignment[];
  goalsByYear?: Record<number, GoalWithAssignment[]>;
  onAssignGoal?: (goalId: string, yearIndex: number) => void;
  onUnassignGoal?: (goalId: string) => void;
  onEditGoal?: (goalId: string) => void;
}

export function TimelineBuilder({
  milestones,
  yearNames = {},
  onAdd,
  onEdit,
  onDelete,
  onYearNameChange,
  onMoveMilestone,
  showTags = false,
  domains = [],
  unassignedGoals,
  goalsByYear,
  onAssignGoal,
  onUnassignGoal,
  onEditGoal,
}: TimelineBuilderProps) {
  const years = [1, 2, 3, 4, 5];
  const [activeMilestone, setActiveMilestone] = useState<OdysseyMilestone | null>(null);
  const [activeGoal, setActiveGoal] = useState<GoalWithAssignment | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const milestone = event.active.data.current?.milestone;
    if (milestone) {
      setActiveMilestone(milestone);
      return;
    }
    const goalItem = event.active.data.current?.item as GoalWithAssignment | undefined;
    if (goalItem) {
      setActiveGoal(goalItem);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveMilestone(null);
    setActiveGoal(null);

    const { active, over } = event;
    if (!over) return;

    const overId = over.id as string;

    // Check if it's a goal drag
    const goalItem = active.data.current?.item as GoalWithAssignment | undefined;
    if (goalItem) {
      const goalId = goalItem.goal.id;

      // Dropped on pool - unassign
      if (overId === 'goal-pool') {
        if (goalItem.assignment) {
          onUnassignGoal?.(goalId);
        }
        return;
      }

      // Dropped on year column
      if (overId.startsWith('year-')) {
        const newYear = parseInt(overId.replace('year-', ''), 10);
        const currentYear = goalItem.assignment?.year_index;
        if (currentYear !== newYear) {
          onAssignGoal?.(goalId, newYear);
        }
      }
      return;
    }

    // Otherwise, it's a milestone drag
    const milestoneId = active.id as string;
    const milestone = active.data.current?.milestone as OdysseyMilestone;

    if (overId.startsWith('year-')) {
      const newYear = parseInt(overId.replace('year-', ''), 10);
      if (milestone && milestone.year !== newYear) {
        if (onMoveMilestone) {
          onMoveMilestone(milestoneId, newYear);
        } else {
          onEdit(milestoneId, {
            title: milestone.title,
            description: milestone.description || '',
            category: milestone.category,
            domain_id: milestone.domain_id,
            tag: milestone.tag || 'normal',
            year: newYear,
          });
        }
      }
    }
  };

  // Get domain for the active milestone
  const activeDomain = activeMilestone?.domain_id
    ? domains.find((d) => d.id === activeMilestone.domain_id)
    : undefined;

  const hasGoals = unassignedGoals !== undefined;

  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {hasGoals && (
        <div className="mb-4">
          <GoalPool goals={unassignedGoals} onEditGoal={onEditGoal} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {years.map((year) => (
          <YearColumn
            key={year}
            year={year}
            yearName={yearNames[String(year)]}
            milestones={milestones.filter((m) => m.year === year)}
            onAdd={onAdd}
            onEdit={onEdit}
            onDelete={onDelete}
            onYearNameChange={onYearNameChange}
            showTags={showTags}
            domains={domains}
            goals={goalsByYear?.[year]}
            onEditGoal={onEditGoal}
            onUnassignGoal={onUnassignGoal}
          />
        ))}
      </div>

      <DragOverlay>
        {activeMilestone && (
          <Card className="shadow-xl rotate-3 w-[200px]">
            <CardContent className="py-3 px-4">
              <p className="text-sm font-medium truncate">{activeMilestone.title}</p>
              <DomainBadge domain={activeDomain} fallbackCategory={activeMilestone.category} />
            </CardContent>
          </Card>
        )}
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
