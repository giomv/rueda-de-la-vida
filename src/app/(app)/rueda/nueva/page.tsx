'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createWheel } from '@/lib/actions/wheel-actions';
import { CircleDot } from 'lucide-react';

export default function NuevaRuedaPage() {
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<'individual' | 'pareja' | 'compartida'>('individual');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const wheel = await createWheel(title.trim(), mode);
      router.push(`/rueda/${wheel.id}/dominios`);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const today = new Date().toLocaleDateString('es', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircleDot className="h-5 w-5" />
            Nueva Rueda de la Vida
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Nombre de tu rueda</Label>
              <Input
                id="title"
                placeholder={`Mi rueda - ${today}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Dale un nombre que te ayude a identificarla después
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mode">Tipo de rueda</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="pareja">Para parejas (comparar)</SelectItem>
                  <SelectItem value="compartida">Compartida (nosotros)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full" disabled={loading || !title.trim()}>
                {loading ? 'Creando...' : 'Crear y comenzar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
