'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Target, Plus, X, Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FocusItem } from '@/lib/types/dashboard';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import { setFocusItem, removeFocusItem } from '@/lib/actions/dashboard-actions';

interface FocusCardProps {
  items: FocusItem[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function FocusCard({ items }: FocusCardProps) {
  const { year, month, domains, goals } = useDashboardStore();
  const [isOpen, setIsOpen] = useState(false);
  const [focusType, setFocusType] = useState<'domain' | 'goal'>('domain');
  const [selectedId, setSelectedId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const canAddMore = items.length < 3;

  const handleAddFocus = async () => {
    if (!selectedId) return;

    setIsLoading(true);
    try {
      await setFocusItem(year, month, focusType, selectedId);
      setIsOpen(false);
      setSelectedId('');
      // Trigger refresh via store
      window.location.reload();
    } catch {
      // Handle error silently
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFocus = async (focusId: string) => {
    try {
      await removeFocusItem(focusId);
      window.location.reload();
    } catch {
      // Handle error silently
    }
  };

  // Filter out already focused items
  const focusedDomainIds = new Set(items.filter(i => i.type === 'domain').map(i => i.domain?.id));
  const focusedGoalIds = new Set(items.filter(i => i.type === 'goal').map(i => i.goal?.id));
  const availableDomains = domains.filter(d => !focusedDomainIds.has(d.id));
  const availableGoals = goals.filter(g => !focusedGoalIds.has(g.id));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Mis focos del mes
          </CardTitle>
          {canAddMore && (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agregar foco del mes</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex gap-2">
                    <Button
                      variant={focusType === 'domain' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setFocusType('domain');
                        setSelectedId('');
                      }}
                    >
                      Dominio
                    </Button>
                    <Button
                      variant={focusType === 'goal' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setFocusType('goal');
                        setSelectedId('');
                      }}
                    >
                      Meta
                    </Button>
                  </div>

                  <RadioGroup value={selectedId} onValueChange={setSelectedId}>
                    {focusType === 'domain' ? (
                      availableDomains.length > 0 ? (
                        availableDomains.map((domain) => (
                          <div key={domain.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={domain.id} id={domain.id} />
                            <Label htmlFor={domain.id} className="flex items-center gap-2 cursor-pointer">
                              {domain.icon && <span>{domain.icon}</span>}
                              {domain.name}
                            </Label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No hay dominios disponibles</p>
                      )
                    ) : (
                      availableGoals.length > 0 ? (
                        availableGoals.map((goal) => (
                          <div key={goal.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={goal.id} id={goal.id} />
                            <Label htmlFor={goal.id} className="cursor-pointer">
                              {goal.title}
                            </Label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No hay metas disponibles</p>
                      )
                    )}
                  </RadioGroup>

                  <Button
                    className="w-full"
                    onClick={handleAddFocus}
                    disabled={!selectedId || isLoading}
                  >
                    {isLoading ? 'Agregando...' : 'Agregar foco'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Agrega hasta 3 focos para este mes
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-lg bg-muted/50 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.type === 'domain' && item.domain?.icon && (
                    <span>{item.domain.icon}</span>
                  )}
                  <span className="font-medium text-sm">
                    {item.type === 'domain' ? item.domain?.name : item.goal?.title}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleRemoveFocus(item.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              {item.topActions.length > 0 && (
                <div className="space-y-1">
                  {item.topActions.slice(0, 3).map((action) => (
                    <div
                      key={action.id}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <Check className={cn(
                        'h-3 w-3',
                        action.completed ? 'text-green-500' : 'text-muted-foreground/30'
                      )} />
                      <span className={action.completed ? 'line-through' : ''}>
                        {action.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                <span>Gastado: {formatCurrency(item.spent)}</span>
                <span>Ahorrado: {formatCurrency(item.saved)}</span>
              </div>

              <Button variant="ghost" size="sm" className="w-full h-7 text-xs" asChild>
                <Link href={item.type === 'domain'
                  ? `/dashboard?domain=${item.domain?.id}`
                  : `/dashboard?goal=${item.goal?.id}`
                }>
                  Ir a foco
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
          ))
        )}

        {items.length >= 3 && (
          <p className="text-xs text-muted-foreground text-center">
            Maximo 3 focos por mes
          </p>
        )}
      </CardContent>
    </Card>
  );
}
