'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Map, ArrowRight, Users, User, Loader2 } from 'lucide-react';
import { createOdyssey } from '@/lib/actions/odyssey-actions';
import { cn } from '@/lib/utils';

export default function NuevaOdysseyPage() {
  const router = useRouter();
  const [step, setStep] = useState<'intro' | 'config'>('intro');
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<'individual' | 'pareja'>('individual');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const odyssey = await createOdyssey(title.trim(), mode);
      router.push(`/plan-de-vida/${odyssey.id}/plan-1`);
    } catch (error) {
      console.error('Error creating odyssey:', error);
      setCreating(false);
    }
  };

  if (step === 'intro') {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        <Card>
          <CardContent className="py-8 text-center space-y-6">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Map className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">Plan de Vida</h1>
              <p className="text-muted-foreground">
                Diseña 3 planes de vida alternativos a 5 años
              </p>
            </div>

            <div className="text-left space-y-4 max-w-sm mx-auto">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">1</div>
                <div>
                  <p className="text-sm font-medium">Camino Actual</p>
                  <p className="text-xs text-muted-foreground">Tu vida si sigues el rumbo actual</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center text-xs font-bold shrink-0">2</div>
                <div>
                  <p className="text-sm font-medium">Alternativa</p>
                  <p className="text-xs text-muted-foreground">Si tu Plan 1 no fuera posible</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center text-xs font-bold shrink-0">3</div>
                <div>
                  <p className="text-sm font-medium">Carta Salvaje</p>
                  <p className="text-xs text-muted-foreground">Sin limitaciones de dinero ni opiniones</p>
                </div>
              </div>
            </div>

            <div className="pt-2 space-y-3 text-sm text-muted-foreground">
              <p>Luego compararás los 3 planes, elegirás uno y lo prototiparás durante 30 días.</p>
            </div>

            <Button size="lg" onClick={() => setStep('config')}>
              Comenzar
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Configura tu Plan de Vida</h1>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Nombre del plan
          </label>
          <Input
            placeholder="Ej: Mi plan 2025-2030"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Modalidad</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode('individual')}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors',
                mode === 'individual'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <User className="h-6 w-6" />
              <span className="text-sm font-medium">Individual</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('pareja')}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors',
                mode === 'pareja'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <Users className="h-6 w-6" />
              <span className="text-sm font-medium">Pareja</span>
            </button>
          </div>
        </div>
      </div>

      <Button
        size="lg"
        className="w-full"
        onClick={handleCreate}
        disabled={!title.trim() || creating}
      >
        {creating ? <><Loader2 className="h-4 w-4 animate-spin" /> Creando...</> : <>Crear plan <ArrowRight className="h-4 w-4 ml-2" /></>}
      </Button>
    </div>
  );
}
