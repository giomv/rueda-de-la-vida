'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Domain, Score } from '@/lib/types';

interface PriorityRankingProps {
  domains: Domain[];
  scores: Score[];
  focusDomains: string[];
  onReorder: (domainIds: string[]) => void;
  onToggleFocus: (domainId: string) => void;
}

function SortableItem({
  domain,
  score,
  rank,
  isFocus,
  onToggleFocus,
}: {
  domain: Domain;
  score: number;
  rank: number;
  isFocus: boolean;
  onToggleFocus: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: domain.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border bg-card transition-shadow',
        isDragging && 'shadow-lg border-primary/50 z-10',
        isFocus && 'border-primary/30 bg-primary/5'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>

      <span className="text-sm font-medium text-muted-foreground w-6">
        #{rank}
      </span>

      <span className="text-lg">{domain.icon}</span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{domain.name}</p>
        <p className="text-xs text-muted-foreground">Puntuación: {score}/10</p>
      </div>

      <button
        onClick={onToggleFocus}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          isFocus
            ? 'text-yellow-500 bg-yellow-500/10'
            : 'text-muted-foreground hover:text-yellow-500'
        )}
        title={isFocus ? 'Quitar enfoque' : 'Marcar como enfoque'}
      >
        <Star className={cn('h-4 w-4', isFocus && 'fill-current')} />
      </button>
    </div>
  );
}

export function PriorityRanking({
  domains,
  scores,
  focusDomains,
  onReorder,
  onToggleFocus,
}: PriorityRankingProps) {
  const [orderedIds, setOrderedIds] = useState(domains.map((d) => d.id));

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = orderedIds.indexOf(active.id as string);
      const newIndex = orderedIds.indexOf(over.id as string);
      const newOrder = arrayMove(orderedIds, oldIndex, newIndex);
      setOrderedIds(newOrder);
      onReorder(newOrder);
    }
  };

  const focusCount = focusDomains.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Arrastra para ordenar por prioridad
        </p>
        <p className="text-sm text-muted-foreground">
          Enfoque: {focusCount}/3
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {orderedIds.map((id, index) => {
              const domain = domains.find((d) => d.id === id);
              if (!domain) return null;
              const score = scores.find((s) => s.domain_id === id)?.score ?? 0;
              return (
                <SortableItem
                  key={id}
                  domain={domain}
                  score={score}
                  rank={index + 1}
                  isFocus={focusDomains.includes(id)}
                  onToggleFocus={() => onToggleFocus(id)}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {focusCount === 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Selecciona 1-3 dominios como enfoque principal tocando la estrella
        </p>
      )}
    </div>
  );
}
