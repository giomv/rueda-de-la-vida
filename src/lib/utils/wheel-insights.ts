import type { Domain, Score, Priority } from '@/lib/types';

export interface WheelInsight {
  type: 'highest' | 'lowest' | 'gap' | 'focus';
  title: string;
  description: string;
  domainName: string;
  value?: number;
}

export function generateInsights(
  domains: Domain[],
  scores: Score[],
  priorities: Priority[]
): WheelInsight[] {
  const insights: WheelInsight[] = [];

  if (scores.length === 0) return insights;

  const domainScores = domains.map((domain) => {
    const score = scores.find((s) => s.domain_id === domain.id);
    return { domain, score: score?.score ?? 0 };
  });

  // Sort by score
  const sorted = [...domainScores].sort((a, b) => b.score - a.score);

  // Highest
  const highest = sorted[0];
  if (highest) {
    insights.push({
      type: 'highest',
      title: 'Tu punto fuerte',
      description: `${highest.domain.name} es tu área con mayor puntuación (${highest.score}/10).`,
      domainName: highest.domain.name,
      value: highest.score,
    });
  }

  // Lowest
  const lowest = sorted[sorted.length - 1];
  if (lowest && lowest.score !== highest?.score) {
    insights.push({
      type: 'lowest',
      title: 'Área de oportunidad',
      description: `${lowest.domain.name} tiene la puntuación más baja (${lowest.score}/10).`,
      domainName: lowest.domain.name,
      value: lowest.score,
    });
  }

  // Biggest gap
  if (sorted.length >= 2) {
    const gap = highest!.score - lowest!.score;
    if (gap >= 4) {
      insights.push({
        type: 'gap',
        title: 'Mayor brecha',
        description: `Hay ${gap} puntos de diferencia entre ${highest!.domain.name} y ${lowest!.domain.name}.`,
        domainName: `${highest!.domain.name} - ${lowest!.domain.name}`,
        value: gap,
      });
    }
  }

  // Focus areas with low scores
  const focusDomains = priorities.filter((p) => p.is_focus);
  focusDomains.forEach((priority) => {
    const domain = domains.find((d) => d.id === priority.domain_id);
    const score = scores.find((s) => s.domain_id === priority.domain_id);
    if (domain && score && score.score <= 5) {
      insights.push({
        type: 'focus',
        title: 'Prioridad + baja puntuación',
        description: `${domain.name} es una prioridad y tiene puntuación ${score.score}/10.`,
        domainName: domain.name,
        value: score.score,
      });
    }
  });

  return insights;
}

export function calculateAverage(scores: Score[]): number {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((acc, s) => acc + s.score, 0);
  return Math.round((sum / scores.length) * 10) / 10;
}

export function calculateBalance(scores: Score[]): number {
  if (scores.length < 2) return 100;
  const values = scores.map((s) => s.score);
  const max = Math.max(...values);
  const min = Math.min(...values);
  return Math.round(((10 - (max - min)) / 10) * 100);
}
