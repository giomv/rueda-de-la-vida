'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Check, UserPlus } from 'lucide-react';
import { createInvite } from '@/lib/actions/partner-actions';

export function InvitePartner() {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreateInvite = async () => {
    setLoading(true);
    try {
      const partnership = await createInvite();
      setInviteCode(partnership.invite_code);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteCode) return;
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Invitar a tu pareja
        </CardTitle>
        <CardDescription>
          Genera un código de invitación y compártelo con tu pareja
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {inviteCode ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Comparte este código con tu pareja:
            </p>
            <div className="flex gap-2">
              <Input value={inviteCode} readOnly className="font-mono text-lg text-center" />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              El código es de un solo uso. Tu pareja debe ingresarlo en su cuenta.
            </p>
          </div>
        ) : (
          <Button onClick={handleCreateInvite} disabled={loading} className="w-full">
            {loading ? 'Generando...' : 'Generar código de invitación'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
