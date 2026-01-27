'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { RadarChart } from '@/components/wheel/RadarChart';
import { createClient } from '@/lib/supabase/client';
import { deleteWheel, duplicateWheel } from '@/lib/actions/wheel-actions';
import { Plus, MoreVertical, Copy, Trash2, CircleDot } from 'lucide-react';
import type { WheelWithDomains } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function MisRuedasPage() {
  const [wheels, setWheels] = useState<WheelWithDomains[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function fetchWheels() {
    const supabase = createClient();
    const { data } = await supabase
      .from('wheels')
      .select('*, domains(*), scores(*), priorities(*)')
      .order('created_at', { ascending: false });
    setWheels((data as WheelWithDomains[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchWheels();
  }, []);

  const handleDelete = async (wheelId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta rueda?')) return;
    await deleteWheel(wheelId);
    setWheels((prev) => prev.filter((w) => w.id !== wheelId));
  };

  const handleDuplicate = async (wheelId: string) => {
    const newWheel = await duplicateWheel(wheelId);
    router.push(`/rueda/${newWheel.id}/dominios`);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis Ruedas</h1>
        <Link href="/rueda/nueva">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva
          </Button>
        </Link>
      </div>

      {wheels.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <CircleDot className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">No tienes ruedas aún</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Crea tu primera rueda para comenzar a evaluar tu vida.
            </p>
            <Link href="/rueda/nueva">
              <Button>Crear mi primera rueda</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {wheels.map((wheel) => (
            <Card key={wheel.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Link
                      href={`/rueda/${wheel.id}/plan`}
                      className="font-semibold hover:text-primary transition-colors"
                    >
                      {wheel.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {new Date(wheel.created_at).toLocaleDateString('es')} · {wheel.domains.length} dominios
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDuplicate(wheel.id)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(wheel.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {wheel.scores.length > 0 && (
                  <Link href={`/rueda/${wheel.id}/plan`}>
                    <RadarChart
                      domains={wheel.domains}
                      scores={wheel.scores}
                      height={180}
                      showLabels={false}
                    />
                  </Link>
                )}

                {wheel.priorities.filter((p) => p.is_focus).length > 0 && (
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {wheel.priorities
                      .filter((p) => p.is_focus)
                      .map((p) => {
                        const domain = wheel.domains.find((d) => d.id === p.domain_id);
                        return domain ? (
                          <span
                            key={p.id}
                            className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                          >
                            {domain.icon} {domain.name}
                          </span>
                        ) : null;
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
