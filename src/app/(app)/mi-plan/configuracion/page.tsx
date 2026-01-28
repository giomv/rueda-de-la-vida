'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Download, RefreshCw, Archive, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ImportDialog } from '@/components/lifeplan';
import { getImportStatus } from '@/lib/actions/import-actions';
import { getAllActivities, deleteActivity } from '@/lib/actions/lifeplan-actions';
import type { LifePlanActivity } from '@/lib/types/lifeplan';

export default function ConfiguracionPage() {
  const router = useRouter();

  const [showImport, setShowImport] = useState(false);
  const [importStatus, setImportStatus] = useState<{ fromWheel: number; fromOdyssey: number; manual: number } | null>(null);
  const [archivedActivities, setArchivedActivities] = useState<LifePlanActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [status, allActivities] = await Promise.all([
          getImportStatus(),
          getAllActivities(),
        ]);

        setImportStatus(status);
        setArchivedActivities(allActivities.filter((a) => a.is_archived));
      } catch (error) {
        console.error('Error loading config:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleDeleteArchived = async () => {
    if (!confirm(`¿Estás seguro de eliminar ${archivedActivities.length} acciones archivadas? Esta acción no se puede deshacer.`)) {
      return;
    }

    for (const activity of archivedActivities) {
      await deleteActivity(activity.id);
    }
    setArchivedActivities([]);
  };

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-40 bg-muted rounded-lg w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push('/mi-plan/hoy')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">Configuración</h1>
      </div>

      {/* Import status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="w-5 h-5" />
            Sincronización
          </CardTitle>
          <CardDescription>
            Importa acciones desde Rueda de la Vida y Plan de vida
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {importStatus && (
            <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Desde Rueda:</span>
                <span className="font-medium">{importStatus.fromWheel} acciones</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Desde Plan de vida:</span>
                <span className="font-medium">{importStatus.fromOdyssey} acciones</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Creadas manualmente:</span>
                <span className="font-medium">{importStatus.manual} acciones</span>
              </div>
            </div>
          )}

          <Button onClick={() => setShowImport(true)} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sincronizar ahora
          </Button>
        </CardContent>
      </Card>

      {/* Archived activities */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Acciones archivadas
          </CardTitle>
          <CardDescription>
            {archivedActivities.length} acciones en archivo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {archivedActivities.length > 0 ? (
            <Button
              variant="destructive"
              onClick={handleDeleteArchived}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar todas las archivadas
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay acciones archivadas
            </p>
          )}
        </CardContent>
      </Card>

      {/* Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Enlaces rápidos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => router.push('/mi-plan/metas')}
          >
            Ver todas las metas
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => router.push('/mi-plan/checkin')}
          >
            Check-in semanal
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => router.push('/mis-ruedas')}
          >
            Mis Ruedas de la Vida
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => router.push('/plan-de-vida')}
          >
            Plan de vida
          </Button>
        </CardContent>
      </Card>

      {/* Import dialog */}
      <ImportDialog
        open={showImport}
        onOpenChange={setShowImport}
        onImportComplete={async () => {
          const status = await getImportStatus();
          setImportStatus(status);
        }}
      />
    </div>
  );
}
