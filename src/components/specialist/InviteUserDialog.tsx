'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { inviteUser } from '@/lib/actions/specialist-actions';

interface InviteUserDialogProps {
  onInvited?: () => void;
}

export function InviteUserDialog({ onInvited }: InviteUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    try {
      const result = await inviteUser(email);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setEmail('');
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
          onInvited?.();
        }, 1500);
      }
    } catch {
      setError('Error al enviar la invitacion.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4" />
          Invitar usuario
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invitar usuario</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Correo del usuario</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="usuario@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">Invitacion enviada correctamente.</p>}
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Enviando...' : 'Enviar invitacion'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
