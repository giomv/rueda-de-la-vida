'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, Lightbulb } from 'lucide-react';
import { saveWeeklyCheckin } from '@/lib/actions/lifeplan-actions';
import { cn } from '@/lib/utils';
import type { WeeklyCheckin } from '@/lib/types/lifeplan';

interface WeeklyCheckinFormProps {
  weekStart: string;
  existingCheckin?: WeeklyCheckin | null;
  onSave?: (checkin: WeeklyCheckin) => void;
  className?: string;
}

export function WeeklyCheckinForm({
  weekStart,
  existingCheckin,
  onSave,
  className,
}: WeeklyCheckinFormProps) {
  const [whatWorked, setWhatWorked] = useState(existingCheckin?.what_worked || '');
  const [whatToAdjust, setWhatToAdjust] = useState(existingCheckin?.what_to_adjust || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (existingCheckin) {
      setWhatWorked(existingCheckin.what_worked || '');
      setWhatToAdjust(existingCheckin.what_to_adjust || '');
    }
  }, [existingCheckin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaved(false);

    try {
      const checkin = await saveWeeklyCheckin(weekStart, whatWorked, whatToAdjust);
      setSaved(true);
      onSave?.(checkin);

      // Clear saved indicator after 2 seconds
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  // Format week display
  const formatWeek = (dateStr: string) => {
    const start = new Date(dateStr + 'T00:00:00');
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return `${start.toLocaleDateString('es', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('es', { day: 'numeric', month: 'short' })}`;
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Reflexión Semanal
          </CardTitle>
          <CardDescription>
            Semana del {formatWeek(weekStart)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* What worked */}
          <div className="space-y-2">
            <Label htmlFor="whatWorked" className="text-base font-medium">
              ¿Qué funcionó esta semana?
            </Label>
            <p className="text-sm text-muted-foreground">
              Celebra tus logros, por pequeños que sean
            </p>
            <Textarea
              id="whatWorked"
              value={whatWorked}
              onChange={(e) => setWhatWorked(e.target.value)}
              placeholder="Ej: Logré meditar 3 días seguidos, completé todas mis acciones de ejercicio..."
              rows={4}
            />
          </div>

          {/* What to adjust */}
          <div className="space-y-2">
            <Label htmlFor="whatToAdjust" className="text-base font-medium flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              ¿Qué ajustarás la próxima semana?
            </Label>
            <p className="text-sm text-muted-foreground">
              Identifica mejoras concretas y alcanzables
            </p>
            <Textarea
              id="whatToAdjust"
              value={whatToAdjust}
              onChange={(e) => setWhatToAdjust(e.target.value)}
              placeholder="Ej: Voy a poner recordatorios para las acciones de la mañana, reduciré el número de acciones diarias..."
              rows={4}
            />
          </div>

          {/* Submit */}
          <Button type="submit" disabled={isSaving} className="w-full">
            {saved ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Guardado
              </>
            ) : isSaving ? (
              'Guardando...'
            ) : existingCheckin ? (
              'Actualizar reflexión'
            ) : (
              'Guardar reflexión'
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
