'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusCircle } from './StatusCircle';
import type { WeeklyGridData, WeekBucket } from '@/lib/types/dashboard';

interface WeeklyGridProps {
  data: WeeklyGridData;
  weekBuckets: WeekBucket[];
}

export function WeeklyGrid({ data, weekBuckets }: WeeklyGridProps) {
  if (data.actions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Acciones semanales</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aun no tienes acciones semanales.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Acciones semanales</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left font-medium py-1 pr-2 min-w-[100px]">
                Accion
              </th>
              {weekBuckets.map((bucket) => (
                <th
                  key={bucket.index}
                  className="text-center font-normal text-muted-foreground px-1"
                  title={`${bucket.start} - ${bucket.end}`}
                >
                  S{bucket.index}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.actions.map((action) => (
              <tr key={action.id}>
                <td className="py-1 pr-2 truncate max-w-[100px]" title={action.name}>
                  {action.name}
                </td>
                {weekBuckets.map((bucket) => (
                  <td key={bucket.index} className="text-center px-1 py-1">
                    <StatusCircle completed={!!action.statusByWeekIndex[bucket.index]} />
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
