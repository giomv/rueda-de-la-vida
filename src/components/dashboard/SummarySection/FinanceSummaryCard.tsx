'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FinanceSummary } from '@/lib/types/dashboard';
import { useDashboardStore } from '@/lib/stores/dashboard-store';

interface FinanceSummaryCardProps {
  summary: FinanceSummary | null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function FinanceSummaryCard({ summary }: FinanceSummaryCardProps) {
  const { year, month } = useDashboardStore();

  if (!summary) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            Finanzas del mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Sin movimientos este mes</p>
        </CardContent>
      </Card>
    );
  }

  const { realSpent, realSaved, remaining } = summary;
  const isNegative = remaining < 0;

  const href = `/finanzas/presupuesto?year=${year}&month=${month}`;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          Finanzas del mes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-muted-foreground">Gastado</p>
            <p className="text-lg font-semibold text-red-600 dark:text-red-400">
              {formatCurrency(realSpent)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ahorrado</p>
            <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {formatCurrency(realSaved)}
            </p>
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">Me queda</p>
          <p className={cn(
            'text-xl font-bold',
            isNegative ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
          )}>
            {formatCurrency(remaining)}
          </p>
        </div>

        <Button variant="ghost" size="sm" className="w-full justify-between" asChild>
          <Link href={href}>
            Ver presupuesto
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
