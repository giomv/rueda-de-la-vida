'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WheelComparison } from '@/components/wheel/WheelComparison';
import { createClient } from '@/lib/supabase/client';
import { GitCompareArrows } from 'lucide-react';
import type { WheelWithDomains } from '@/lib/types';

export default function CompararPage() {
  const [wheels, setWheels] = useState<WheelWithDomains[]>([]);
  const [wheelA, setWheelA] = useState<string>('');
  const [wheelB, setWheelB] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();
      const { data } = await supabase
        .from('wheels')
        .select('*, domains(*), scores(*), priorities(*)')
        .order('created_at', { ascending: false });
      setWheels((data as WheelWithDomains[]) || []);
      setLoading(false);
    }
    fetch();
  }, []);

  const selectedA = wheels.find((w) => w.id === wheelA);
  const selectedB = wheels.find((w) => w.id === wheelB);

  // Use domains from wheel A for comparison
  const canCompare = selectedA && selectedB && selectedA.scores.length > 0 && selectedB.scores.length > 0;

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded mb-4" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Comparar ruedas</h1>

      {wheels.length < 2 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <GitCompareArrows className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Necesitas al menos 2 ruedas</h2>
            <p className="text-sm text-muted-foreground">
              Crea más ruedas para poder compararlas y ver tu progreso.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rueda A</label>
              <Select value={wheelA} onValueChange={setWheelA}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {wheels.map((w) => (
                    <SelectItem key={w.id} value={w.id} disabled={w.id === wheelB}>
                      {w.title} ({new Date(w.created_at).toLocaleDateString('es')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Rueda B</label>
              <Select value={wheelB} onValueChange={setWheelB}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {wheels.map((w) => (
                    <SelectItem key={w.id} value={w.id} disabled={w.id === wheelA}>
                      {w.title} ({new Date(w.created_at).toLocaleDateString('es')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {canCompare && (
            <WheelComparison
              domains={selectedA.domains}
              scoresA={selectedA.scores}
              scoresB={selectedB.scores}
              labelA={selectedA.title}
              labelB={selectedB.title}
            />
          )}

          {wheelA && wheelB && !canCompare && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Ambas ruedas necesitan tener puntajes para poder compararlas.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
