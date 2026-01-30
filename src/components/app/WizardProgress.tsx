'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { WIZARD_STEPS } from '@/lib/types';
import { useWizardStore } from '@/lib/stores/wizard-store';
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

interface WizardProgressProps {
  currentStep: number;
  completedSteps?: number[];
}

export function WizardProgress({ currentStep, completedSteps = [] }: WizardProgressProps) {
  const router = useRouter();
  const params = useParams();
  const wheelId = params.wheelId as string;
  const { isDirty, markClean } = useWizardStore();

  const [pendingStep, setPendingStep] = useState<number | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const navigateToStep = (stepIndex: number) => {
    const step = WIZARD_STEPS[stepIndex];
    if (step) {
      router.push(`/rueda/${wheelId}/${step.key}`);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Don't navigate if clicking current step
    if (stepIndex === currentStep) return;

    // Check for unsaved changes
    if (isDirty) {
      setPendingStep(stepIndex);
      setShowUnsavedDialog(true);
      return;
    }

    navigateToStep(stepIndex);
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
      aria-label="Progreso del asistente"
      role="navigation"
    >
      {/* Mobile: compact progress bar with step selector */}
      <div className="md:hidden px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Paso {currentStep + 1} de {WIZARD_STEPS.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {WIZARD_STEPS[currentStep]?.label}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / WIZARD_STEPS.length) * 100}%` }}
          />
        </div>
        {/* Mobile step buttons */}
        <div className="flex justify-between mt-3 gap-1">
          {WIZARD_STEPS.map((step, index) => {
            const isCompleted = completedSteps.includes(index) || index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <button
                key={step.key}
                onClick={() => handleStepClick(index)}
                disabled={isCurrent}
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium transition-all',
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
        aria-label="Pasos del asistente"
      >
        {WIZARD_STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(index) || index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <li key={step.key} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => handleStepClick(index)}
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
              {index < WIZARD_STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-8 h-0.5 mx-1 mt-[-16px]',
                    index < currentStep ? 'bg-primary' : 'bg-muted'
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
