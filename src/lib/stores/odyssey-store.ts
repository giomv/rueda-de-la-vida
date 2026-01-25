'use client';

import { create } from 'zustand';
import type {
  OdysseyPlan,
  OdysseyMilestone,
  OdysseyFeedback,
  OdysseyPrototype,
  OdysseyPrototypeStep,
  OdysseyWeeklyCheck,
  OdysseyStep,
  MilestoneCategory,
  MilestoneTag,
  LifeDomain,
} from '@/lib/types';

interface OdysseyStoreState {
  odysseyId: string | null;
  title: string;
  mode: 'individual' | 'pareja';
  currentStep: OdysseyStep;
  plans: OdysseyPlan[];
  milestones: Record<string, OdysseyMilestone[]>; // keyed by plan_id
  feedback: Record<string, OdysseyFeedback[]>; // keyed by plan_id
  domains: LifeDomain[]; // user's life domains
  activePlanNumber: number | null;
  prototype: OdysseyPrototype | null;
  prototypeSteps: OdysseyPrototypeStep[];
  weeklyChecks: OdysseyWeeklyCheck[];
  isDirty: boolean;

  // Actions
  setOdysseyId: (id: string) => void;
  setTitle: (title: string) => void;
  setMode: (mode: 'individual' | 'pareja') => void;
  setCurrentStep: (step: OdysseyStep) => void;
  setPlans: (plans: OdysseyPlan[]) => void;
  updatePlanHeadline: (planId: string, headline: string) => void;
  updatePlanDashboard: (planId: string, updates: Partial<Pick<OdysseyPlan, 'energy_score' | 'confidence_score' | 'resources_score' | 'excitement_text' | 'concern_text' | 'year_names'>>) => void;
  setMilestones: (planId: string, milestones: OdysseyMilestone[]) => void;
  addMilestone: (planId: string, milestone: OdysseyMilestone) => void;
  updateMilestone: (milestoneId: string, updates: Partial<OdysseyMilestone>) => void;
  moveMilestone: (milestoneId: string, newYear: number) => void;
  removeMilestone: (planId: string, milestoneId: string) => void;
  setFeedback: (planId: string, feedback: OdysseyFeedback[]) => void;
  updateFeedback: (planId: string, index: number, updates: Partial<OdysseyFeedback>) => void;
  addFeedback: (planId: string) => void;
  removeFeedback: (planId: string, index: number) => void;
  setDomains: (domains: LifeDomain[]) => void;
  setActivePlanNumber: (num: number | null) => void;
  setPrototype: (prototype: OdysseyPrototype | null) => void;
  setPrototypeSteps: (steps: OdysseyPrototypeStep[]) => void;
  setWeeklyChecks: (checks: OdysseyWeeklyCheck[]) => void;
  updateWeeklyCheck: (weekNumber: number, updates: Partial<OdysseyWeeklyCheck>) => void;
  markClean: () => void;
  reset: () => void;
  hydrate: (data: Partial<OdysseyStoreState>) => void;
}

const initialState = {
  odysseyId: null,
  title: '',
  mode: 'individual' as const,
  currentStep: 'plan-1' as OdysseyStep,
  plans: [],
  milestones: {},
  feedback: {},
  domains: [],
  activePlanNumber: null,
  prototype: null,
  prototypeSteps: [],
  weeklyChecks: [],
  isDirty: false,
};

