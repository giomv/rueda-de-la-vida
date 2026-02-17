'use client';

import { generateOdysseyInsights } from '@/lib/utils/odyssey-insights';
import type { PlanWithMilestones } from '@/lib/types';
import { AlertCircle, CheckCircle2, Lightbulb } from 'lucide-react';

interface ComparisonInsightsProps {
  plans: PlanWithMilestones[];
  goalCounts?: Record<string, number>;
}

const ICONS = {
  strength: CheckCircle2,
  concern: AlertCircle,
  suggestion: Lightbulb,
};

const COLORS = {
  strength: 'text-green-600 dark:text-green-400',
  concern: 'text-amber-600 dark:text-amber-400',
  suggestion: 'text-blue-600 dark:text-blue-400',
};

export function ComparisonInsights({ plans, goalCounts }: ComparisonInsightsProps) {
  const insights = generateOdysseyInsights(plans, goalCounts);

  if (insights.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Observaciones</h3>
      <div className="space-y-2">
        {insights.map((insight, i) => {
          const Icon = ICONS[insight.type];
          return (
            <div key={i} className="flex items-start gap-2 text-sm">
              <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${COLORS[insight.type]}`} />
              <span>{insight.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
