'use client';

import { StatusCircle } from './StatusCircle';

export function GridLegend() {
  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <StatusCircle completed={true} />
        <span>Completado</span>
      </div>
      <div className="flex items-center gap-1.5">
        <StatusCircle completed={false} />
        <span>Incompleto</span>
      </div>
    </div>
  );
}
