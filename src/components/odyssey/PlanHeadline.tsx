'use client';

import { Input } from '@/components/ui/input';

interface PlanHeadlineProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function PlanHeadline({ value, onChange, placeholder }: PlanHeadlineProps) {
  const maxLength = 120;

  return (
    <div className="space-y-1">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Resume este plan en una frase...'}
        maxLength={maxLength}
        className="text-base"
      />
      <p className="text-xs text-muted-foreground text-right">
        {value.length}/{maxLength}
      </p>
    </div>
  );
}
