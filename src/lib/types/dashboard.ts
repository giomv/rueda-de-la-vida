// Dashboard (Zona Privada) types

import type { LifeDomain } from './index';
import type { Goal } from './lifeplan';

// ===== FILTER TYPES =====

export interface DashboardFilters {
  year: number;
  month: number;
  domainId?: string | null;
  goalId?: string | null;
}

// ===== SUMMARY TYPES =====

export interface ActionsSummary {
  scheduled: number;
  completed: number;
  completionRate: number;
  weeklyConsistency: number;
}

export interface FinanceSummary {
  baseIncome: number;
  realSpent: number;
  realSaved: number;
  remaining: number;
}

export interface DashboardSummary {
  actions: ActionsSummary;
  finance: FinanceSummary;
  focus: FocusItem[];
}

// ===== PROGRESS TYPES =====

export type ProgressStatus = 'on-track' | 'at-risk' | 'behind';

export interface DomainProgress {
  domain: LifeDomain;
  completionRate: number;
  spent: number;
  saved: number;
  status: ProgressStatus;
  actionsCompleted: number;
  actionsTotal: number;
}

export interface GoalProgress {
  goal: Goal;
  domain?: LifeDomain | null;
  completionRate: number;
  spent: number;
  saved: number;
  actionsCompleted: number;
  actionsTotal: number;
}

// ===== FOCUS TYPES =====

export interface FocusItem {
  id: string;
  type: 'domain' | 'goal';
  domain?: LifeDomain | null;
  goal?: Goal | null;
  topActions: FocusAction[];
  spent: number;
  saved: number;
}

export interface FocusAction {
  id: string;
  title: string;
  completed: boolean;
}

export interface DashboardFocus {
  id: string;
  user_id: string;
  year: number;
  month: number;
  focus_type: 'domain' | 'goal';
  domain_id: string | null;
  goal_id: string | null;
  order_position: number;
  created_at: string;
}

// ===== PENDING ITEMS TYPES =====

export type PendingItemType =
  | 'unclassified_expense'
  | 'savings_no_goal'
  | 'goal_without_actions'
  | 'activity_no_domain';

export interface PendingItem {
  type: PendingItemType;
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}

// ===== ACTIVITY FEED TYPES =====

export type ActivityFeedType = 'action_completed' | 'expense_added' | 'savings_added';

export interface ActivityFeedItem {
  id: string;
  type: ActivityFeedType;
  title: string;
  subtitle?: string;
  amount?: number;
  timestamp: string;
}

// ===== SAVINGS MOVEMENT TYPES =====

export type MovementType = 'deposit' | 'withdrawal';

export interface SavingsMovement {
  id: string;
  user_id: string;
  amount: number;
  date: string;
  budget_account_id: string | null;
  domain_id: string | null;
  goal_id: string | null;
  note: string | null;
  movement_type: MovementType;
  created_at: string;
  updated_at: string;
}

export interface SavingsMovementWithRelations extends SavingsMovement {
  budget_account?: { id: string; name: string } | null;
  domain?: { id: string; name: string; icon: string | null } | null;
  goal?: { id: string; title: string } | null;
}

export interface CreateSavingsInput {
  amount: number;
  date: string;
  budget_account_id?: string | null;
  domain_id?: string | null;
  goal_id?: string | null;
  note?: string | null;
  movement_type: MovementType;
}

export interface UpdateSavingsInput {
  amount?: number;
  date?: string;
  budget_account_id?: string | null;
  domain_id?: string | null;
  goal_id?: string | null;
  note?: string | null;
  movement_type?: MovementType;
}

// ===== CELEBRATION TYPES =====

export type CelebrationType = 'streak' | 'best_week' | 'goal_progress';

export interface Celebration {
  type: CelebrationType;
  value: number;
  message: string;
  goalTitle?: string;
}

// ===== CHECK-IN TYPES =====

export interface DashboardCheckinInput {
  whatWorked: string;
  whatToAdjust: string;
  satisfactionScore?: number;
  moodEmoji?: string;
}

// ===== CONSTANTS =====

export const STATUS_LABELS: Record<ProgressStatus, string> = {
  'on-track': 'En ritmo',
  'at-risk': 'En riesgo',
  'behind': 'Atrasado',
};

export const STATUS_COLORS: Record<ProgressStatus, string> = {
  'on-track': 'green',
  'at-risk': 'yellow',
  'behind': 'red',
};

export const PENDING_TYPE_LABELS: Record<PendingItemType, string> = {
  'unclassified_expense': 'Gastos sin clasificar',
  'savings_no_goal': 'Ahorros sin meta',
  'goal_without_actions': 'Meta sin acciones',
  'activity_no_domain': 'Acciones sin dominio',
};

export const MOOD_EMOJIS = ['😊', '😐', '😔', '😤', '🤔', '😴', '🔥', '💪'];

export const SATISFACTION_SCALE = [
  { value: 1, label: 'Muy mal' },
  { value: 2, label: 'Mal' },
  { value: 3, label: 'Regular' },
  { value: 4, label: 'Bien' },
  { value: 5, label: 'Excelente' },
];
