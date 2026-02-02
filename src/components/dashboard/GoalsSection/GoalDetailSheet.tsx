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
import { Plus, Wallet, PiggyBank, Calendar } from 'lucide-react';
import type { GoalProgress } from '@/lib/types/dashboard';
import { formatCurrency } from '@/lib/utils/format-currency';
import { useDashboardStore } from '@/lib/stores/dashboard-store';

interface GoalDetailSheetProps {
  data: GoalProgress | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function GoalDetailSheet({ data, open, onOpenChange }: GoalDetailSheetProps) {
  const { year, month } = useDashboardStore();

  if (!data) return null;

  const { goal, domain, completionRate, spent, saved, actionsCompleted, actionsTotal } = data;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{goal.title}</SheetTitle>
          {domain && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              {domain.icon && <span>{domain.icon}</span>}
              {domain.name}
            </p>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Goal info */}
          <div className="flex flex-wrap gap-2">
            {goal.metric && (
              <Badge variant="outline">
                {goal.metric}
              </Badge>
            )}
            {goal.target_date && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(goal.target_date)}
              </Badge>
            )}
          </div>

          {/* Progress section */}
          <div className="space-y-3">
            <h4 className="font-medium">Progreso del mes</h4>
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
                <Link href={`/mi-plan/actividad/nueva?goal=${goal.id}${domain ? `&domain=${domain.id}` : ''}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva accion
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href={`/finanzas/gastos?goal=${goal.id}${domain ? `&domain=${domain.id}` : ''}`}>
                  <Wallet className="h-4 w-4 mr-2" />
                  Registrar gasto
                </Link>
              </Button>
            </div>
          </div>

          {/* View more link */}
          <Button className="w-full" asChild>
            <Link href={`/mi-plan/hoy?goal=${goal.id}`}>
              Ver acciones de la meta
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
