'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UserPlus, Mail, Clock, CheckCircle, RotateCw } from 'lucide-react';
import { sendInvitation, resendInvitation, getInvitations, getUsers } from '@/lib/actions/admin-actions';
import type { Invitation } from '@/lib/types';

interface UserRow {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: string;
  created_at: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    const [usersData, invitationsData] = await Promise.all([
      getUsers(),
      getInvitations(),
    ]);
    setUsers(usersData as UserRow[]);
    setInvitations(invitationsData as Invitation[]);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    setInviteLoading(true);

    const result = await sendInvitation(inviteEmail);

    if (result.error) {
      setInviteError(result.error);
    } else {
      setInviteSuccess('Invitación enviada correctamente.');
      setInviteEmail('');
      loadData();
    }
    setInviteLoading(false);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  async function handleResend(invitationId: string) {
    setResendingId(invitationId);
    const result = await resendInvitation(invitationId);
    if (result.error) {
      setInviteError(result.error);
    }
    await loadData();
    setResendingId(null);
  }

  function getInvitationStatus(inv: Invitation) {
    if (inv.used_at) return { label: 'Usada', variant: 'secondary' as const };
    if (new Date(inv.expires_at) < new Date()) return { label: 'Expirada', variant: 'destructive' as const };
    return { label: 'Pendiente', variant: 'default' as const };
  }

  if (loading) {
    return <div className="text-muted-foreground">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Users table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Usuarios</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setInviteEmail('');
              setInviteError('');
              setInviteSuccess('');
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Invitar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invitar usuario</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Correo electrónico</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                {inviteError && (
                  <p className="text-sm text-destructive">{inviteError}</p>
                )}
                {inviteSuccess && (
                  <p className="text-sm text-green-600">{inviteSuccess}</p>
                )}
                <Button type="submit" className="w-full" disabled={inviteLoading}>
                  {inviteLoading ? 'Enviando...' : 'Enviar invitación'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">Nombre</th>
                  <th className="pb-2 pr-4">Correo</th>
                  <th className="pb-2 pr-4">Rol</th>
                  <th className="pb-2">Creado</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="py-3 pr-4">
                      {user.first_name && user.last_name
                        ? `${user.first_name} ${user.last_name}`
                        : user.display_name || '—'}
                    </td>
                    <td className="py-3 pr-4">{user.email || '—'}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-3">{formatDate(user.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Invitations list */}
      <Card>
        <CardHeader>
          <CardTitle>Invitaciones</CardTitle>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay invitaciones aún.</p>
          ) : (
            <div className="space-y-3">
              {invitations.map((inv) => {
                const status = getInvitationStatus(inv);
                return (
                  <div key={inv.id} className="flex items-center justify-between border-b last:border-0 pb-3">
                    <div className="flex items-center gap-3">
                      {inv.used_at ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : new Date(inv.expires_at) < new Date() ? (
                        <Clock className="h-4 w-4 text-destructive" />
                      ) : (
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{inv.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Enviada {formatDate(inv.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      {!inv.used_at && new Date(inv.expires_at) < new Date() && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResend(inv.id)}
                          disabled={resendingId === inv.id}
                        >
                          <RotateCw className={`h-3 w-3 mr-1 ${resendingId === inv.id ? 'animate-spin' : ''}`} />
                          {resendingId === inv.id ? 'Reenviando...' : 'Reenviar'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
