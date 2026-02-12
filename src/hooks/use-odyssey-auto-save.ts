'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useOdysseyStore } from '@/lib/stores/odyssey-store';

export function useOdysseyAutoSave(
  saveFn: () => Promise<void>,
  delay: number = 1000
) {
  const isDirty = useOdysseyStore((s) => s.isDirty);
  const markClean = useOdysseyStore((s) => s.markClean);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const save = useCallback(async () => {
    setIsSaving(true);
    try {
      await saveFn();
      markClean();
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [saveFn, markClean]);

  useEffect(() => {
    if (!isDirty) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      save();
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isDirty, save, delay]);

  return { isSaving, lastSaved };
}
