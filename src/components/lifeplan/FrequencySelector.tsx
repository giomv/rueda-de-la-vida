'use client';

import { cn } from '@/lib/utils';
import { FREQUENCY_OPTIONS, type FrequencyType } from '@/lib/types/lifeplan';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DayPicker } from './DayPicker';

interface FrequencySelectorProps {
  frequencyType: FrequencyType;
  frequencyValue: number;
  scheduledDays: string[];
  onFrequencyTypeChange: (type: FrequencyType) => void;
  onFrequencyValueChange: (value: number) => void;
  onScheduledDaysChange: (days: string[]) => void;
  className?: string;
}

export function FrequencySelector({
  frequencyType,
  frequencyValue,
  scheduledDays,
  onFrequencyTypeChange,
  onFrequencyValueChange,
  onScheduledDaysChange,
  className,
}: FrequencySelectorProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Frequency type selection */}
      <div className="space-y-2">
        <Label>Frecuencia</Label>
        <div className="grid grid-cols-2 gap-2">
          {FREQUENCY_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onFrequencyTypeChange(option.key)}
              className={cn(
                'p-3 rounded-lg border text-left transition-colors',
                frequencyType === option.key
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div className="font-medium text-sm">{option.label}</div>
              <div className="text-xs text-muted-foreground">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Frequency value for weekly/monthly */}
      {(frequencyType === 'WEEKLY' || frequencyType === 'MONTHLY') && (
        <div className="space-y-2">
          <Label>
            {frequencyType === 'WEEKLY' ? 'Veces por semana' : 'Veces por mes'}
          </Label>
          <Input
            type="number"
            min={1}
            max={frequencyType === 'WEEKLY' ? 7 : 31}
            value={frequencyValue}
            onChange={(e) => onFrequencyValueChange(parseInt(e.target.value) || 1)}
            className="w-24"
          />
        </div>
      )}

      {/* Day picker for weekly */}
      {frequencyType === 'WEEKLY' && (
        <div className="space-y-2">
          <Label>Días de la semana (opcional)</Label>
          <DayPicker
            selectedDays={scheduledDays}
            onChange={onScheduledDaysChange}
          />
          <p className="text-xs text-muted-foreground">
            Selecciona los días específicos o déjalo vacío para cualquier día
          </p>
        </div>
      )}
    </div>
  );
}
