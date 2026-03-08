'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { RecommendationItem } from '@/lib/types/specialist';

interface RecommendationListProps {
  recommendations: RecommendationItem[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, updates: Partial<RecommendationItem>) => void;
}

export function RecommendationList({
  recommendations,
  onAdd,
  onRemove,
  onUpdate,
}: RecommendationListProps) {
  return (
    <div className="space-y-3">
      {recommendations.map((rec, index) => (
        <div key={rec.id} className="flex gap-2">
          <div className="flex-1 space-y-2">
            <Input
              value={rec.text}
              onChange={(e) => onUpdate(index, { text: e.target.value })}
              placeholder="Recomendacion..."
            />
            <Input
              value={rec.category || ''}
              onChange={(e) => onUpdate(index, { category: e.target.value })}
              placeholder="Categoria (opcional)"
              className="text-sm"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemove(index)}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={onAdd}>
        <Plus className="h-4 w-4" />
        Agregar recomendacion
      </Button>
    </div>
  );
}
