'use client';

import { useState, useEffect } from 'react';
import { UserCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  listPendingSpecialistInvitations,
  acceptSpecialistInvitation,
  rejectSpecialistInvitation,
} from '@/lib/actions/specialist-user-actions';
import type { SpecialistInvitationWithName } from '@/lib/types/specialist';

export function SpecialistInviteBanner() {
  const [invitations, setInvitations] = useState<SpecialistInvitationWithName[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    listPendingSpecialistInvitations()
      .then(setInvitations)
      .catch(() => {});
  }, []);

  async function handleAccept(id: string) {
    setLoadingId(id);
    try {
      await acceptSpecialistInvitation(id);
      setInvitations((prev) => prev.filter(i => i.id !== id));
    } catch {
      // Silently handled
    } finally {
      setLoadingId(null);
    }
  }

  async function handleReject(id: string) {
    setLoadingId(id);
    try {
      await rejectSpecialistInvitation(id);
      setInvitations((prev) => prev.filter(i => i.id !== id));
    } catch {
      // Silently handled
    } finally {
      setLoadingId(null);
    }
  }

  if (invitations.length === 0) return null;

  return (
    <div className="space-y-3">
      {invitations.map((inv) => (
        <Alert key={inv.id}>
          <UserCheck className="h-4 w-4" />
          <AlertTitle>Invitación de especialista</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4 flex-wrap">
            <span>
              {inv.specialist_name} quiere vincularse contigo.
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleAccept(inv.id)}
                disabled={loadingId === inv.id}
              >
                Aceptar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReject(inv.id)}
                disabled={loadingId === inv.id}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
