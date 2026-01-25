'use client';

import { Textarea } from '@/components/ui/textarea';

interface ExcitementConcernProps {
  excitement: string;
  concern: string;
  onExcitementChange: (value: string) => void;
  onConcernChange: (value: string) => void;
}

export function ExcitementConcern({ excitement, concern, onExcitementChange, onConcernChange }: ExcitementConcernProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Lo que me emociona</label>
        <Textarea
          value={excitement}
          onChange={(e) => onExcitementChange(e.target.value)}
          placeholder="¿Qué te entusiasma de este plan?"
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Lo que me preocupa</label>
        <Textarea
          value={concern}
          onChange={(e) => onConcernChange(e.target.value)}
          placeholder="¿Qué dudas o miedos tienes?"
          rows={3}
        />
      </div>
    </div>
  );
}
