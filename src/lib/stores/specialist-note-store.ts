'use client';

import { create } from 'zustand';
import type {
  RecommendationItem,
  SpecialistSessionNote,
} from '@/lib/types/specialist';

interface PrivateNoteItem {
  id: string;
  text: string;
}

interface SpecialistNoteFormState {
  session_type: string;
  session_date: string;
  duration_minutes: string;
  private_notes: PrivateNoteItem[];
  private_followup: string;
  shared_recommendations: RecommendationItem[];
  isDirty: boolean;

  setField: (field: string, value: string) => void;

  addRecommendation: () => void;
  removeRecommendation: (index: number) => void;
  updateRecommendation: (index: number, updates: Partial<RecommendationItem>) => void;

  addPrivateNote: () => void;
  removePrivateNote: (index: number) => void;
  updatePrivateNote: (index: number, text: string) => void;

  hydrate: (note: SpecialistSessionNote) => void;
  reset: () => void;
}

const today = new Date().toISOString().split('T')[0];

const initialState = {
  session_type: '',
  session_date: today,
  duration_minutes: '',
  private_notes: [] as PrivateNoteItem[],
  private_followup: '',
  shared_recommendations: [] as RecommendationItem[],
  isDirty: false,
};

export const useSpecialistNoteStore = create<SpecialistNoteFormState>((set) => ({
  ...initialState,

  setField: (field, value) =>
    set((state) => ({ ...state, [field]: value, isDirty: true })),

  addRecommendation: () =>
    set((state) => ({
      shared_recommendations: [
        ...state.shared_recommendations,
        { id: crypto.randomUUID(), text: '' },
      ],
      isDirty: true,
    })),

  removeRecommendation: (index) =>
    set((state) => ({
      shared_recommendations: state.shared_recommendations.filter((_, i) => i !== index),
      isDirty: true,
    })),

  updateRecommendation: (index, updates) =>
    set((state) => ({
      shared_recommendations: state.shared_recommendations.map((r, i) =>
        i === index ? { ...r, ...updates } : r
      ),
      isDirty: true,
    })),

  addPrivateNote: () =>
    set((state) => ({
      private_notes: [
        ...state.private_notes,
        { id: crypto.randomUUID(), text: '' },
      ],
      isDirty: true,
    })),

  removePrivateNote: (index) =>
    set((state) => ({
      private_notes: state.private_notes.filter((_, i) => i !== index),
      isDirty: true,
    })),

  updatePrivateNote: (index, text) =>
    set((state) => ({
      private_notes: state.private_notes.map((n, i) =>
        i === index ? { ...n, text } : n
      ),
      isDirty: true,
    })),

  hydrate: (note) =>
    set({
      session_type: note.session_type || '',
      session_date: note.session_date,
      duration_minutes: note.duration_minutes?.toString() || '',
      private_notes: note.private_notes || [],
      private_followup: note.private_followup || '',
      shared_recommendations: note.shared_recommendations || [],
      isDirty: false,
    }),

  reset: () => set({ ...initialState, session_date: new Date().toISOString().split('T')[0] }),
}));
