'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { getLastCheckin, saveDashboardCheckin } from '@/lib/actions/dashboard-actions';
import { MOOD_EMOJIS, SATISFACTION_SCALE } from '@/lib/types/dashboard';
import { cn } from '@/lib/utils';

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export function CheckinDialog() {
  const [open, setOpen] = useState(false);
  const [whatWorked, setWhatWorked] = useState('');
  const [whatToAdjust, setWhatToAdjust] = useState('');
  const [satisfaction, setSatisfaction] = useState<number | undefined>();
  const [mood, setMood] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function checkLastCheckin() {
      try {
        const lastCheckin = await getLastCheckin();
        if (!lastCheckin) {
          // No check-in ever, show prompt
          setOpen(true);
          return;
        }

        const lastDate = new Date(lastCheckin.week_start);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays >= 7) {
          setOpen(true);
        }
      } catch {
        // Ignore errors
      }
    }

    checkLastCheckin();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const weekStart = getWeekStart(new Date());
      await saveDashboardCheckin(weekStart, {
        whatWorked,
        whatToAdjust,
        satisfactionScore: satisfaction,
        moodEmoji: mood,
      });
      setOpen(false);
    } catch {
      // Handle error silently
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reflexion semanal</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Satisfaction scale */}
          <div className="space-y-3">
            <Label>Como te fue esta semana?</Label>
            <RadioGroup
              value={satisfaction?.toString()}
              onValueChange={(v: string) => setSatisfaction(parseInt(v))}
              className="flex justify-between"
            >
              {SATISFACTION_SCALE.map((item) => (
                <div key={item.value} className="flex flex-col items-center gap-1">
                  <RadioGroupItem
                    value={item.value.toString()}
                    id={`sat-${item.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`sat-${item.value}`}
                    className={cn(
                      'flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 text-lg transition-colors',
                      satisfaction === item.value
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted hover:border-primary/50'
                    )}
                  >
                    {item.value}
                  </Label>
                  <span className="text-[10px] text-muted-foreground text-center">
                    {item.label}
                  </span>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Mood emoji */}
          <div className="space-y-3">
            <Label>Como te sientes?</Label>
            <div className="flex flex-wrap gap-2">
              {MOOD_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setMood(emoji)}
                  className={cn(
                    'text-2xl p-2 rounded-lg transition-colors',
                    mood === emoji
                      ? 'bg-primary/20 ring-2 ring-primary'
                      : 'hover:bg-muted'
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* What worked */}
          <div className="space-y-2">
            <Label htmlFor="what-worked">Que funciono bien?</Label>
            <Textarea
              id="what-worked"
              value={whatWorked}
              onChange={(e) => setWhatWorked(e.target.value)}
              placeholder="Describe lo que funciono..."
              rows={3}
            />
          </div>

          {/* What to adjust */}
          <div className="space-y-2">
            <Label htmlFor="what-to-adjust">Que ajustarias?</Label>
            <Textarea
              id="what-to-adjust"
              value={whatToAdjust}
              onChange={(e) => setWhatToAdjust(e.target.value)}
              placeholder="Describe lo que ajustarias..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Ahora no
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Guardando...' : 'Guardar reflexion'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
