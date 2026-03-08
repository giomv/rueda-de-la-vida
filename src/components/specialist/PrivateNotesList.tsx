'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface PrivateNotesListProps {
  notes: { id: string; text: string }[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, text: string) => void;
}

export function PrivateNotesList({ notes, onAdd, onRemove, onUpdate }: PrivateNotesListProps) {
  return (
    <div className="space-y-3">
      {notes.map((note, index) => (
        <div key={note.id} className="flex gap-2">
          <Textarea
            value={note.text}
            onChange={(e) => onUpdate(index, e.target.value)}
            placeholder="Nota privada..."
            className="min-h-[60px]"
          />
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
        Agregar nota
      </Button>
    </div>
  );
}
