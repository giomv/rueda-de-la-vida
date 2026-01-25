'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Lightbulb } from 'lucide-react';

interface InspireButtonProps {
  prompts: string[];
  onSelect: (prompt: string) => void;
}

export function InspireButton({ prompts, onSelect }: InspireButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Lightbulb className="h-4 w-4" />
        Inspiración
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preguntas para inspirarte</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {prompts.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onSelect(prompt);
                  setOpen(false);
                }}
                className="w-full text-left p-3 rounded-lg border hover:bg-accent hover:border-primary/50 transition-colors text-sm"
              >
                {prompt}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
