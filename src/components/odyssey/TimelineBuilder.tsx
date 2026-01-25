'use client';

import { DndContext, DragEndEvent, DragOverlay, pointerWithin } from '@dnd-kit/core';
import { useState } from 'react';
import { YearColumn } from './YearColumn';
import { Card, CardContent } from '@/components/ui/card';
import { DomainBadge } from './DomainSelector';
import type { OdysseyMilestone, MilestoneCategory, MilestoneTag, LifeDomain } from '@/lib/types';

interface TimelineBuilderProps {
  milestones: OdysseyMilestone[];
  yearNames?: Record<string, string>;
  onAdd: (data: { title: string; description: string; category: MilestoneCategory | null; domain_id: string | null; tag: MilestoneTag; year: number }) => void;
  onEdit: (milestoneId: string, data: { title: string; description: string; category: MilestoneCategory | null; domain_id: string | null; tag: MilestoneTag; year: number }) => void;
  onDelete: (milestoneId: string) => void;
  onYearNameChange?: (year: number, name: string) => void;
  onMoveMilestone?: (milestoneId: string, newYear: number) => void;
  showTags?: boolean;
  domains?: LifeDomain[];
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
}: TimelineBuilderProps) {
  const years = [1, 2, 3, 4, 5];
  const [activeMilestone, setActiveMilestone] = useState<OdysseyMilestone | null>(null);

  const handleDragStart = (event: any) => {
    const milestone = event.active.data.current?.milestone;
    if (milestone) {
      setActiveMilestone(milestone);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveMilestone(null);

    const { active, over } = event;
    if (!over) return;

    const milestoneId = active.id as string;
    const milestone = active.data.current?.milestone as OdysseyMilestone;

    // Check if dropped on a year column
    const overId = over.id as string;
    if (overId.startsWith('year-')) {
      const newYear = parseInt(overId.replace('year-', ''), 10);
      if (milestone && milestone.year !== newYear) {
        if (onMoveMilestone) {
          onMoveMilestone(milestoneId, newYear);
        } else {
          // Fallback to onEdit if onMoveMilestone not provided
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

  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
      </DragOverlay>
    </DndContext>
  );
}
