'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

interface QuestionListProps {
  questions: string[];
  onChange: (index: number, text: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  maxQuestions?: number;
}

export function QuestionList({ questions, onChange, onAdd, onRemove, maxQuestions = 3 }: QuestionListProps) {
  return (
    <div className="space-y-3">
      {questions.map((question, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground w-6 shrink-0">{index + 1}.</span>
          <Input
            value={question}
            onChange={(e) => onChange(index, e.target.value)}
            placeholder="Escribe una pregunta curiosa..."
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(index)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      {questions.length < maxQuestions && (
        <Button variant="outline" size="sm" onClick={onAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Agregar pregunta
        </Button>
      )}
    </div>
  );
}
