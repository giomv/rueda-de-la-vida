'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Check } from 'lucide-react';
import { MilestoneCard } from './MilestoneCard';
import { MilestoneForm } from './MilestoneForm';
import type { OdysseyMilestone, MilestoneCategory, MilestoneTag, LifeDomain } from '@/lib/types';
import { cn } from '@/lib/utils';

interface YearColumnProps {
  year: number;
  yearName?: string;
  milestones: OdysseyMilestone[];
  onAdd: (data: { title: string; description: string; category: MilestoneCategory | null; domain_id: string | null; tag: MilestoneTag; year: number }) => void;
  onEdit: (milestoneId: string, data: { title: string; description: string; category: MilestoneCategory | null; domain_id: string | null; tag: MilestoneTag; year: number }) => void;
  onDelete: (milestoneId: string) => void;
  onYearNameChange?: (year: number, name: string) => void;
  showTags?: boolean;
  domains?: LifeDomain[];
}

export function YearColumn({ year, yearName, milestones, onAdd, onEdit, onDelete, onYearNameChange, showTags = false, domains = [] }: YearColumnProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<OdysseyMilestone | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(yearName || '');

  const { isOver, setNodeRef } = useDroppable({
    id: `year-${year}`,
    data: { year },
  });

  const displayName = yearName || `Año ${year}`;

  const handleSaveName = () => {
    onYearNameChange?.(year, nameValue.trim());
    setEditingName(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {editingName ? (
          <div className="flex items-center gap-1 flex-1 mr-2">
            <Input
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              placeholder={`Año ${year}`}
              className="h-7 text-xs"
              maxLength={30}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
            />
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleSaveName}>
              <Check className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setNameValue(yearName || '');
              setEditingName(true);
            }}
            className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <span>{displayName}</span>
            <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs shrink-0"
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Hito
        </Button>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'space-y-2 min-h-[80px] p-2 -m-2 rounded-lg transition-colors',
          isOver && 'bg-primary/10 ring-2 ring-primary/30'
        )}
      >
        {milestones.map((milestone) => (
          <MilestoneCard
            key={milestone.id}
            milestone={milestone}
            onEdit={() => setEditingMilestone(milestone)}
            onDelete={() => onDelete(milestone.id)}
            domains={domains}
          />
        ))}
        {milestones.length === 0 && (
          <div className={cn(
            'border border-dashed rounded-lg p-4 text-center transition-colors',
            isOver && 'border-primary bg-primary/5'
          )}>
            <p className="text-xs text-muted-foreground">
              {isOver ? 'Soltar aquí' : 'Sin hitos'}
            </p>
          </div>
        )}
      </div>

      <MilestoneForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSave={onAdd}
        year={year}
        showTags={showTags}
        domains={domains}
      />

      {editingMilestone && (
        <MilestoneForm
          open={true}
          onClose={() => setEditingMilestone(null)}
          onSave={(data) => {
            onEdit(editingMilestone.id, data);
            setEditingMilestone(null);
          }}
          year={editingMilestone.year}
          initial={editingMilestone}
          showTags={showTags}
          domains={domains}
        />
      )}
    </div>
  );
}
