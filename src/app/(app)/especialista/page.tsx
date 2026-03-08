'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Calendar, Plus, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getSpecialistDashboard } from '@/lib/actions/specialist-actions';

interface DashboardData {
  displayName: string;
  activeUsersCount: number;
  sessionsThisMonth: number;
  recentUsers: { id: string; display_name: string | null; email: string | null }[];
}

export default function EscritorioPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getSpecialistDashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
        </div>
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Bienvenido, {data?.displayName}
        </h1>
        <p className="text-muted-foreground">Escritorio de especialista</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data?.activeUsersCount ?? 0}</p>
              <p className="text-sm text-muted-foreground">Usuarios activos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data?.sessionsThisMonth ?? 0}</p>
              <p className="text-sm text-muted-foreground">Sesiones este mes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button asChild>
          <Link href="/especialista/usuarios">
            <Users className="h-4 w-4" />
            Ver todos mis usuarios
          </Link>
        </Button>
      </div>

      {/* Recent Users */}
      {data?.recentUsers && data.recentUsers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Usuarios recientes</h2>
          <div className="space-y-2">
            {data.recentUsers.map((user) => (
              <Link key={user.id} href={`/especialista/usuarios/${user.id}`}>
                <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{user.display_name || 'Sin nombre'}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
