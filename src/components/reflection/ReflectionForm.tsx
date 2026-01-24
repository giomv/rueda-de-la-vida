'use client';

import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { REFLECTION_QUESTIONS } from '@/lib/types';

interface ReflectionFormProps {
  answers: Record<string, string>;
  onAnswerChange: (questionKey: string, answer: string) => void;
}

export function ReflectionForm({ answers, onAnswerChange }: ReflectionFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-1">Reflexión guiada</h3>
        <p className="text-sm text-muted-foreground">
          Toma unos minutos para responder estas preguntas. No hay respuestas correctas.
        </p>
      </div>

      {REFLECTION_QUESTIONS.map((question) => (
        <div key={question.key} className="space-y-2">
          <Label htmlFor={question.key} className="text-sm font-medium">
            {question.label}
          </Label>
          <Textarea
            id={question.key}
            placeholder="Escribe tu reflexión aquí..."
            value={answers[question.key] || ''}
            onChange={(e) => onAnswerChange(question.key, e.target.value)}
            className="resize-none"
            rows={3}
          />
        </div>
      ))}
    </div>
  );
}
