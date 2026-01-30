'use client';

import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

interface SMARTGoalTooltipProps {
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Context for analytics tracking (e.g., 'rueda', 'mi_plan') */
  source?: string;
}

/**
 * Shared SMART goal tooltip component.
 * Used in Rueda de la Vida (Plan step) and Mi Plan (new goal flow).
 */
export function SMARTGoalTooltip({ side = 'top', source }: SMARTGoalTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info
          className="h-4 w-4 text-muted-foreground cursor-help"
          data-analytics-source={source}
        />
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs">
        <p className="font-semibold">Meta SMART = clara y medible.</p>
        <p className="mt-1">Define qué quieres lograr, cuánto, y para cuándo.</p>
        <p className="mt-1 text-muted-foreground">Ejemplo: &quot;Ahorrar S/ 500 al mes hasta junio.&quot;</p>
      </TooltipContent>
    </Tooltip>
  );
}
