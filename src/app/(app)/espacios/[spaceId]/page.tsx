'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2, UserPlus, Loader2, Check, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  getSharedSpace,
  renameSharedSpace,
  deleteSharedSpace,
  inviteToSpace,
  removeMember,
} from '@/lib/actions/space-actions';
import type { SharedSpace } from '@/lib/types/journal';
import { toast } from 'sonner';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Propietario',
  collaborator: 'Colaborador',
};

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  accepted: { label: 'Aceptado', variant: 'default' },
  pending: { label: 'Pendiente', variant: 'secondary' },
  rejected: { label: 'Rechazado', variant: 'destructive' },
};

export default function SpaceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const spaceId = params.spaceId as string;

  const [space, setSpace] = useState<SharedSpace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inline editing
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  // Invite
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  // Delete
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    getSharedSpace(spaceId)
      .then((s) => {
        setSpace(s);
        setEditName(s.name);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar'))
      .finally(() => setIsLoading(false));
  }, [spaceId]);

  const isOwner = space?.ownerId === undefined ? false : true; // We'll check below

  const handleRename = async () => {
    if (!editName.trim()) return;
    setIsSavingName(true);
    try {
      const updated = await renameSharedSpace(spaceId, editName);
      setSpace(updated);
      setIsEditing(false);
      toast.success('Nombre actualizado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al renombrar');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    try {
      await inviteToSpace(spaceId, inviteEmail);
      toast.success('Invitación enviada');
      setInviteEmail('');
      setShowInvite(false);
      const updated = await getSharedSpace(spaceId);
      setSpace(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al invitar');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMember(spaceId, memberId);
      toast.success('Miembro eliminado');
      const updated = await getSharedSpace(spaceId);
      setSpace(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar miembro');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteSharedSpace(spaceId);
      toast.success('Espacio eliminado');
      router.push('/espacios');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="py-12 text-center">
          <p className="text-muted-foreground">{error || 'Espacio no encontrado'}</p>
        </div>
      </div>
    );
  }

  const memberCount = space.members?.length || 0;
  const canInvite = memberCount < 2;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={60}
                className="flex-1"
                autoFocus
              />
              <Button
                size="icon"
                onClick={handleRename}
                disabled={isSavingName}
              >
                {isSavingName ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  setEditName(space.name);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">{space.name}</h1>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar espacio?</AlertDialogTitle>
              <AlertDialogDescription>
                Las sesiones compartidas en este espacio pasarán a ser privadas de sus creadores.
                Los miembros perderán acceso.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Miembros</CardTitle>
            {canInvite && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInvite(!showInvite)}
              >
                <UserPlus className="h-4 w-4" />
                Invitar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showInvite && (
            <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@ejemplo.com"
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={handleInvite}
                disabled={isInviting}
              >
                {isInviting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Invitar'
                )}
              </Button>
            </div>
          )}

          {space.members?.map((member) => {
            const statusBadge = STATUS_BADGE[member.status] || STATUS_BADGE.pending;
            return (
              <div
                key={member.id}
                className="flex items-center justify-between gap-2 py-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {member.userName || member.invitedEmail}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ROLE_LABELS[member.role] || member.role}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={statusBadge.variant} className="text-xs">
                    {statusBadge.label}
                  </Badge>
                  {member.role !== 'owner' && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Link to Bitacora filtered by space */}
      <Button variant="outline" className="w-full" asChild>
        <Link href={`/bitacora/sesiones?spaceId=${space.id}`}>
          Ver sesiones de este espacio
        </Link>
      </Button>
    </div>
  );
}
