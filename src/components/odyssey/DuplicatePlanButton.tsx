'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Copy } from 'lucide-react';
import { PLAN_TYPES } from '@/lib/types';

interface DuplicatePlanButtonProps {
  currentPlanNumber: number;
  onDuplicate: (sourcePlan: number) => void;
}

export function DuplicatePlanButton({ currentPlanNumber, onDuplicate }: DuplicatePlanButtonProps) {
  const [open, setOpen] = useState(false);
  const availableSources = PLAN_TYPES.filter((p) => p.number !== currentPlanNumber);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Copy className="h-4 w-4" />
        Copiar de otro plan
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copiar desde otro plan</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            Se copiarán los hitos y el headline del plan seleccionado.
          </p>
          <div className="space-y-2">
            {availableSources.map((plan) => (
              <button
                key={plan.number}
                type="button"
                onClick={() => {
                  onDuplicate(plan.number);
                  setOpen(false);
                }}
                className="w-full text-left p-3 rounded-lg border hover:bg-accent hover:border-primary/50 transition-colors"
              >
                <p className="text-sm font-medium">Plan {plan.number}: {plan.title}</p>
                <p className="text-xs text-muted-foreground">{plan.subtitle}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
