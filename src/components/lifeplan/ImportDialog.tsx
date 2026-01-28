'use client';

import { useState } from 'react';
import { RefreshCw, Download, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { syncLifePlanActivities } from '@/lib/actions/import-actions';
import type { ImportResult } from '@/lib/types/lifeplan';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: (result: ImportResult) => void;
}

export function ImportDialog({ open, onOpenChange, onImportComplete }: ImportDialogProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    setIsImporting(true);
    setError(null);

    try {
      const importResult = await syncLifePlanActivities();
      setResult(importResult);
      onImportComplete?.(importResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setError(null);
    onOpenChange(false);
  };

  const totalImported = result ? result.fromWheel + result.fromOdyssey : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Sincronizar acciones
          </DialogTitle>
          <DialogDescription>
            Importa automáticamente las acciones desde tu Rueda de la Vida y Plan de vida.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {error && (
            <div className="flex items-start gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg mb-4">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <span className="font-medium">Sincronización completa</span>
              </div>

              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Desde Rueda de la Vida:</span>
                  <span className="font-medium">{result.fromWheel} acciones</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Desde Plan de vida:</span>
                  <span className="font-medium">{result.fromOdyssey} acciones</span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between">
                  <span className="font-medium">Total importadas:</span>
                  <span className="font-bold text-primary">{totalImported}</span>
                </div>
              </div>

              {totalImported === 0 && (
                <p className="text-sm text-muted-foreground">
                  No se encontraron nuevas acciones para importar. Las acciones existentes no se duplican.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Esta acción buscará:
              </p>
              <ul className="text-sm space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    <strong>Rueda de la Vida:</strong> Acciones de tus planes de acción
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    <strong>Plan de vida:</strong> Pasos de tu prototipo activo
                  </span>
                </li>
              </ul>
              <p className="text-sm text-muted-foreground">
                Las acciones que ya hayas importado anteriormente no se duplicarán.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {result ? (
            <Button onClick={handleClose}>Cerrar</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleImport} disabled={isImporting}>
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Importar
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
