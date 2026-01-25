'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { OdysseyWeeklyCheck } from '@/lib/types';

interface WeeklyChecklistProps {
  weeklyChecks: OdysseyWeeklyCheck[];
  currentWeek: number;
  onUpdate: (weekNumber: number, updates: Partial<OdysseyWeeklyCheck>) => void;
}

export function WeeklyChecklist({ weeklyChecks, currentWeek, onUpdate }: WeeklyChecklistProps) {
  const weeks = [1, 2, 3, 4];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {weeks.map((week) => {
        const check = weeklyChecks.find((c) => c.week_number === week);
        const isCurrentWeek = week === currentWeek;
        const isCompleted = check?.conversation_done && check?.experiment_done && check?.skill_done;

        return (
          <Card key={week} className={isCurrentWeek ? 'border-primary' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Semana {week}</span>
                {isCompleted && <Badge variant="default" className="text-xs">Completada</Badge>}
                {isCurrentWeek && !isCompleted && <Badge variant="outline" className="text-xs">Actual</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={check?.conversation_done || false}
                    onCheckedChange={(v) => onUpdate(week, { conversation_done: !!v })}
                  />
                  Conversación
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={check?.experiment_done || false}
                    onCheckedChange={(v) => onUpdate(week, { experiment_done: !!v })}
                  />
                  Experimento
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={check?.skill_done || false}
                    onCheckedChange={(v) => onUpdate(week, { skill_done: !!v })}
                  />
                  Habilidad
                </label>
              </div>
              <Textarea
                value={check?.notes || ''}
                onChange={(e) => onUpdate(week, { notes: e.target.value })}
                placeholder="Notas de esta semana..."
                rows={2}
                className="text-xs"
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
