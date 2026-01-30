'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import type { ActionsSummary } from '@/lib/types/dashboard';
import { useDashboardStore } from '@/lib/stores/dashboard-store';

interface ActionsSummaryCardProps {
  summary: ActionsSummary | null;
}

export function ActionsSummaryCard({ summary }: ActionsSummaryCardProps) {
  const { domainId, goalId } = useDashboardStore();

  if (!summary) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Acciones del mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Sin acciones programadas</p>
        </CardContent>
      </Card>
    );
  }

  const { scheduled, completed, completionRate, weeklyConsistency } = summary;

  // Build link with filters
  let href = '/mi-plan/hoy';
  const params = new URLSearchParams();
  if (domainId) params.set('domain', domainId);
  if (goalId) params.set('goal', goalId);
  if (params.toString()) href += `?${params.toString()}`;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          Acciones del mes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold">{completed}</span>
            <span className="text-muted-foreground">/ {scheduled}</span>
            <span className="text-sm text-muted-foreground ml-1">Completadas</span>
          </div>
          <Progress value={completionRate} className="h-2 mt-2" />
        </div>

        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{weeklyConsistency}%</span> Consistencia semanal
        </div>

        <Button variant="ghost" size="sm" className="w-full justify-between" asChild>
          <Link href={href}>
            Ver en Mi Plan
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
