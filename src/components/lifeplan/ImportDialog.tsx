'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Download, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getImportSources, importSelectedSources } from '@/lib/actions/import-actions';
import type { ImportResult, ImportSources } from '@/lib/types/lifeplan';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: (result: ImportResult) => void;
}

export function ImportDialog({ open, onOpenChange, onImportComplete }: ImportDialogProps) {
  const [sources, setSources] = useState<ImportSources | null>(null);
  const [loadingSources, setLoadingSources] = useState(false);
  const [selectedWheelId, setSelectedWheelId] = useState<string | null>(null);
  const [selectedOdysseyId, setSelectedOdysseyId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset state and fetch sources when dialog opens
  useEffect(() => {
    if (!open) {
      // Reset all state when dialog closes (covers external close via prop)
      setSources(null);
      setLoadingSources(false);
      setSelectedWheelId(null);
      setSelectedOdysseyId(null);
      setResult(null);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchSources() {
      setLoadingSources(true);
      try {
        const data = await getImportSources();
        if (!cancelled) setSources(data);
      } catch {
        if (!cancelled) setError('Error al cargar las fuentes');
      } finally {
        if (!cancelled) setLoadingSources(false);
      }
    }

    fetchSources();
    return () => { cancelled = true; };
  }, [open]);

  const handleImport = async () => {
    setIsImporting(true);
    setError(null);

    try {
      const importResult = await importSelectedSources(selectedWheelId, selectedOdysseyId);
      setResult(importResult);
      onImportComplete?.(importResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const bothNone = !selectedWheelId && !selectedOdysseyId;
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
            Selecciona de dónde importar acciones a tu plan.
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
          ) : loadingSources ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                <div className="h-10 w-full bg-muted animate-pulse rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                <div className="h-10 w-full bg-muted animate-pulse rounded" />
              </div>
            </div>
          ) : sources ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Rueda de la Vida</Label>
                <Select
                  value={selectedWheelId ?? 'none'}
                  onValueChange={(v) => setSelectedWheelId(v === 'none' ? null : v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona una rueda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguna</SelectItem>
                    {sources.wheels.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.title || 'Sin título'} — {new Date(w.created_at).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Plan de vida (Odyssey)</Label>
                <Select
                  value={selectedOdysseyId ?? 'none'}
                  onValueChange={(v) => setSelectedOdysseyId(v === 'none' ? null : v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguno</SelectItem>
                    {sources.odysseys.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.title || 'Sin título'}
                        {o.active_plan_headline ? ` — ${o.active_plan_headline}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <p className="text-sm text-muted-foreground">
                Las acciones existentes no se duplicarán.
              </p>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          {result ? (
            <Button onClick={handleClose}>Cerrar</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleImport}
                disabled={isImporting || loadingSources || bothNone}
              >
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
