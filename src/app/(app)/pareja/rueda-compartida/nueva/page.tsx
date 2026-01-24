'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createWheel } from '@/lib/actions/wheel-actions';
import { usePartner } from '@/hooks/use-partner';
import { shareWheel } from '@/lib/actions/partner-actions';
import { Users, ChevronLeft } from 'lucide-react';

export default function NuevaRuedaCompartidaPage() {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { partnership, partner } = usePartner();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !partnership) return;

    setLoading(true);
    try {
      const wheel = await createWheel(title.trim(), 'compartida');
      await shareWheel(partnership.id, wheel.id);
      router.push(`/rueda/${wheel.id}/dominios`);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/pareja')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold">Rueda compartida</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5" />
            Nueva rueda con {partner?.display_name || 'tu pareja'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Nombre de la rueda</Label>
              <Input
                id="title"
                placeholder="Nuestra rueda - Enero 2025"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Definirán los dominios juntos y puntuarán por consenso.
            </p>

            <Button type="submit" className="w-full" disabled={loading || !title.trim()}>
              {loading ? 'Creando...' : 'Crear rueda compartida'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
