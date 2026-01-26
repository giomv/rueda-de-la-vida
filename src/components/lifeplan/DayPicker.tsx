'use client';

import { cn } from '@/lib/utils';
import { DAYS_OF_WEEK } from '@/lib/types/lifeplan';

interface DayPickerProps {
  selectedDays: string[];
  onChange: (days: string[]) => void;
  className?: string;
}

export function DayPicker({ selectedDays, onChange, className }: DayPickerProps) {
  const toggleDay = (dayKey: string) => {
    if (selectedDays.includes(dayKey)) {
      onChange(selectedDays.filter((d) => d !== dayKey));
    } else {
      onChange([...selectedDays, dayKey]);
    }
  };

  return (
    <div className={cn('flex gap-1', className)}>
      {DAYS_OF_WEEK.map((day) => {
        const isSelected = selectedDays.includes(day.key);
        return (
          <button
            key={day.key}
            type="button"
            onClick={() => toggleDay(day.key)}
            title={day.label}
            className={cn(
              'w-9 h-9 rounded-full text-sm font-medium transition-colors',
              isSelected
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {day.short}
          </button>
        );
      })}
    </div>
  );
}
