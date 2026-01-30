'use client';

import { PendingCard } from './PendingCard';
import { CheckCircle2 } from 'lucide-react';
import type { PendingItem } from '@/lib/types/dashboard';

interface PendingListProps {
  items: PendingItem[];
}

export function PendingList({ items }: PendingListProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-5 w-5" />
        <span className="font-medium">Todo en orden</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <PendingCard key={item.id} item={item} />
      ))}
    </div>
  );
}
