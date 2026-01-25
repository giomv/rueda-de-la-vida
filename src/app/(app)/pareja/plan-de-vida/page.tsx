'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Map, Share2 } from 'lucide-react';
import { usePartner } from '@/hooks/use-partner';
import { useOdysseyList } from '@/hooks/use-odyssey';
import { shareOdyssey, getPartnerOdysseys } from '@/lib/actions/odyssey-actions';
import { PLAN_TYPES } from '@/lib/types';

export default function ParejaOdysseyPage() {
  const { partnership, partner, loading: partnerLoading } = usePartner();
  const { odysseys, loading: odysseysLoading } = useOdysseyList();
  const [sharedOdysseys, setSharedOdysseys] = useState<any[]>([]);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    async function fetchShared() {
      if (!partnership?.id) return;
      const data = await getPartnerOdysseys(partnership.id);
      setSharedOdysseys(data);
    }
    if (partnership) fetchShared();
  }, [partnership]);

  if (partnerLoading || odysseysLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!partnership) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Map className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              Conecta con tu pareja
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Primero necesitas tener una pareja conectada para compartir planes.
            </p>
            <Link href="/pareja/invitar">
              <Button>Invitar pareja</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleShare = async (odysseyId: string) => {
    if (!partnership?.id) return;
    setSharing(true);
    try {
      await shareOdyssey(partnership.id, odysseyId);
      const data = await getPartnerOdysseys(partnership.id);
      setSharedOdysseys(data);
    } catch (error) {
      console.error('Error sharing:', error);
    }
    setSharing(false);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Plan de Vida en Pareja</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Comparte tus planes con {partner?.display_name || 'tu pareja'} y compara sus visiones a futuro.
      </p>

      {/* My odysseys to share */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mis planes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {odysseys.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no tienes planes de vida. <Link href="/plan-de-vida/nueva" className="text-primary underline">Crea uno</Link>.
            </p>
          ) : (
            odysseys.map((odyssey) => {
              const isShared = sharedOdysseys.some((s) => s.odyssey_id === odyssey.id);
              return (
                <div key={odyssey.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">{odyssey.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(odyssey.created_at).toLocaleDateString('es')}
                    </p>
                  </div>
                  {isShared ? (
                    <Badge variant="secondary" className="text-xs">Compartido</Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare(odyssey.id)}
                      disabled={sharing}
                    >
                      <Share2 className="h-4 w-4 mr-1" />
                      Compartir
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Partner's shared odysseys */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Planes de {partner?.display_name || 'tu pareja'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sharedOdysseys.filter((s) => s.shared_by !== partnership.user_a_id && s.shared_by !== partnership.user_b_id).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Tu pareja aún no ha compartido planes contigo.
            </p>
          ) : (
            sharedOdysseys
              .filter((s) => s.shared_by !== null)
              .map((shared) => (
                <Link
                  key={shared.id}
                  href={`/pareja/plan-de-vida/comparacion?odysseyId=${shared.odyssey_id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{shared.odysseys?.title || 'Plan de vida'}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(shared.created_at).toLocaleDateString('es')}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">Ver</Badge>
                </Link>
              ))
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Link href="/pareja/plan-de-vida/comparacion" className="flex-1">
          <Button variant="outline" className="w-full">
            Comparar planes
          </Button>
        </Link>
      </div>
    </div>
  );
}
