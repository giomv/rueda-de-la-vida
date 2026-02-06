// Plan de Vida (Odyssey Plan) types

import type { Goal, LifeDomain } from './index';

export interface Odyssey {
  id: string;
  user_id: string;
  title: string;
  mode: 'individual' | 'pareja';
  active_plan_number: number | null;
  current_step: string;
  selected_wheel_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OdysseyPlan {
  id: string;
  odyssey_id: string;
  plan_number: number;
  headline: string | null;
  energy_score: number | null;
  confidence_score: number | null;
  resources_score: number | null;
  excitement_text: string | null;
  concern_text: string | null;
  year_names: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface OdysseyMilestone {
  id: string;
  plan_id: string;
  year: number;
  category: MilestoneCategory | null;  // Legacy - kept for backwards compatibility
  domain_id: string | null;  // New - references life_domains
  title: string;
  description: string | null;
  tag: MilestoneTag | null;
  order_position: number;
  created_at: string;
}

export interface OdysseyFeedback {
  id: string;
  plan_id: string;
  person_name: string;
  feedback_text: string;
  order_position: number;
  created_at: string;
}

// Legacy alias for backwards compatibility
export type OdysseyQuestion = OdysseyFeedback;

export interface OdysseyPrototype {
  id: string;
  odyssey_id: string;
  plan_id: string;
  target_milestone_id: string | null;
  start_date: string;
  status: 'active' | 'completed' | 'abandoned';
  reflection_learned: string | null;
  reflection_adjust: string | null;
  reflection_next_step: string | null;
  created_at: string;
}

export interface OdysseyPrototypeStep {
  id: string;
  prototype_id: string;
  milestone_id: string | null;
  step_type: PrototypeStepType;
  title: string;
  description: string | null;
  created_at: string;
}

export interface OdysseyWeeklyCheck {
  id: string;
  prototype_id: string;
  week_number: number;
  conversation_done: boolean;
  experiment_done: boolean;
  skill_done: boolean;
  notes: string | null;
  completed_at: string | null;
}

export interface OdysseyPrototypeAction {
  id: string;
  prototype_id: string;
  milestone_id: string | null;
  text: string;
  frequency_type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONCE';
  completed: boolean;
  created_at: string;
}

export interface SharedOdyssey {
  id: string;
  partnership_id: string;
  odyssey_id: string;
  shared_by: string;
  created_at: string;
}

// Goal assignment to a year within a plan
export interface OdysseyGoalAssignment {
  id: string;
  odyssey_id: string;
  plan_id: string;
  goal_id: string;
  year_index: number;  // 1-5
  order_position: number;
  created_at: string;
}

// Goal with assignment info (for UI display)
export interface GoalWithAssignment {
  goal: Goal;
  assignment: OdysseyGoalAssignment | null;
  domain?: LifeDomain | null;
}

// Composite types
export interface OdysseyWithPlans extends Odyssey {
  plans: OdysseyPlan[];
}

export interface PlanWithMilestones extends OdysseyPlan {
  milestones: OdysseyMilestone[];
  feedback: OdysseyFeedback[];
  questions?: OdysseyFeedback[];  // Legacy alias
}

export interface FullOdysseyData {
  odyssey: Odyssey;
  plans: PlanWithMilestones[];
  prototype: OdysseyPrototype | null;
  prototypeSteps: OdysseyPrototypeStep[];
  prototypeActions: OdysseyPrototypeAction[];
  weeklyChecks: OdysseyWeeklyCheck[];
}

// Category and tag types
export type MilestoneCategory = 'personal' | 'career' | 'health' | 'finance' | 'couple' | 'other';
export type MilestoneTag = 'normal' | 'wild' | 'experiment';
export type PrototypeStepType = 'conversation' | 'experiment' | 'skill';

// Note: 'preguntas' and 'dashboard' kept for backwards compatibility but removed from wizard
export type OdysseyStep = 'plan-1' | 'plan-2' | 'plan-3' | 'preguntas' | 'dashboard' | 'comparacion' | 'prototipo';

// Constants - questions and indicators are now integrated into each plan page
export const ODYSSEY_WIZARD_STEPS: { key: OdysseyStep; label: string }[] = [
  { key: 'plan-1', label: 'Plan 1' },
  { key: 'plan-2', label: 'Plan 2' },
  { key: 'plan-3', label: 'Plan 3' },
  { key: 'comparacion', label: 'Comparación' },
  { key: 'prototipo', label: 'Prototipo' },
];

export const MILESTONE_CATEGORIES: { key: MilestoneCategory; label: string; icon: string }[] = [
  { key: 'personal', label: 'Personal', icon: '🌱' },
  { key: 'career', label: 'Carrera', icon: '💼' },
  { key: 'health', label: 'Salud', icon: '💪' },
  { key: 'finance', label: 'Finanzas', icon: '💰' },
  { key: 'couple', label: 'Pareja', icon: '❤️' },
  { key: 'other', label: 'Otro', icon: '✨' },
];

export const PLAN_TYPES: { number: number; title: string; subtitle: string; color: string }[] = [
  { number: 1, title: 'Camino Actual', subtitle: 'Tu vida si sigues el rumbo actual', color: 'blue' },
  { number: 2, title: 'Alternativa', subtitle: 'Si tu Plan 1 no fuera posible', color: 'green' },
  { number: 3, title: 'Carta Salvaje', subtitle: 'Sin limitaciones de dinero ni opiniones', color: 'purple' },
];

export const DASHBOARD_SLIDERS: { key: 'energy_score' | 'confidence_score' | 'resources_score'; label: string; description: string }[] = [
  { key: 'energy_score', label: 'Energía', description: '¿Cuánta energía te da este plan?' },
  { key: 'confidence_score', label: 'Confianza', description: '¿Qué tan seguro/a estás de lograrlo?' },
  { key: 'resources_score', label: 'Recursos', description: '¿Tienes los recursos necesarios?' },
];

export const INSPIRE_PROMPTS: string[] = [
  '¿Dónde te ves viviendo en 5 años?',
  '¿Qué logro profesional te haría sentir realizado/a?',
  '¿Cómo sería tu rutina diaria ideal?',
  '¿Qué relaciones quieres cultivar?',
  '¿Qué nueva habilidad te gustaría dominar?',
  '¿Qué impacto quieres tener en tu comunidad?',
];

export const CREATIVE_PROMPTS_PLAN2: string[] = [
  '¿Qué harías si tu trabajo actual desapareciera?',
  '¿Qué carrera elegirías si empezaras de cero?',
  '¿Qué pasaría si te mudaras a otro país?',
  '¿Qué proyecto empezarías si tuvieras un año sabático?',
  '¿Qué harías si pudieras reinventarte profesionalmente?',
  '¿Qué sueño has pospuesto que podrías retomar?',
];

export const WILD_PROMPTS_PLAN3: string[] = [
  '¿Qué harías si el dinero no fuera un problema?',
  '¿Qué vida elegirías si nadie te juzgara?',
  '¿Cuál es tu fantasía más loca de vida ideal?',
  '¿Qué harías si supieras que no puedes fallar?',
  '¿Qué vida diseñarías si empezaras desde cero hoy?',
  '¿Qué aventura siempre has soñado pero nunca te atreviste?',
];

export const MILESTONE_TAGS: { key: MilestoneTag; label: string; color: string }[] = [
  { key: 'normal', label: 'Normal', color: 'default' },
  { key: 'wild', label: 'Salvaje', color: 'destructive' },
  { key: 'experiment', label: 'Experimento', color: 'secondary' },
];

export const PROTOTYPE_STEP_TYPES: { key: PrototypeStepType; label: string; description: string; icon: string }[] = [
  { key: 'conversation', label: 'Conversación', description: 'Habla con alguien que ya vive este plan', icon: '💬' },
  { key: 'experiment', label: 'Experimento', description: 'Prueba algo pequeño relacionado con este plan', icon: '🧪' },
  { key: 'skill', label: 'Habilidad', description: 'Aprende algo nuevo que necesitas para este plan', icon: '📚' },
];
