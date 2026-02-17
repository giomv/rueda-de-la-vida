'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PLAN_TYPES, MILESTONE_CATEGORIES } from '@/lib/types';
import type { PlanWithMilestones } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PlanSummaryCardProps {
  plan: PlanWithMilestones;
  isSelected: boolean;
  onSelect: () => void;
  assignedGoalCount?: number;
}

const PLAN_COLORS: Record<number, string> = {
  1: 'border-blue-300 dark:border-blue-700',
  2: 'border-green-300 dark:border-green-700',
  3: 'border-purple-300 dark:border-purple-700',
};

const PLAN_SELECTED_COLORS: Record<number, string> = {
  1: 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20',
  2: 'border-green-500 bg-green-50/50 dark:bg-green-950/20',
  3: 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20',
};

export function PlanSummaryCard({ plan, isSelected, onSelect, assignedGoalCount = 0 }: PlanSummaryCardProps) {
  const planType = PLAN_TYPES.find((p) => p.number === plan.plan_number);
  const totalGoals = plan.milestones.length + assignedGoalCount;
  const topMilestones = plan.milestones.slice(0, 3);

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all border-2',
        isSelected ? PLAN_SELECTED_COLORS[plan.plan_number] : PLAN_COLORS[plan.plan_number],
        'hover:shadow-md'
      )}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Plan {plan.plan_number}: {planType?.title}</span>
          {isSelected && (
            <Badge variant="default" className="text-xs">Elegido</Badge>
          )}
        </CardTitle>
        {plan.headline && (
          <p className="text-xs text-muted-foreground line-clamp-2">{plan.headline}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Mini sliders */}
        <div className="space-y-1.5">
          {[
            { label: 'Energía', value: plan.energy_score },
            { label: 'Confianza', value: plan.confidence_score },
            { label: 'Recursos', value: plan.resources_score },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-16">{item.label}</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${((item.value ?? 0) / 10) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium w-4">{item.value ?? 0}</span>
            </div>
          ))}
        </div>

        {/* Top milestones */}
        {topMilestones.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Metas principales:</p>
            {topMilestones.map((m) => (
              <p key={m.id} className="text-xs truncate">
                Año {m.year}: {m.title}
              </p>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {totalGoals} metas en total
        </p>
      </CardContent>
    </Card>
  );
}
