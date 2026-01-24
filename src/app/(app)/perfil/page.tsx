'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/lib/supabase/client';
import { logoutAction } from '@/lib/actions/auth-actions';
import { Moon, Sun, Bell, BellOff, Download, LogOut, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import type { Profile } from '@/lib/types';

export default function PerfilPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (data) {
          setProfile(data);
          setDisplayName(data.display_name || '');
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', profile.id);
    setSaving(false);
  };

  const handleToggleReminders = async () => {
    if (!profile) return;
    const supabase = createClient();
    const newVal = !profile.reminders_enabled;
    await supabase
      .from('profiles')
      .update({ reminders_enabled: newVal })
      .eq('id', profile.id);
    setProfile({ ...profile, reminders_enabled: newVal });
  };

  const handleExportData = async () => {
    const supabase = createClient();
    const { data: wheels } = await supabase
      .from('wheels')
      .select('*, domains(*), scores(*), priorities(*), reflections:reflections(*), ideal_life(*), action_plans(*)');

    const blob = new Blob([JSON.stringify(wheels, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'via-mis-datos.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="h-48 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Perfil</h1>

      {/* Profile info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Información personal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Tu nombre"
            />
          </div>
          <Button size="sm" onClick={handleSaveProfile} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preferencias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
              <div>
                <p className="text-sm font-medium">Modo oscuro</p>
                <p className="text-xs text-muted-foreground">
                  {theme === 'dark' ? 'Activado' : 'Desactivado'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? 'Desactivar' : 'Activar'}
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {profile?.reminders_enabled ? (
                <Bell className="h-4 w-4" />
              ) : (
                <BellOff className="h-4 w-4" />
              )}
              <div>
                <p className="text-sm font-medium">Recordatorios</p>
                <p className="text-xs text-muted-foreground">
                  Recibe un recordatorio cada 6 meses
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleReminders}
            >
              {profile?.reminders_enabled ? 'Desactivar' : 'Activar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" size="sm" className="w-full" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar mis datos (JSON)
          </Button>

          <Separator />

          <form action={logoutAction}>
            <Button variant="ghost" size="sm" className="w-full text-destructive" type="submit">
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
