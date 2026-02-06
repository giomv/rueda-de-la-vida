'use client';

import { CircleDot } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Wheel } from '@/lib/types';

interface WheelSelectorProps {
  wheels: Pick<Wheel, 'id' | 'title' | 'created_at'>[];
  selectedWheelId: string | null;
  onSelect: (wheelId: string) => void;
  loading?: boolean;
}

export function WheelSelector({
  wheels,
  selectedWheelId,
  onSelect,
  loading = false,
}: WheelSelectorProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (wheels.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-3 border border-dashed rounded-lg text-center">
        No tienes ruedas creadas. Crea una Rueda de la Vida primero para importar sus metas.
      </div>
    );
  }

  return (
    <Select
      value={selectedWheelId || undefined}
      onValueChange={onSelect}
      disabled={loading}
    >
      <SelectTrigger className="w-full">
        <div className="flex items-center gap-2">
          <CircleDot className="h-4 w-4 text-primary shrink-0" />
          <SelectValue placeholder="Selecciona una Rueda de la Vida..." />
        </div>
      </SelectTrigger>
      <SelectContent>
        {wheels.map((wheel) => (
          <SelectItem key={wheel.id} value={wheel.id}>
            <div className="flex flex-col">
              <span>{wheel.title}</span>
              <span className="text-xs text-muted-foreground">
                {formatDate(wheel.created_at)}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
