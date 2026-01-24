'use client';

import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Domain } from '@/lib/types';

const DOMAIN_TIPS: Record<string, string> = {
  'Salud': '¿Cómo está tu energía física? ¿Duermes bien? ¿Te alimentas de forma saludable?',
  'Trabajo': '¿Te sientes motivado? ¿Estás creciendo profesionalmente? ¿Tienes propósito?',
  'Dinero': '¿Tienes estabilidad financiera? ¿Ahorras? ¿Vives sin estrés económico?',
  'Relaciones': '¿Tienes relaciones significativas? ¿Te sientes conectado con otros?',
  'Familia': '¿Pasas tiempo de calidad con tu familia? ¿Hay armonía?',
  'Ocio': '¿Dedicas tiempo a lo que disfrutas? ¿Tienes hobbies activos?',
  'Crecimiento Personal': '¿Estás aprendiendo cosas nuevas? ¿Te conoces cada vez mejor?',
  'Espiritualidad': '¿Sientes paz interior? ¿Tienes un sentido de propósito?',
};

interface ScoreSliderProps {
  domain: Domain;
  score: number;
  notes: string;
  onScoreChange: (score: number) => void;
  onNotesChange: (notes: string) => void;
}

export function ScoreSlider({
  domain,
  score,
  notes,
  onScoreChange,
  onNotesChange,
}: ScoreSliderProps) {
  const [showNotes, setShowNotes] = useState(!!notes);
  const tip = DOMAIN_TIPS[domain.name];

  const getScoreColor = (value: number) => {
    if (value <= 3) return 'text-red-500';
    if (value <= 6) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="p-4 rounded-lg border border-border bg-card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{domain.icon}</span>
          <span className="font-medium text-sm">{domain.name}</span>
          {tip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">{tip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <span className={cn('text-2xl font-bold tabular-nums', getScoreColor(score))}>
          {score}
        </span>
      </div>

      <Slider
        value={[score]}
        onValueChange={([val]) => onScoreChange(val)}
        max={10}
        min={0}
        step={1}
        className="w-full"
      />

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0 - Muy insatisfecho</span>
        <span>10 - Plenamente satisfecho</span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="w-full text-xs text-muted-foreground"
        onClick={() => setShowNotes(!showNotes)}
      >
        {showNotes ? (
          <>
            <ChevronUp className="h-3 w-3 mr-1" /> Ocultar notas
          </>
        ) : (
          <>
            <ChevronDown className="h-3 w-3 mr-1" /> Agregar notas
          </>
        )}
      </Button>

      {showNotes && (
        <Textarea
          placeholder="¿Por qué este puntaje? ¿Qué te gustaría cambiar?"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="text-sm resize-none"
          rows={2}
        />
      )}
    </div>
  );
}