export const useOdysseyStore = create<OdysseyStoreState>((set) => ({
  ...initialState,

  setOdysseyId: (id) => set({ odysseyId: id }),
  setTitle: (title) => set({ title, isDirty: true }),
  setMode: (mode) => set({ mode, isDirty: true }),
  setCurrentStep: (step) => set({ currentStep: step }),

  setPlans: (plans) => set({ plans }),

  updatePlanHeadline: (planId, headline) =>
    set((state) => ({
      plans: state.plans.map((p) =>
        p.id === planId ? { ...p, headline } : p
      ),
      isDirty: true,
    })),

  updatePlanDashboard: (planId, updates) =>
    set((state) => ({
      plans: state.plans.map((p) =>
        p.id === planId ? { ...p, ...updates } : p
      ),
      isDirty: true,
    })),

  setMilestones: (planId, milestones) =>
    set((state) => ({
      milestones: { ...state.milestones, [planId]: milestones },
    })),

  addMilestone: (planId, milestone) =>
    set((state) => ({
      milestones: {
        ...state.milestones,
        [planId]: [...(state.milestones[planId] || []), milestone],
      },
      isDirty: true,
    })),

  updateMilestone: (milestoneId, updates) =>
    set((state) => {
      const newMilestones = { ...state.milestones };
      for (const planId of Object.keys(newMilestones)) {
        newMilestones[planId] = newMilestones[planId].map((m) =>
          m.id === milestoneId ? { ...m, ...updates } : m
        );
      }
      return { milestones: newMilestones, isDirty: true };
    }),

  moveMilestone: (milestoneId, newYear) =>
    set((state) => {
      const newMilestones = { ...state.milestones };
      for (const planId of Object.keys(newMilestones)) {
        newMilestones[planId] = newMilestones[planId].map((m) =>
          m.id === milestoneId ? { ...m, year: newYear } : m
        );
      }
      return { milestones: newMilestones, isDirty: true };
    }),

  removeMilestone: (planId, milestoneId) =>
    set((state) => ({
      milestones: {
        ...state.milestones,
        [planId]: (state.milestones[planId] || []).filter((m) => m.id !== milestoneId),
      },
      isDirty: true,
    })),

  setFeedback: (planId, feedback) =>
    set((state) => ({
      feedback: { ...state.feedback, [planId]: feedback },
    })),

  updateFeedback: (planId, index, updates) =>
    set((state) => {
      const planFeedback = [...(state.feedback[planId] || [])];
      if (planFeedback[index]) {
        planFeedback[index] = { ...planFeedback[index], ...updates };
      }
      return {
        feedback: { ...state.feedback, [planId]: planFeedback },
        isDirty: true,
      };
    }),

  addFeedback: (planId) =>
    set((state) => {
      const planFeedback = state.feedback[planId] || [];
      return {
        feedback: {
          ...state.feedback,
          [planId]: [
            ...planFeedback,
            {
              id: crypto.randomUUID(),
              plan_id: planId,
              person_name: '',
              feedback_text: '',
              order_position: planFeedback.length,
              created_at: new Date().toISOString(),
            },
          ],
        },
        isDirty: true,
      };
    }),

  removeFeedback: (planId, index) =>
    set((state) => {
      const planFeedback = [...(state.feedback[planId] || [])];
      planFeedback.splice(index, 1);
      return {
        feedback: { ...state.feedback, [planId]: planFeedback },
        isDirty: true,
      };
    }),

  setDomains: (domains) => set({ domains }),

  setActivePlanNumber: (num) => set({ activePlanNumber: num, isDirty: true }),

  setPrototype: (prototype) => set({ prototype }),
  setPrototypeSteps: (steps) => set({ prototypeSteps: steps }),
  setWeeklyChecks: (checks) => set({ weeklyChecks: checks }),

  updateWeeklyCheck: (weekNumber, updates) =>
    set((state) => {
      const existing = state.weeklyChecks.find((c) => c.week_number === weekNumber);
      if (existing) {
        return {
          weeklyChecks: state.weeklyChecks.map((c) =>
            c.week_number === weekNumber ? { ...c, ...updates } : c
          ),
          isDirty: true,
        };
      }
      return {
        weeklyChecks: [
          ...state.weeklyChecks,
          {
            id: crypto.randomUUID(),
            prototype_id: state.prototype?.id || '',
            week_number: weekNumber,
            conversation_done: false,
            experiment_done: false,
            skill_done: false,
            notes: null,
            completed_at: null,
            ...updates,
          },
        ],
        isDirty: true,
      };
    }),

  markClean: () => set({ isDirty: false }),
  reset: () => set(initialState),
  hydrate: (data) => set({ ...data, isDirty: false }),
}));
