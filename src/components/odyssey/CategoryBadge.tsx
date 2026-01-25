'use client';

import { Badge } from '@/components/ui/badge';
import { MILESTONE_CATEGORIES } from '@/lib/types';
import type { MilestoneCategory } from '@/lib/types';

const CATEGORY_COLORS: Record<MilestoneCategory, string> = {
  personal: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  career: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  health: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  finance: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  couple: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

interface CategoryBadgeProps {
  category: MilestoneCategory;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const cat = MILESTONE_CATEGORIES.find((c) => c.key === category);
  if (!cat) return null;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[category]}`}>
      <span>{cat.icon}</span>
      <span>{cat.label}</span>
    </span>
  );
}
