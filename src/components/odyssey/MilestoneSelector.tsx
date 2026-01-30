'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Check, ChevronRight } from 'lucide-react';
import { DomainBadge } from './DomainSelector';
import type { OdysseyMilestone, LifeDomain } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MilestoneSelectorProps {
  milestones: OdysseyMilestone[];
  selectedId: string | null;
  onSelect: (milestoneId: string) => void;
  domains?: LifeDomain[];
}

export function MilestoneSelector({ milestones, selectedId, onSelect, domains = [] }: MilestoneSelectorProps) {
  // Group milestones by year
  const milestonesByYear = milestones.reduce((acc, m) => {
    if (!acc[m.year]) acc[m.year] = [];
    acc[m.year].push(m);
    return acc;
  }, {} as Record<number, OdysseyMilestone[]>);

  const years = Object.keys(milestonesByYear).map(Number).sort((a, b) => a - b);

  // Track expanded year - defaults to year of selected milestone or first year
  const [expandedYear, setExpandedYear] = useState<number | null>(null);

  // Set initial expanded year based on selected milestone
  useEffect(() => {
    if (selectedId) {
      const selectedMilestone = milestones.find((m) => m.id === selectedId);
      if (selectedMilestone) {
        setExpandedYear(selectedMilestone.year);
      }
    } else if (years.length > 0 && expandedYear === null) {
      setExpandedYear(years[0]);
    }
  }, [selectedId, milestones]);

  if (milestones.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-sm text-muted-foreground">
            No hay metas en este plan. Vuelve a editar el plan para agregar metas.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleYearClick = (year: number) => {
    setExpandedYear(expandedYear === year ? null : year);
  };

  return (
    <div className="space-y-2">
      {years.map((year) => {
        const isExpanded = expandedYear === year;
        const yearMilestones = milestonesByYear[year];
        const hasSelectedMilestone = yearMilestones.some((m) => m.id === selectedId);

        // Collapsed year view
        if (!isExpanded) {
          return (
            <button
              key={year}
              type="button"
              onClick={() => handleYearClick(year)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-left',
                hasSelectedMilestone
                  ? 'border-primary/50 bg-primary/5'
                  : 'bg-muted/50 hover:bg-muted'
              )}
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Año {year}</span>
              <span className="text-xs text-muted-foreground bg-background px-1.5 py-0.5 rounded-full">
                {yearMilestones.length}
              </span>
              {hasSelectedMilestone && (
                <span className="ml-auto text-xs text-primary">Seleccionado</span>
              )}
            </button>
          );
        }

        // Expanded year view
        return (
          <div key={year}>
            <button
              type="button"
              onClick={() => handleYearClick(year)}
              className="flex items-center gap-2 mb-2 text-left"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground rotate-90 transition-transform" />
              <span className="text-xs font-medium text-muted-foreground">Año {year}</span>
            </button>
            <div className="space-y-2 pl-6">
              {yearMilestones.map((milestone) => {
                const domain = milestone.domain_id
                  ? domains.find((d) => d.id === milestone.domain_id)
                  : undefined;
                const isSelected = selectedId === milestone.id;

                // Collapsed milestone view (when another milestone is selected)
                if (selectedId && !isSelected) {
                  return (
                    <button
                      key={milestone.id}
                      type="button"
                      onClick={() => onSelect(milestone.id)}
                      className="w-full flex items-center gap-3 px-4 py-2 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                      <span className="text-sm text-muted-foreground truncate">{milestone.title}</span>
                    </button>
                  );
                }

                // Full milestone view (selected or no selection yet)
                return (
                  <Card
                    key={milestone.id}
                    className={cn(
                      'cursor-pointer transition-colors',
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'hover:border-muted-foreground/50'
                    )}
                    onClick={() => onSelect(milestone.id)}
                  >
                    <CardContent className="py-3 px-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                            isSelected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-muted-foreground/30'
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">{milestone.title}</p>
                          {milestone.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {milestone.description}
                            </p>
                          )}
                          <DomainBadge domain={domain} fallbackCategory={milestone.category} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
