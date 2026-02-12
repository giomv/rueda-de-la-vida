// LifePlan (Mi Plan) types

export type SourceType = 'WHEEL' | 'ODYSSEY' | 'MANUAL';
export type FrequencyType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONCE';
export type ViewMode = 'day' | 'week' | 'month' | 'once';
export type FilterType = 'all' | 'domain' | 'goal' | 'uncategorized';

export interface Goal {
  id: string;
  user_id: string;
  domain_id: string | null;
  title: string;
  metric: string | null;
  target_date: string | null;
  origin: SourceType;
  source_wheel_id: string | null;
  source_odyssey_id: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface LifePlanActivity {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  domain_id: string | null;
  goal_id: string | null;
  source_type: SourceType;
  source_id: string | null;
  frequency_type: FrequencyType;
  frequency_value: number;
  scheduled_days: string[] | null;
  time_of_day: string | null;
  order_position: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivityCompletion {
  id: string;
  activity_id: string;
  date: string;
  period_key: string;
  completed: boolean;
  completed_at: string | null;
  notes: string | null;
}

export interface WeeklyCheckin {
  id: string;
  user_id: string;
  week_start: string;
  what_worked: string | null;
  what_to_adjust: string | null;
  created_at: string;
}

// Composite types
export interface ActivityWithCompletions extends LifePlanActivity {
  completions: ActivityCompletion[];
}

export interface GoalWithActivities extends Goal {
  activities: LifePlanActivity[];
}

export interface DayActivities {
  date: string;
  activities: ActivityWithCompletions[];
  completedCount: number;
  totalCount: number;
}

// Import results
export interface ImportResult {
  fromWheel: number;
  fromOdyssey: number;
}

// Import source types
export interface ImportSourceWheel {
  id: string;
  title: string;
  created_at: string;
}

export interface ImportSourceOdyssey {
  id: string;
  title: string;
  active_plan_number: number | null;
  active_plan_headline: string | null;
  has_prototype: boolean;
}

export interface ImportSources {
  wheels: ImportSourceWheel[];
  odysseys: ImportSourceOdyssey[];
}

// Form input types
export interface CreateActivityInput {
  title: string;
  notes?: string;
  domain_id?: string | null;
  goal_id?: string | null;
  frequency_type: FrequencyType;
  frequency_value?: number;
  scheduled_days?: string[];
  time_of_day?: string | null;
}

export interface UpdateActivityInput extends Partial<CreateActivityInput> {
  is_archived?: boolean;
}

export interface CreateGoalInput {
  title: string;
  domain_id?: string | null;
  metric?: string;
  target_date?: string | null;
}

export interface UpdateGoalInput extends Partial<CreateGoalInput> {
  is_archived?: boolean;
}

// Constants
export const FREQUENCY_OPTIONS: { key: FrequencyType; label: string; description: string }[] = [
  { key: 'DAILY', label: 'Diario', description: 'Todos los días' },
  { key: 'WEEKLY', label: 'Semanal', description: 'Una o más veces por semana' },
  { key: 'MONTHLY', label: 'Mensual', description: 'Una o más veces por mes' },
  { key: 'ONCE', label: 'Una vez', description: 'Tarea única' },
];

export const DAYS_OF_WEEK: { key: string; label: string; short: string }[] = [
  { key: 'L', label: 'Lunes', short: 'L' },
  { key: 'M', label: 'Martes', short: 'M' },
  { key: 'X', label: 'Miércoles', short: 'X' },
  { key: 'J', label: 'Jueves', short: 'J' },
  { key: 'V', label: 'Viernes', short: 'V' },
  { key: 'S', label: 'Sábado', short: 'S' },
  { key: 'D', label: 'Domingo', short: 'D' },
];

export const VIEW_TABS: { key: ViewMode; label: string; href: string }[] = [
  { key: 'day', label: 'Hoy', href: '/mi-plan/hoy' },
  { key: 'week', label: 'Semana', href: '/mi-plan/semana' },
  { key: 'month', label: 'Mes', href: '/mi-plan/mes' },
  { key: 'once', label: '1 vez', href: '/mi-plan/una-vez' },
];

export const ORIGIN_BADGES: { key: SourceType; label: string; color: string }[] = [
  { key: 'WHEEL', label: 'Rueda', color: 'blue' },
  { key: 'ODYSSEY', label: 'Plan de vida', color: 'purple' },
  { key: 'MANUAL', label: 'Manual', color: 'gray' },
];
