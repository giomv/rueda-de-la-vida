'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { ODYSSEY_WIZARD_STEPS } from '@/lib/types';
import type { OdysseyStep } from '@/lib/types';

interface OdysseyProgressProps {
  currentStep: OdysseyStep;
}

export function OdysseyProgress({ currentStep }: OdysseyProgressProps) {
  const currentIndex = ODYSSEY_WIZARD_STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="w-full">
      {/* Mobile: compact progress bar */}
      <div className="md:hidden px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Paso {currentIndex + 1} de {ODYSSEY_WIZARD_STEPS.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {ODYSSEY_WIZARD_STEPS[currentIndex]?.label}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / ODYSSEY_WIZARD_STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop: horizontal stepper */}
      <div className="hidden md:flex items-center justify-center gap-1 py-4 px-4">
        {ODYSSEY_WIZARD_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step.key} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isCurrent && 'bg-primary text-primary-foreground ring-2 ring-primary/30',
                    !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span
                  className={cn(
                    'text-xs whitespace-nowrap',
                    isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < ODYSSEY_WIZARD_STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-8 h-0.5 mx-1 mt-[-16px]',
                    index < currentIndex ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
