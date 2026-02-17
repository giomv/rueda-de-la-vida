'use client';

import { create } from 'zustand';
import type {
  SessionVisibility,
  CreateInsightInput,
  CreateActionInput,
  CreateAttachmentInput,
  SessionWithRelations,
} from '@/lib/types/journal';

interface JournalFormState {
  // Session fields
  type: string;
  date: string;
  title: string;
  providerName: string;
  notes: string;
  durationMinutes: string;
  domainId: string | null;
  goalId: string | null;
  visibility: SessionVisibility;
  sharedSpaceId: string | null;

  // Children
  insights: CreateInsightInput[];
  actions: CreateActionInput[];
  attachments: CreateAttachmentInput[];

  // UI state
  isDirty: boolean;

  // Session actions
  setType: (type: string) => void;
  setDate: (date: string) => void;
  setTitle: (title: string) => void;
  setProviderName: (name: string) => void;
  setNotes: (notes: string) => void;
  setDurationMinutes: (duration: string) => void;
  setDomainId: (id: string | null) => void;
  setGoalId: (id: string | null) => void;
  setVisibility: (visibility: SessionVisibility) => void;
  setSharedSpaceId: (id: string | null) => void;

  // Insights
  addInsight: () => void;
  removeInsight: (index: number) => void;
  updateInsight: (index: number, updates: Partial<CreateInsightInput>) => void;
  togglePrimary: (index: number) => void;
  toggleInsightShared: (index: number) => void;
  moveInsight: (from: number, to: number) => void;

  // Actions
  addAction: () => void;
  removeAction: (index: number) => void;
  updateAction: (index: number, updates: Partial<CreateActionInput>) => void;
  toggleActionShared: (index: number) => void;
  moveAction: (from: number, to: number) => void;

  // Attachments
  addAttachment: () => void;
  removeAttachment: (index: number) => void;
  updateAttachment: (index: number, updates: Partial<CreateAttachmentInput>) => void;
  toggleAttachmentShared: (index: number) => void;

  // Utilities
  hydrate: (session: SessionWithRelations) => void;
  reset: () => void;
  markClean: () => void;
}

const today = new Date().toISOString().split('T')[0];

const initialState = {
  type: 'PSICOLOGIA',
  date: today,
  title: '',
  providerName: '',
  notes: '',
  durationMinutes: '',
  domainId: null as string | null,
  goalId: null as string | null,
  visibility: 'DEFAULT' as SessionVisibility,
  sharedSpaceId: null as string | null,
  insights: [] as CreateInsightInput[],
  actions: [] as CreateActionInput[],
  attachments: [] as CreateAttachmentInput[],
  isDirty: false,
};

