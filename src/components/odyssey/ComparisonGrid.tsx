'use client';

import { PlanSummaryCard } from './PlanSummaryCard';
import type { PlanWithMilestones } from '@/lib/types';

interface ComparisonGridProps {
  plans: PlanWithMilestones[];
  activePlanNumber: number | null;
  onSelectPlan: (planNumber: number) => void;
}

export function ComparisonGrid({ plans, activePlanNumber, onSelectPlan }: ComparisonGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {plans.map((plan) => (
        <PlanSummaryCard
          key={plan.id}
          plan={plan}
          isSelected={activePlanNumber === plan.plan_number}
          onSelect={() => onSelectPlan(plan.plan_number)}
        />
      ))}
    </div>
  );
}
