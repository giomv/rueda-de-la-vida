import type { PlanWithMilestones } from '@/lib/types';

export interface OdysseyInsight {
  type: 'strength' | 'concern' | 'suggestion';
  text: string;
}

export function generateOdysseyInsights(plans: PlanWithMilestones[]): OdysseyInsight[] {
  const insights: OdysseyInsight[] = [];

  if (plans.length === 0) return insights;

  // Find the plan with highest average score
  const planAverages = plans.map((plan) => {
    const scores = [plan.energy_score, plan.confidence_score, plan.resources_score].filter((s) => s !== null) as number[];
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return { plan, avg };
  });

  const highest = planAverages.reduce((a, b) => (a.avg > b.avg ? a : b));
  if (highest.avg > 0) {
    insights.push({
      type: 'strength',
      text: `El Plan ${highest.plan.plan_number} tiene la puntuación promedio más alta (${highest.avg.toFixed(1)}/10).`,
    });
  }

  // Find plan with most milestones
  const mostMilestones = plans.reduce((a, b) => (a.milestones.length > b.milestones.length ? a : b));
  if (mostMilestones.milestones.length > 0) {
    insights.push({
      type: 'suggestion',
      text: `El Plan ${mostMilestones.plan_number} es el más detallado con ${mostMilestones.milestones.length} hitos.`,
    });
  }

  // Check for low confidence
  const lowConfidence = plans.filter((p) => p.confidence_score !== null && p.confidence_score <= 3);
  if (lowConfidence.length > 0) {
    insights.push({
      type: 'concern',
      text: `${lowConfidence.length === 1 ? 'Un plan tiene' : `${lowConfidence.length} planes tienen`} baja confianza. Considera qué necesitas para sentirte más seguro/a.`,
    });
  }

  // Check for high energy
  const highEnergy = plans.filter((p) => p.energy_score !== null && p.energy_score >= 8);
  if (highEnergy.length > 0) {
    insights.push({
      type: 'strength',
      text: `${highEnergy.length === 1 ? 'El Plan ' + highEnergy[0].plan_number + ' te da' : `${highEnergy.length} planes te dan`} mucha energía. La motivación es clave para el éxito.`,
    });
  }

  // Check for resource gaps
  const resourceGaps = plans.filter((p) =>
    p.energy_score !== null && p.resources_score !== null &&
    p.energy_score >= 7 && p.resources_score <= 4
  );
  if (resourceGaps.length > 0) {
    insights.push({
      type: 'concern',
      text: `El Plan ${resourceGaps[0].plan_number} te emociona pero carece de recursos. El prototipo te ayudará a explorar opciones.`,
    });
  }

  return insights.slice(0, 4);
}
