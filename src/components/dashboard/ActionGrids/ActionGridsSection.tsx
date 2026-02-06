'use client';

import { DailyGrid } from './DailyGrid';
import { WeeklyGrid } from './WeeklyGrid';
import { MonthlyGrid } from './MonthlyGrid';
import { OnceGrid } from './OnceGrid';
import { GridLegend } from './GridLegend';
import type { ActionGridData } from '@/lib/types/dashboard';

interface ActionGridsSectionProps {
  data: ActionGridData | null;
}

export function ActionGridsSection({ data }: ActionGridsSectionProps) {
  if (!data) {
    return null;
  }

  const { daysInMonth, weekBuckets, daily, weekly, monthly, once } = data;

  return (
    <div className="space-y-4">
      {/* Legend */}
      <GridLegend />

      {/* Daily Grid - Full width with horizontal scroll */}
      <DailyGrid data={daily} daysInMonth={daysInMonth} />

      {/* Weekly + Monthly side by side on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <WeeklyGrid data={weekly} weekBuckets={weekBuckets} />
        <MonthlyGrid data={monthly} />
      </div>

      <OnceGrid data={once} />
      {/* Once Grid */}
    </div>
  );
}
