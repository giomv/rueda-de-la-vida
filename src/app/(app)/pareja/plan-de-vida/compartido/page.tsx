'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Map, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePartner } from '@/hooks/use-partner';

export default function CompartidoPage() {
  const router = useRouter();
  const { partnership, partner, loading } = usePartner();

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/pareja/plan-de-vida')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Plan de Vida Compartido</h1>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-lg font-semibold mb-2">
            Próximamente
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            La función de Plan de Vida compartido en pareja estará disponible pronto.
            Por ahora, pueden comparar sus planes individuales.
          </p>
          <Link href="/pareja/plan-de-vida/comparacion">
            <Button variant="outline">Ir a Comparar</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
