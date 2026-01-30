'use client';

import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Plus, Wallet, PiggyBank } from 'lucide-react';
import type { DomainProgress } from '@/lib/types/dashboard';
import { STATUS_LABELS } from '@/lib/types/dashboard';
import { useDashboardStore } from '@/lib/stores/dashboard-store';

interface DomainDetailSheetProps {
  data: DomainProgress | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function DomainDetailSheet({ data, open, onOpenChange }: DomainDetailSheetProps) {
  const { year, month } = useDashboardStore();

  if (!data) return null;

  const { domain, completionRate, spent, saved, status, actionsCompleted, actionsTotal } = data;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {domain.icon && <span className="text-xl">{domain.icon}</span>}
            {domain.name}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Progress section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Progreso del mes</h4>
              <Badge variant={status === 'on-track' ? 'default' : status === 'at-risk' ? 'secondary' : 'destructive'}>
                {STATUS_LABELS[status]}
              </Badge>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Acciones completadas</span>
                <span className="font-medium">{actionsCompleted} / {actionsTotal}</span>
              </div>
              <Progress value={completionRate} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {completionRate}% completado
              </p>
            </div>
          </div>

          {/* Finance section */}
          <div className="space-y-3">
            <h4 className="font-medium">Finanzas del mes</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
                  <Wallet className="h-4 w-4" />
                  <span className="text-xs">Gastado</span>
                </div>
                <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                  {formatCurrency(spent)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                  <PiggyBank className="h-4 w-4" />
                  <span className="text-xs">Ahorrado</span>
                </div>
                <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {formatCurrency(saved)}
                </p>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="space-y-2">
            <h4 className="font-medium">Acciones rapidas</h4>
            <div className="flex flex-col gap-2">
              <Button variant="outline" className="justify-start" asChild>
                <Link href={`/mi-plan/actividad/nueva?domain=${domain.id}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva accion
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href={`/finanzas/gastos?domain=${domain.id}`}>
                  <Wallet className="h-4 w-4 mr-2" />
                  Registrar gasto
                </Link>
              </Button>
            </div>
          </div>

          {/* View more link */}
          <Button className="w-full" asChild>
            <Link href={`/mi-plan/hoy?domain=${domain.id}`}>
              Ver acciones del dominio
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
