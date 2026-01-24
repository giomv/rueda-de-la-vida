'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Domain, Score, Priority, Reflection } from '@/lib/types';

interface GuestState {
  guestToken: string | null;
  wheelId: string | null;
  title: string;
  domains: Domain[];
  scores: Score[];
  priorities: Priority[];
  reflections: Reflection[];

  setGuestToken: (token: string) => void;
  setWheelId: (id: string) => void;
  setTitle: (title: string) => void;
  setDomains: (domains: Domain[]) => void;
  setScores: (scores: Score[]) => void;
  setPriorities: (priorities: Priority[]) => void;
  setReflections: (reflections: Reflection[]) => void;
  clear: () => void;
}

export const useGuestStore = create<GuestState>()(
  persist(
    (set) => ({
      guestToken: null,
      wheelId: null,
      title: '',
      domains: [],
      scores: [],
      priorities: [],
      reflections: [],

      setGuestToken: (token) => set({ guestToken: token }),
      setWheelId: (id) => set({ wheelId: id }),
      setTitle: (title) => set({ title }),
      setDomains: (domains) => set({ domains }),
      setScores: (scores) => set({ scores }),
      setPriorities: (priorities) => set({ priorities }),
      setReflections: (reflections) => set({ reflections }),
      clear: () =>
        set({
          guestToken: null,
          wheelId: null,
          title: '',
          domains: [],
          scores: [],
          priorities: [],
          reflections: [],
        }),
    }),
    {
      name: 'via-guest-session',
    }
  )
);
