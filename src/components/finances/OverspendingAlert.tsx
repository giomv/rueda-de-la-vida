'use client';

import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface OverspendingAlertProps {
  className?: string;
}

export function OverspendingAlert({ className }: OverspendingAlertProps) {
  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Cerca del limite</AlertTitle>
      <AlertDescription>
        Estas cerca de tu limite planificado. ¿Quieres ajustar o reasignar?
      </AlertDescription>
    </Alert>
  );
}
