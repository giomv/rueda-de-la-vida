'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusCircle } from './StatusCircle';
import type { OnceGridData } from '@/lib/types/dashboard';

interface OnceGridProps {
  data: OnceGridData;
}

export function OnceGrid({ data }: OnceGridProps) {
  if (data.actions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Acciones unicas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aun no tienes acciones unicas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Acciones unicas</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left font-medium py-1 pr-2">Accion</th>
              <th className="text-center font-normal text-muted-foreground px-1">Estado</th>
            </tr>
          </thead>
          <tbody>
            {data.actions.map((action) => (
              <tr key={action.id}>
                <td className="py-1 pr-2 truncate max-w-[200px]" title={action.name}>
                  {action.name}
                </td>
                <td className="text-center px-1 py-1">
                  <StatusCircle
                    completed={action.completed}
                    date={action.completedAt ? new Date(action.completedAt).toLocaleDateString('es-MX') : null}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
