'use client';

import { useCallback } from 'react';

/**
 * Smooth-scroll to an element by its ID.
 * Offsets for the sticky header (64 px) by default.
 */
export function useScrollTo(offset = 80) {
  return useCallback(
    (id: string) => {
      const el = document.getElementById(id);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    },
    [offset],
  );
}
