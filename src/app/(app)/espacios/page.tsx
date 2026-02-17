'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Users, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateSpaceDialog } from '@/components/spaces/CreateSpaceDialog';
import {
  listSharedSpaces,
  listPendingInvitations,
  acceptInvitation,
  rejectInvitation,
} from '@/lib/actions/space-actions';
import type { SharedSpace, PendingInvitation } from '@/lib/types/journal';
import { toast } from 'sonner';

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  accepted: { label: 'Aceptado', variant: 'default' },
  pending: { label: 'Pendiente', variant: 'secondary' },
  rejected: { label: 'Rechazado', variant: 'destructive' },
};

export default function EspaciosPage() {
  const [spaces, setSpaces] = useState<SharedSpace[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [s, i] = await Promise.all([
        listSharedSpaces(),
        listPendingInvitations(),
      ]);
      setSpaces(s);
      setInvitations(i);
    } catch {
      // Silent
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAccept = async (id: string) => {
    setProcessingId(id);
    try {
      await acceptInvitation(id);
      toast.success('Invitación aceptada');
      loadData();
    } catch {
      toast.error('Error al aceptar la invitación');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      await rejectInvitation(id);
      toast.success('Invitación rechazada');
      loadData();
    } catch {
      toast.error('Error al rechazar la invitación');
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Espacios</h1>
        <CreateSpaceDialog
          trigger={
            <Button>
              <Plus className="h-4 w-4" />
              Crear espacio
            </Button>
          }
          onCreated={loadData}
        />
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Invitaciones pendientes</h2>
          {invitations.map((inv) => (
            <Card key={inv.id}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {inv.ownerName} te invitó a {inv.spaceName}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleAccept(inv.id)}
                    disabled={processingId === inv.id}
                  >
                    {processingId === inv.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Aceptar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleReject(inv.id)}
                    disabled={processingId === inv.id}
                  >
                    <X className="h-4 w-4" />
                    Rechazar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {invitations.length === 0 && spaces.length > 0 && (
        <p className="text-sm text-muted-foreground">No tienes invitaciones pendientes</p>
      )}

      {/* Spaces List */}
      {spaces.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <Users className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">
            No tienes espacios compartidos todavía.
          </p>
          <p className="text-sm text-muted-foreground">
            Crea uno para compartir sesiones de bitácora.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Mis espacios</h2>
          {spaces.map((space) => (
            <Link key={space.id} href={`/espacios/${space.id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{space.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {space.members?.length || 0} miembros
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {space.members
                        ?.filter((m) => m.role !== 'owner')
                        .map((m) => {
                          const badge = STATUS_BADGE[m.status] || STATUS_BADGE.pending;
                          return (
                            <Badge key={m.id} variant={badge.variant} className="text-xs">
                              {badge.label}
                            </Badge>
                          );
                        })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
