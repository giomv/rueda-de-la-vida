'use client';

import { useState } from 'react';
import { GoalCard } from './GoalCard';
import { GoalDetailSheet } from './GoalDetailSheet';
import type { GoalProgress } from '@/lib/types/dashboard';

interface GoalsListProps {
  goals: GoalProgress[];
}

export function GoalsList({ goals }: GoalsListProps) {
  const [selectedGoal, setSelectedGoal] = useState<GoalProgress | null>(null);

  if (goals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Sin metas activas</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal) => (
          <GoalCard
            key={goal.goal.id}
            data={goal}
            onClick={() => setSelectedGoal(goal)}
          />
        ))}
      </div>

      <GoalDetailSheet
        data={selectedGoal}
        open={!!selectedGoal}
        onOpenChange={(open) => !open && setSelectedGoal(null)}
      />
    </>
  );
}
