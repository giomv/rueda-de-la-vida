'use client';

import { create } from 'zustand';
import type { Domain, Score, Priority, Reflection, IdealLife, ActionPlan } from '@/lib/types';

interface WizardState {
  wheelId: string | null;
  title: string;
  domains: Domain[];
  scores: Score[];
  priorities: Priority[];
  reflections: Reflection[];
  idealLife: IdealLife[];
  actionPlans: ActionPlan[];
  currentStep: number;
  isDirty: boolean;

  // Actions
  setWheelId: (id: string) => void;
  setTitle: (title: string) => void;
  setDomains: (domains: Domain[]) => void;
  addDomain: (domain: Domain) => void;
  removeDomain: (domainId: string) => void;
  updateDomain: (domainId: string, updates: Partial<Domain>) => void;
  reorderDomains: (domains: Domain[]) => void;
  setScores: (scores: Score[]) => void;
  updateScore: (domainId: string, score: number, notes?: string) => void;
  setPriorities: (priorities: Priority[]) => void;
  updatePriority: (domainId: string, rank: number, isFocus?: boolean) => void;
  setReflections: (reflections: Reflection[]) => void;
  updateReflection: (questionKey: string, answer: string) => void;
  setIdealLife: (idealLife: IdealLife[]) => void;
  updateIdealLife: (domainId: string, updates: Partial<IdealLife>) => void;
  setActionPlans: (plans: ActionPlan[]) => void;
  updateActionPlan: (domainId: string, updates: Partial<ActionPlan>) => void;
  setCurrentStep: (step: number) => void;
  markClean: () => void;
  reset: () => void;
  hydrate: (data: Partial<WizardState>) => void;
}

const initialState = {
  wheelId: null,
  title: '',
  domains: [],
  scores: [],
  priorities: [],
  reflections: [],
  idealLife: [],
  actionPlans: [],
  currentStep: 0,
  isDirty: false,
};

export const useWizardStore = create<WizardState>((set) => ({
  ...initialState,

  setWheelId: (id) => set({ wheelId: id }),
  setTitle: (title) => set({ title, isDirty: true }),

  setDomains: (domains) => set({ domains }),
  addDomain: (domain) =>
    set((state) => ({ domains: [...state.domains, domain], isDirty: true })),
  removeDomain: (domainId) =>
    set((state) => ({
      domains: state.domains.filter((d) => d.id !== domainId),
      scores: state.scores.filter((s) => s.domain_id !== domainId),
      priorities: state.priorities.filter((p) => p.domain_id !== domainId),
      isDirty: true,
    })),
  updateDomain: (domainId, updates) =>
    set((state) => ({
      domains: state.domains.map((d) =>
        d.id === domainId ? { ...d, ...updates } : d
      ),
      isDirty: true,
    })),
  reorderDomains: (domains) => set({ domains, isDirty: true }),

  setScores: (scores) => set({ scores }),
  updateScore: (domainId, score, notes) =>
    set((state) => {
      const existing = state.scores.find((s) => s.domain_id === domainId);
      if (existing) {
        return {
          scores: state.scores.map((s) =>
            s.domain_id === domainId
              ? { ...s, score, notes: notes ?? s.notes }
              : s
          ),
          isDirty: true,
        };
      }
      return {
        scores: [
          ...state.scores,
          {
            id: crypto.randomUUID(),
            wheel_id: state.wheelId!,
            domain_id: domainId,
            score,
            notes: notes ?? null,
            scored_at: new Date().toISOString(),
          },
        ],
        isDirty: true,
      };
    }),

  setPriorities: (priorities) => set({ priorities }),
  updatePriority: (domainId, rank, isFocus) =>
    set((state) => {
      const existing = state.priorities.find((p) => p.domain_id === domainId);
      if (existing) {
        return {
          priorities: state.priorities.map((p) =>
            p.domain_id === domainId
              ? { ...p, rank, is_focus: isFocus ?? p.is_focus }
              : p
          ),
          isDirty: true,
        };
      }
      return {
        priorities: [
          ...state.priorities,
          {
            id: crypto.randomUUID(),
            wheel_id: state.wheelId!,
            domain_id: domainId,
            rank,
            is_focus: isFocus ?? false,
          },
        ],
        isDirty: true,
      };
    }),

  setReflections: (reflections) => set({ reflections }),
  updateReflection: (questionKey, answer) =>
    set((state) => {
      const existing = state.reflections.find((r) => r.question_key === questionKey);
      if (existing) {
        return {
          reflections: state.reflections.map((r) =>
            r.question_key === questionKey ? { ...r, answer_text: answer } : r
          ),
          isDirty: true,
        };
      }
      return {
        reflections: [
          ...state.reflections,
          {
            id: crypto.randomUUID(),
            wheel_id: state.wheelId!,
            question_key: questionKey,
            answer_text: answer,
            created_at: new Date().toISOString(),
          },
        ],
        isDirty: true,
      };
    }),

  setIdealLife: (idealLife) => set({ idealLife }),
  updateIdealLife: (domainId, updates) =>
    set((state) => {
      const existing = state.idealLife.find((il) => il.domain_id === domainId);
      if (existing) {
        return {
          idealLife: state.idealLife.map((il) =>
            il.domain_id === domainId ? { ...il, ...updates } : il
          ),
          isDirty: true,
        };
      }
      return {
        idealLife: [
          ...state.idealLife,
          {
            id: crypto.randomUUID(),
            wheel_id: state.wheelId!,
            domain_id: domainId,
            vision_text: null,
            prompts_answers: {},
            created_at: new Date().toISOString(),
            ...updates,
          },
        ],
        isDirty: true,
      };
    }),

  setActionPlans: (plans) => set({ actionPlans: plans }),
  updateActionPlan: (domainId, updates) =>
    set((state) => {
      const existing = state.actionPlans.find((ap) => ap.domain_id === domainId);
      if (existing) {
        return {
          actionPlans: state.actionPlans.map((ap) =>
            ap.domain_id === domainId ? { ...ap, ...updates } : ap
          ),
          isDirty: true,
        };
      }
      return {
        actionPlans: [
          ...state.actionPlans,
          {
            id: crypto.randomUUID(),
            wheel_id: state.wheelId!,
            domain_id: domainId,
            goal_text: null,
            goals: [],
            target_score: null,
            actions: [],
            created_at: new Date().toISOString(),
            ...updates,
          },
        ],
        isDirty: true,
      };
    }),

  setCurrentStep: (step) => set({ currentStep: step }),
  markClean: () => set({ isDirty: false }),
  reset: () => set(initialState),
  hydrate: (data) => set({ ...data, isDirty: false }),
}));
