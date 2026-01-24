'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useWizardStore } from '@/lib/stores/wizard-store';

export function useAutoSave(
  saveFn: () => Promise<void>,
  delay: number = 2000
) {
  const isDirty = useWizardStore((s) => s.isDirty);
  const markClean = useWizardStore((s) => s.markClean);
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
