'use client';

import Link from 'next/link';
import { Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function EmptyState() {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <Map className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">
          Activa tu plan de vida
        </h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
          Para ver tu progreso, necesitas crear y seleccionar un plan de vida activo.
        </p>
        <Button asChild>
          <Link href="/plan-de-vida">Crear Plan de Vida</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
