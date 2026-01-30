'use client';

import { cn } from '@/lib/utils';

interface ProgressRingProps {
  completed: number;
  total: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const SIZES = {
  sm: { ring: 40, stroke: 4, text: 'text-xs' },
  md: { ring: 56, stroke: 5, text: 'text-sm' },
  lg: { ring: 80, stroke: 6, text: 'text-base' },
};

export function ProgressRing({
  completed,
  total,
  size = 'md',
  showLabel = true,
  className,
}: ProgressRingProps) {
  const config = SIZES[size];
  const radius = (config.ring - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? completed / total : 0;
  const strokeDashoffset = circumference * (1 - progress);

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={config.ring}
        height={config.ring}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={config.ring / 2}
          cy={config.ring / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.stroke}
          className="text-muted"
        />
        {/* Progress circle */}
        <circle
          cx={config.ring / 2}
          cy={config.ring / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn(
            'transition-all duration-300',
            progress === 1 ? 'text-green-500' : 'text-primary'
          )}
        />
      </svg>
      {showLabel && (
        <span className={cn('absolute font-medium', config.text)}>
          {completed}/{total}
        </span>
      )}
    </div>
  );
}

// Simple progress bar variant
export function ProgressBar({
  completed,
  total,
  className,
  showPendingCompleted = false,
}: {
  completed: number;
  total: number;
  className?: string;
  showPendingCompleted?: boolean;
}) {
  const pending = total - completed;
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between text-sm text-muted-foreground mb-1">
        {showPendingCompleted ? (
          <>
            <span>Pendientes: {pending}</span>
            <span>Completadas: {completed}</span>
          </>
        ) : (
          <>
            <span>{completed} de {total}</span>
            <span>{Math.round(percentage)}%</span>
          </>
        )}
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-300 rounded-full',
            percentage === 100 && total > 0 ? 'bg-green-500' : 'bg-primary'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
