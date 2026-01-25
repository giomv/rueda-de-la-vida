'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Map, Trash2 } from 'lucide-react';
import { useOdysseyList } from '@/hooks/use-odyssey';
import { deleteOdyssey, duplicateOdyssey } from '@/lib/actions/odyssey-actions';
import { PLAN_TYPES } from '@/lib/types';
import { OdysseyCard } from '@/components/odyssey/OdysseyCard';

export default function PlanDeVidaListPage() {
  const { odysseys, loading } = useOdysseyList();
  const router = useRouter();

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Plan de Vida</h1>
        <Link href="/plan-de-vida/nueva">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo plan
          </Button>
        </Link>
      </div>

      {odysseys.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Map className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              Diseña tu Plan de Vida
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Crea 3 planes alternativos a 5 años, compáralos y prototipalos durante 30 días.
            </p>
            <Link href="/plan-de-vida/nueva">
              <Button>Comenzar</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {odysseys.map((odyssey) => (
            <OdysseyCard
              key={odyssey.id}
              odyssey={odyssey}
              onDelete={async () => {
                await deleteOdyssey(odyssey.id);
                router.refresh();
                window.location.reload();
              }}
              onDuplicate={async () => {
                await duplicateOdyssey(odyssey.id);
                window.location.reload();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
