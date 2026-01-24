'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InvitePartner } from '@/components/partner/InvitePartner';
import { usePartner } from '@/hooks/use-partner';
import { acceptInvite, endPartnership, updatePrivacyLevel } from '@/lib/actions/partner-actions';
import { Heart, Users, GitCompareArrows, UserX, Shield } from 'lucide-react';

export default function ParejaPage() {
  const { partnership, partner, loading } = usePartner();
  const [inviteCode, setInviteCode] = useState('');
  const [acceptError, setAcceptError] = useState('');
  const [accepting, setAccepting] = useState(false);

  const handleAcceptInvite = async () => {
    if (!inviteCode.trim()) return;
    setAcceptError('');
    setAccepting(true);
    try {
      await acceptInvite(inviteCode.trim());
      window.location.reload();
    } catch (error) {
      setAcceptError(error instanceof Error ? error.message : 'Error al aceptar');
    } finally {
      setAccepting(false);
    }
  };

  const handleEndPartnership = async () => {
    if (!partnership) return;
    if (!confirm('¿Estás seguro de terminar la conexión con tu pareja?')) return;
    await endPartnership(partnership.id);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-48 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  // Active partnership view
  if (partnership && partnership.status === 'active' && partner) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Espacio de pareja</h1>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{partner.display_name || 'Tu pareja'}</p>
                <p className="text-sm text-muted-foreground">Conectados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/pareja/comparacion">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <GitCompareArrows className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">Comparar ruedas</h3>
                <p className="text-xs text-muted-foreground">
                  Ve las diferencias entre sus ruedas individuales
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/pareja/rueda-compartida/nueva">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <Users className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">Rueda compartida</h3>
                <p className="text-xs text-muted-foreground">
                  Creen una rueda juntos con dominios en común
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Privacy settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Privacidad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm">¿Qué puede ver tu pareja?</label>
              <Select
                value={partnership.privacy_level}
                onValueChange={(v) => updatePrivacyLevel(partnership.id, v as 'full' | 'scores_only' | 'priorities' | 'none')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Todo (puntajes, prioridades, notas)</SelectItem>
                  <SelectItem value="scores_only">Solo puntajes</SelectItem>
                  <SelectItem value="priorities">Puntajes y prioridades</SelectItem>
                  <SelectItem value="none">Nada (solo ruedas compartidas)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={handleEndPartnership}
            >
              <UserX className="h-4 w-4 mr-2" />
              Terminar conexión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No partner - invite/accept view
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Espacio de pareja</h1>

      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Conecta con tu pareja</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Comparen sus ruedas, identifiquen diferencias y crezcan juntos.
            Uno invita y el otro acepta.
          </p>
        </CardContent>
      </Card>

      <InvitePartner />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">¿Tienes un código?</CardTitle>
          <CardDescription>Ingresa el código que tu pareja te compartió</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="ABCD1234"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="font-mono"
              maxLength={8}
            />
            <Button onClick={handleAcceptInvite} disabled={accepting || !inviteCode.trim()}>
              {accepting ? 'Aceptando...' : 'Aceptar'}
            </Button>
          </div>
          {acceptError && (
            <p className="text-sm text-destructive">{acceptError}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
