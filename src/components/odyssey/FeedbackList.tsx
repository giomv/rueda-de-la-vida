'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import type { OdysseyFeedback } from '@/lib/types';

interface FeedbackListProps {
  feedback: OdysseyFeedback[];
  onChange: (index: number, updates: Partial<OdysseyFeedback>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  maxItems?: number;
}

export function FeedbackList({ feedback, onChange, onAdd, onRemove, maxItems = 5 }: FeedbackListProps) {
  return (
    <div className="space-y-3">
      {feedback.map((item, index) => (
        <div key={item.id} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground w-6 shrink-0 pt-2">{index + 1}.</span>
          <div className="flex-1 space-y-2">
            <Input
              value={item.person_name}
              onChange={(e) => onChange(index, { person_name: e.target.value })}
              placeholder="Nombre de la persona"
              className="bg-background"
            />
            <Input
              value={item.feedback_text}
              onChange={(e) => onChange(index, { feedback_text: e.target.value })}
              placeholder="Su retroalimentacion..."
              className="bg-background"
            />
          </div>
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
      {feedback.length < maxItems && (
        <Button variant="outline" size="sm" onClick={onAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Agregar retroalimentacion
        </Button>
      )}
    </div>
  );
}
