'use client';

import { Textarea } from '@/components/ui/textarea';

interface ReflectionFieldsProps {
  learned: string;
  adjust: string;
  nextStep: string;
  onLearnedChange: (value: string) => void;
  onAdjustChange: (value: string) => void;
  onNextStepChange: (value: string) => void;
}

export function ReflectionFields({
  learned, adjust, nextStep,
  onLearnedChange, onAdjustChange, onNextStepChange,
}: ReflectionFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">¿Qué aprendí?</label>
        <Textarea
          value={learned}
          onChange={(e) => onLearnedChange(e.target.value)}
          placeholder="¿Qué descubriste durante estos 30 días?"
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">¿Qué ajustaría?</label>
        <Textarea
          value={adjust}
          onChange={(e) => onAdjustChange(e.target.value)}
          placeholder="¿Qué cambiarías de tu plan después de esta experiencia?"
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">¿Cuál es mi siguiente paso?</label>
        <Textarea
          value={nextStep}
          onChange={(e) => onNextStepChange(e.target.value)}
          placeholder="¿Qué harás ahora con lo que aprendiste?"
          rows={3}
        />
      </div>
    </div>
  );
}
