'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Check } from 'lucide-react';
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

  if (milestones.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-sm text-muted-foreground">
            No hay hitos en este plan. Vuelve a editar el plan para agregar hitos.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {years.map((year) => (
        <div key={year}>
          <p className="text-xs font-medium text-muted-foreground mb-2">Año {year}</p>
          <div className="space-y-2">
            {milestonesByYear[year].map((milestone) => {
              const domain = milestone.domain_id
                ? domains.find((d) => d.id === milestone.domain_id)
                : undefined;
              const isSelected = selectedId === milestone.id;

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
      ))}
    </div>
  );
}
