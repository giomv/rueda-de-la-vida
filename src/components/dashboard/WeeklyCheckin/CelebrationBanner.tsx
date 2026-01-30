'use client';

import { useDashboardStore } from '@/lib/stores/dashboard-store';
import { cn } from '@/lib/utils';
import { Flame, Star, TrendingUp } from 'lucide-react';

interface CelebrationBannerProps {
  className?: string;
}

export function CelebrationBanner({ className }: CelebrationBannerProps) {
  const { celebration } = useDashboardStore();

  if (!celebration) return null;

  const getIcon = () => {
    switch (celebration.type) {
      case 'streak':
        return <Flame className="h-5 w-5 text-orange-500" />;
      case 'best_week':
        return <Star className="h-5 w-5 text-yellow-500" />;
      case 'goal_progress':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
    }
  };

  const getBgColor = () => {
    switch (celebration.type) {
      case 'streak':
        return 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800';
      case 'best_week':
        return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800';
      case 'goal_progress':
        return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800';
    }
  };

  return (
    <div className={cn(
      'rounded-lg border p-3 flex items-center gap-3',
      getBgColor(),
      className
    )}>
      {getIcon()}
      <span className="text-sm font-medium">{celebration.message}</span>
    </div>
  );
}