export const useJournalStore = create<JournalFormState>((set) => ({
  ...initialState,

  // Field setters
  setType: (type) => set({ type, isDirty: true }),
  setDate: (date) => set({ date, isDirty: true }),
  setTitle: (title) => set({ title, isDirty: true }),
  setProviderName: (providerName) => set({ providerName, isDirty: true }),
  setNotes: (notes) => set({ notes, isDirty: true }),
  setDurationMinutes: (durationMinutes) => set({ durationMinutes, isDirty: true }),
  setDomainId: (domainId) => set({ domainId, isDirty: true }),
  setGoalId: (goalId) => set({ goalId, isDirty: true }),
  setVisibility: (visibility) => set({ visibility, isDirty: true }),
  setSharedSpaceId: (sharedSpaceId) => set({ sharedSpaceId, isDirty: true }),

  // Insights
  addInsight: () =>
    set((state) => {
      if (state.insights.length >= 5) return state;
      return {
        insights: [
          ...state.insights,
          { text: '', order_index: state.insights.length, is_shared: true },
        ],
        isDirty: true,
      };
    }),

  removeInsight: (index) =>
    set((state) => ({
      insights: state.insights
        .filter((_, i) => i !== index)
        .map((ins, i) => ({ ...ins, order_index: i })),
      isDirty: true,
    })),

  updateInsight: (index, updates) =>
    set((state) => ({
      insights: state.insights.map((ins, i) =>
        i === index ? { ...ins, ...updates } : ins
      ),
      isDirty: true,
    })),

  togglePrimary: (index) =>
    set((state) => ({
      insights: state.insights.map((ins, i) => ({
        ...ins,
        is_primary: i === index ? !ins.is_primary : false,
      })),
      isDirty: true,
    })),

  toggleInsightShared: (index) =>
    set((state) => ({
      insights: state.insights.map((ins, i) =>
        i === index ? { ...ins, is_shared: !(ins.is_shared ?? true) } : ins
      ),
      isDirty: true,
    })),

  moveInsight: (from, to) =>
    set((state) => {
      const arr = [...state.insights];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return {
        insights: arr.map((ins, i) => ({ ...ins, order_index: i })),
        isDirty: true,
      };
    }),

  // Actions
  addAction: () =>
    set((state) => ({
      actions: [
        ...state.actions,
        { text: '', order_index: state.actions.length, is_shared: true },
      ],
      isDirty: true,
    })),

  removeAction: (index) =>
    set((state) => ({
      actions: state.actions
        .filter((_, i) => i !== index)
        .map((act, i) => ({ ...act, order_index: i })),
      isDirty: true,
    })),

  updateAction: (index, updates) =>
    set((state) => ({
      actions: state.actions.map((act, i) =>
        i === index ? { ...act, ...updates } : act
      ),
      isDirty: true,
    })),

  toggleActionShared: (index) =>
    set((state) => ({
      actions: state.actions.map((act, i) =>
        i === index ? { ...act, is_shared: !(act.is_shared ?? true) } : act
      ),
      isDirty: true,
    })),

  moveAction: (from, to) =>
    set((state) => {
      const arr = [...state.actions];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return {
        actions: arr.map((act, i) => ({ ...act, order_index: i })),
        isDirty: true,
      };
    }),

  // Attachments
  addAttachment: () =>
    set((state) => ({
      attachments: [...state.attachments, { type: 'LINK' as const, url: '', label: '', is_shared: true }],
      isDirty: true,
    })),

  removeAttachment: (index) =>
    set((state) => ({
      attachments: state.attachments.filter((_, i) => i !== index),
      isDirty: true,
    })),

  updateAttachment: (index, updates) =>
    set((state) => ({
      attachments: state.attachments.map((att, i) =>
        i === index ? { ...att, ...updates } : att
      ),
      isDirty: true,
    })),

  toggleAttachmentShared: (index) =>
    set((state) => ({
      attachments: state.attachments.map((att, i) =>
        i === index ? { ...att, is_shared: !(att.is_shared ?? true) } : att
      ),
      isDirty: true,
    })),

  // Utilities
  hydrate: (session) =>
    set({
      type: session.type,
      date: session.date,
      title: session.title || '',
      providerName: session.provider_name || '',
      notes: session.notes || '',
      durationMinutes: session.duration_minutes?.toString() || '',
      domainId: session.domain_id,
      goalId: session.goal_id,
      visibility: session.visibility,
      sharedSpaceId: session.shared_space_id || null,
      insights: session.insights.map((ins) => ({
        text: ins.text,
        note: ins.note || undefined,
        is_primary: ins.is_primary,
        is_shared: ins.is_shared ?? true,
        domain_id: ins.domain_id,
        goal_id: ins.goal_id,
        order_index: ins.order_index,
      })),
      actions: session.actions.map((act) => ({
        text: act.text,
        frequency_type: act.frequency_type,
        frequency_value: act.frequency_value,
        target_date: act.target_date,
        is_shared: act.is_shared ?? true,
        domain_id: act.domain_id,
        goal_id: act.goal_id,
        order_index: act.order_index,
      })),
      attachments: session.attachments.map((att) => ({
        type: att.type,
        url: att.url || undefined,
        label: att.label || undefined,
        is_shared: att.is_shared ?? true,
      })),
      isDirty: false,
    }),

  reset: () => set({ ...initialState, date: new Date().toISOString().split('T')[0] }),

  markClean: () => set({ isDirty: false }),
}));
