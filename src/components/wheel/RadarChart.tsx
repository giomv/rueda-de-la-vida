'use client';

import {
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { DOMAIN_COLORS } from '@/lib/utils/domain-suggestions';
import type { Domain, Score } from '@/lib/types';

interface RadarChartProps {
  domains: Domain[];
  scores: Score[];
  compareScores?: Score[];
  title?: string;
  showLabels?: boolean;
  height?: number;
}

export function RadarChart({
  domains,
  scores,
  compareScores,
  title,
  showLabels = true,
  height = 400,
}: RadarChartProps) {
  const data = domains.map((domain) => {
    const score = scores.find((s) => s.domain_id === domain.id);
    const compareScore = compareScores?.find((s) => s.domain_id === domain.id);
    return {
      domain: domain.name,
      score: score?.score ?? 0,
      ...(compareScore && { compareScore: compareScore.score }),
      fullMark: 10,
    };
  });

  if (data.length === 0) return null;

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-center font-semibold mb-2">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsRadar data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="domain"
            tick={showLabels ? { fontSize: 11, fill: 'currentColor' } : false}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 10]}
            tick={{ fontSize: 10 }}
            tickCount={6}
          />
          <Radar
            name="Puntuación"
            dataKey="score"
            stroke={DOMAIN_COLORS[0]}
            fill={DOMAIN_COLORS[0]}
            fillOpacity={0.3}
            strokeWidth={2}
          />
          {compareScores && (
            <Radar
              name="Comparación"
              dataKey="compareScore"
              stroke={DOMAIN_COLORS[3]}
              fill={DOMAIN_COLORS[3]}
              fillOpacity={0.15}
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  );
}
