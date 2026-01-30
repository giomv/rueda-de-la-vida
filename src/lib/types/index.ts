export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  dark_mode: boolean;
  reminders_enabled: boolean;
  created_at: string;
}

export interface Wheel {
  id: string;
  user_id: string | null;
  title: string;
  mode: 'individual' | 'pareja' | 'compartida';
  is_guest: boolean;
  guest_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface Domain {
  id: string;
  wheel_id: string;
  name: string;
  icon: string | null;
  order_position: number;
  created_at: string;
}

export interface Score {
  id: string;
  wheel_id: string;
  domain_id: string;
  score: number;
  notes: string | null;
  scored_at: string;
}

export interface Priority {
  id: string;
  wheel_id: string;
  domain_id: string;
  rank: number;
  is_focus: boolean;
}

export interface Reflection {
  id: string;
  wheel_id: string;
  question_key: string;
  answer_text: string | null;
  created_at: string;
}

export interface IdealLife {
  id: string;
  wheel_id: string;
  domain_id: string;
  vision_text: string | null;
  prompts_answers: Record<string, string>;
  created_at: string;
}

export interface ActionPlan {
  id: string;
  wheel_id: string;
  domain_id: string;
  goal_text: string | null;
  target_score: number | null;
  actions: ActionItem[];
  created_at: string;
}

export interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
  frequency_type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONCE';
  goal_id: string | null;
  domain_id: string | null;
}

export interface Habit {
  id: string;
  action_plan_id: string;
  name: string;
  frequency: string | null;
  created_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  completed_at: string;
  notes: string | null;
}

export interface Partnership {
  id: string;
  user_a_id: string;
  user_b_id: string | null;
  status: 'pending' | 'active' | 'ended';
  invite_code: string | null;
  privacy_level: 'full' | 'scores_only' | 'priorities' | 'none';
  created_at: string;
}

export interface SharedWheel {
  id: string;
  partnership_id: string;
  wheel_id: string;
  shared_by: string;
}

export interface GuestSession {
  id: string;
  session_token: string;
  wheel_id: string | null;
  created_at: string;
  expires_at: string;
}

export interface LifeDomain {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  icon: string | null;
  order_position: number;
  created_at: string;
}

export interface WheelDomainSelection {
  id: string;
  wheel_id: string;
  domain_id: string;
  order_position: number;
}

export interface WheelWithDomains extends Wheel {
  domains: Domain[];
  scores: Score[];
  priorities: Priority[];
}

export interface DomainWithScore extends Domain {
  score: Score | null;
  priority: Priority | null;
}

export type WizardStep =
  | 'dominios'
  | 'puntajes'
  | 'resultado'
  | 'prioridades'
  | 'reflexion'
  | 'vida-ideal'
  | 'plan'
  | 'seguimiento';

export const WIZARD_STEPS: { key: WizardStep; label: string }[] = [
  { key: 'dominios', label: 'Dominios' },
  { key: 'puntajes', label: 'Puntajes' },
  { key: 'resultado', label: 'Resultado' },
  { key: 'prioridades', label: 'Prioridades' },
  { key: 'reflexion', label: 'Reflexión' },
  { key: 'vida-ideal', label: 'Vida Ideal' },
  { key: 'plan', label: 'Plan' },
  { key: 'seguimiento', label: 'Seguimiento' },
];

export const SUGGESTED_DOMAINS = [
  { name: 'Salud', icon: '💪' },
  { name: 'Trabajo', icon: '💼' },
  { name: 'Dinero', icon: '💰' },
  { name: 'Relaciones', icon: '❤️' },
  { name: 'Familia', icon: '👨‍👩‍👧‍👦' },
  { name: 'Ocio', icon: '🎮' },
  { name: 'Crecimiento Personal', icon: '🌱' },
  { name: 'Espiritualidad', icon: '🧘' },
  { name: 'Educación', icon: '📚' },
  { name: 'Entorno', icon: '🏠' },
];

export const REFLECTION_QUESTIONS = [
  { key: 'surprise', label: '¿Qué te sorprendió de tus resultados?' },
  { key: 'patterns', label: '¿Qué patrones observas?' },
  { key: 'lowest', label: '¿Por qué crees que tus áreas más bajas están así?' },
  { key: 'highest', label: '¿Qué estás haciendo bien en tus áreas más altas?' },
  { key: 'oneChange', label: 'Si pudieras cambiar una sola cosa, ¿cuál sería?' },
  { key: 'sixMonths', label: '¿Cómo te gustaría que se vea tu rueda en 6 meses?' },
];

export const IDEAL_LIFE_PROMPTS = [
  { key: 'feel', label: '¿Cómo me siento?' },
  { key: 'do', label: '¿Qué Hago? ¿Quiénes me acompañan?' },
  { key: 'who', label: '¿Que o quienes me ayudaron a llegar a este punto? ¿A quienes le agradezco?' },
];

export * from './odyssey';
export * from './lifeplan';
export * from './finances';
export * from './dashboard';
