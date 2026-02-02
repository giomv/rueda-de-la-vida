'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusCircle } from './StatusCircle';
import type { DailyGridData } from '@/lib/types/dashboard';

interface DailyGridProps {
  data: DailyGridData;
  daysInMonth: number;
}

export function DailyGrid({ data, daysInMonth }: DailyGridProps) {
  if (data.actions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Acciones diarias</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aun no tienes acciones diarias. Crea una en Mi Plan para ver tu progreso.
          </p>
        </CardContent>
      </Card>
    );
  }

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Acciones diarias</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 bg-card text-left font-medium py-1 pr-2 min-w-[120px]">
                Accion
              </th>
              {days.map((day) => (
                <th
                  key={day}
                  className="text-center font-normal text-muted-foreground px-0.5 min-w-[18px]"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.actions.map((action) => (
              <tr key={action.id}>
                <td className="sticky left-0 bg-card py-1 pr-2 truncate max-w-[120px]" title={action.name}>
                  {action.name}
                </td>
                {days.map((day) => (
                  <td key={day} className="text-center px-0.5 py-1">
                    <StatusCircle completed={!!action.statusByDay[day]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
