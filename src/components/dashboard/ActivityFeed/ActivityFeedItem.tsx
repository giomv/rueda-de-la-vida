'use client';

import { CheckCircle2, Wallet, PiggyBank } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/format-currency';
import type { ActivityFeedItem as ActivityFeedItemType } from '@/lib/types/dashboard';

interface ActivityFeedItemProps {
  item: ActivityFeedItemType;
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return diffMins <= 1 ? 'hace un momento' : `hace ${diffMins} min`;
  }
  if (diffHours < 24) {
    return `hace ${diffHours}h`;
  }
  if (diffDays < 7) {
    return `hace ${diffDays}d`;
  }
  return date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
}

function getIcon(type: ActivityFeedItemType['type']) {
  switch (type) {
    case 'action_completed':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'expense_added':
      return <Wallet className="h-4 w-4 text-red-500" />;
    case 'savings_added':
      return <PiggyBank className="h-4 w-4 text-blue-500" />;
  }
}

export function ActivityFeedItem({ item }: ActivityFeedItemProps) {
  const icon = getIcon(item.type);
  const hasAmount = item.amount !== undefined;

  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatTime(item.timestamp)}</span>
          {hasAmount && (
            <>
              <span className="text-muted-foreground/50">-</span>
              <span className={cn(
                'font-medium',
                item.type === 'expense_added' ? 'text-red-500' : 'text-blue-500'
              )}>
                {formatCurrency(item.amount!)}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
