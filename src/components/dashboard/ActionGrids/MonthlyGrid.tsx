'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusCircle } from './StatusCircle';
import type { MonthlyGridData } from '@/lib/types/dashboard';

interface MonthlyGridProps {
  data: MonthlyGridData;
}

export function MonthlyGrid({ data }: MonthlyGridProps) {
  if (data.actions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Acciones mensuales</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aun no tienes acciones mensuales.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Acciones mensuales</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.actions.map((action) => (
            <div
              key={action.id}
              className="flex items-center justify-between gap-2 py-1"
            >
              <span className="text-sm truncate" title={action.name}>
                {action.name}
              </span>
              <StatusCircle completed={action.completed} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
