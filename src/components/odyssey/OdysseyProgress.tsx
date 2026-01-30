'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { ODYSSEY_WIZARD_STEPS } from '@/lib/types';
import type { OdysseyStep } from '@/lib/types';
import { useOdysseyStore } from '@/lib/stores/odyssey-store';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface OdysseyProgressProps {
  currentStep: OdysseyStep;
}

export function OdysseyProgress({ currentStep }: OdysseyProgressProps) {
  const router = useRouter();
  const params = useParams();
  const odysseyId = params.odysseyId as string;
  const { isDirty, markClean } = useOdysseyStore();

  const currentIndex = ODYSSEY_WIZARD_STEPS.findIndex((s) => s.key === currentStep);

  const [pendingStep, setPendingStep] = useState<OdysseyStep | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const navigateToStep = (stepKey: OdysseyStep) => {
    router.push(`/plan-de-vida/${odysseyId}/${stepKey}`);
  };

  const handleStepClick = (stepKey: OdysseyStep, stepIndex: number) => {
    // Don't navigate if clicking current step
    if (stepIndex === currentIndex) return;

    // Check for unsaved changes
    if (isDirty) {
      setPendingStep(stepKey);
      setShowUnsavedDialog(true);
      return;
    }

    navigateToStep(stepKey);
  };

  const handleConfirmNavigation = () => {
    setShowUnsavedDialog(false);
    markClean();
    if (pendingStep !== null) {
      navigateToStep(pendingStep);
      setPendingStep(null);
    }
  };

  const handleCancelNavigation = () => {
    setShowUnsavedDialog(false);
    setPendingStep(null);
  };

  return (
    <nav
      className="w-full"
      aria-label="Progreso del Plan de Vida"
      role="navigation"
    >
      {/* Mobile: compact progress bar with step selector */}
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
        {/* Mobile step buttons */}
        <div className="flex justify-between mt-3 gap-1">
          {ODYSSEY_WIZARD_STEPS.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <button
                key={step.key}
                onClick={() => handleStepClick(step.key, index)}
                disabled={isCurrent}
                className={cn(
                  'w-10 h-8 rounded-full flex items-center justify-center text-[10px] font-medium transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  isCompleted && 'bg-primary text-primary-foreground hover:bg-primary/90',
                  isCurrent && 'bg-primary text-primary-foreground ring-2 ring-primary/30',
                  !isCompleted && !isCurrent && 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
                aria-label={`${step.label}${isCurrent ? ' (actual)' : ''}`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? <Check className="h-3 w-3" /> : index + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: horizontal stepper */}
      <ol
        className="hidden md:flex items-center justify-center gap-1 py-4 px-4"
        aria-label="Pasos del Plan de Vida"
      >
        {ODYSSEY_WIZARD_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <li key={step.key} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => handleStepClick(step.key, index)}
                  disabled={isCurrent}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    isCompleted && 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer',
                    isCurrent && 'bg-primary text-primary-foreground ring-2 ring-primary/30',
                    !isCompleted && !isCurrent && 'bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer'
                  )}
                  aria-label={`Ir a ${step.label}${isCurrent ? ' (paso actual)' : ''}`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                </button>
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
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Unsaved changes dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cambios sin guardar</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar en este paso. Si continúas, podrías perder tu progreso.
              Los cambios se guardan automáticamente cada pocos segundos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelNavigation}>
              Quedarme aquí
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmNavigation}>
              Continuar de todos modos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </nav>
  );
}
