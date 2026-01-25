'use client';

import { MILESTONE_TAGS } from '@/lib/types';
import type { MilestoneTag } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MilestoneTagSelectorProps {
  value: MilestoneTag | null;
  onChange: (tag: MilestoneTag) => void;
}

const TAG_STYLES: Record<MilestoneTag, string> = {
  normal: 'border-border hover:border-primary/50',
  wild: 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20',
  experiment: 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20',
};

const TAG_ACTIVE_STYLES: Record<MilestoneTag, string> = {
  normal: 'border-primary bg-primary/5',
  wild: 'border-red-500 bg-red-100 dark:border-red-500 dark:bg-red-900/40',
  experiment: 'border-amber-500 bg-amber-100 dark:border-amber-500 dark:bg-amber-900/40',
};

export function MilestoneTagSelector({ value, onChange }: MilestoneTagSelectorProps) {
  return (
    <div className="flex gap-2">
      {MILESTONE_TAGS.map((tag) => (
        <button
          key={tag.key}
          type="button"
          onClick={() => onChange(tag.key)}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
            value === tag.key ? TAG_ACTIVE_STYLES[tag.key] : TAG_STYLES[tag.key]
          )}
        >
          {tag.label}
        </button>
      ))}
    </div>
  );
}
