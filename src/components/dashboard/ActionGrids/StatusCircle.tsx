'use client';

import { cn } from '@/lib/utils';

interface StatusCircleProps {
  completed: boolean;
  date?: string | null;
  className?: string;
}

export function StatusCircle({ completed, date, className }: StatusCircleProps) {
  const label = completed
    ? date
      ? `Completado el ${date}`
      : 'Completado'
    : 'Incompleto';

  return (
    <span
      className={cn(
        'w-3 h-3 rounded-full inline-block flex-shrink-0',
        completed ? 'bg-green-500' : 'bg-red-500',
        className
      )}
      role="img"
      aria-label={label}
      title={label}
    />
  );
}
