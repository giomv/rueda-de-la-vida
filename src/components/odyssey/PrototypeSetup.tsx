'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PROTOTYPE_STEP_TYPES } from '@/lib/types';
import type { PrototypeStepType } from '@/lib/types';

interface PrototypeStep {
  step_type: PrototypeStepType;
  title: string;
  description: string;
}

interface PrototypeSetupProps {
  steps: PrototypeStep[];
  onChange: (steps: PrototypeStep[]) => void;
}

export function PrototypeSetup({ steps, onChange }: PrototypeSetupProps) {
  const updateStep = (index: number, updates: Partial<PrototypeStep>) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    onChange(newSteps);
  };

  // Ensure we have 3 steps
  const displaySteps = PROTOTYPE_STEP_TYPES.map((type) => {
    const existing = steps.find((s) => s.step_type === type.key);
    return existing || { step_type: type.key, title: '', description: '' };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {displaySteps.map((step, index) => {
        const typeInfo = PROTOTYPE_STEP_TYPES.find((t) => t.key === step.step_type)!;
        return (
          <Card key={step.step_type}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="text-lg">{typeInfo.icon}</span>
                {typeInfo.label}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{typeInfo.description}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block">¿Qué vas a hacer?</label>
                <Input
                  value={step.title}
                  onChange={(e) => updateStep(index, { step_type: step.step_type, title: e.target.value })}
                  placeholder={`Ej: ${typeInfo.key === 'conversation' ? 'Hablar con mi mentor' : typeInfo.key === 'experiment' ? 'Probar freelance un fin de semana' : 'Tomar un curso online'}`}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Detalles (opcional)</label>
                <Textarea
                  value={step.description}
                  onChange={(e) => updateStep(index, { step_type: step.step_type, description: e.target.value })}
                  placeholder="Más detalles sobre este paso..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
