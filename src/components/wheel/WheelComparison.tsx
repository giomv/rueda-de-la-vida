'use client';

import { RadarChart } from './RadarChart';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { Domain, Score } from '@/lib/types';

interface WheelComparisonProps {
  domains: Domain[];
  scoresA: Score[];
  scoresB: Score[];
  labelA: string;
  labelB: string;
}

export function WheelComparison({
  domains,
  scoresA,
  scoresB,
  labelA,
  labelB,
}: WheelComparisonProps) {
  const deltas = domains.map((domain) => {
    const scoreA = scoresA.find((s) => s.domain_id === domain.id)?.score ?? 0;
    const scoreB = scoresB.find((s) => s.domain_id === domain.id)?.score ?? 0;
    const delta = scoreB - scoreA;
    return { domain, scoreA, scoreB, delta };
  });

  return (
    <div className="space-y-6">
      {/* Overlaid chart */}
      <RadarChart
        domains={domains}
        scores={scoresA}
        compareScores={scoresB}
        height={350}
      />

      {/* Legend */}
      <div className="flex justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-violet-500" />
          <span className="text-sm">{labelA}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-sm">{labelB}</span>
        </div>
      </div>

      {/* Delta table */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Cambios por dominio</h4>
        {deltas.map(({ domain, scoreA, scoreB, delta }) => (
          <div
            key={domain.id}
            className="flex items-center justify-between p-2 rounded-lg border border-border"
          >
            <div className="flex items-center gap-2">
              <span>{domain.icon}</span>
              <span className="text-sm">{domain.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {scoreA} → {scoreB}
              </span>
              <Badge
                variant={delta > 0 ? 'default' : delta < 0 ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {delta > 0 ? (
                  <><ArrowUp className="h-3 w-3 mr-0.5" /> +{delta}</>
                ) : delta < 0 ? (
                  <><ArrowDown className="h-3 w-3 mr-0.5" /> {delta}</>
                ) : (
                  <><Minus className="h-3 w-3 mr-0.5" /> 0</>
                )}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
