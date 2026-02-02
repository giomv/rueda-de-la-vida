'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import type { LifeDomain } from '@/lib/types';

interface AddDomainDialogProps {
  availableDomains: LifeDomain[];
  onAddDomains: (domainIds: string[]) => void;
}

export function AddDomainDialog({ availableDomains, onAddDomains }: AddDomainDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleToggle = (domainId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(domainId)) {
        next.delete(domainId);
      } else {
        next.add(domainId);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (selectedIds.size > 0) {
      onAddDomains(Array.from(selectedIds));
      setSelectedIds(new Set());
      setOpen(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSelectedIds(new Set());
    }
  };

  if (availableDomains.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full mt-4">
          <Plus className="h-4 w-4 mr-2" />
          Anadir dominio
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Anadir dominios al dashboard</DialogTitle>
          <DialogDescription>
            Selecciona los dominios que quieres ver en tu dashboard
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[300px] overflow-y-auto">
          <div className="space-y-3">
            {availableDomains.map(domain => (
              <div key={domain.id} className="flex items-center space-x-3">
                <Checkbox
                  id={domain.id}
                  checked={selectedIds.has(domain.id)}
                  onCheckedChange={() => handleToggle(domain.id)}
                />
                <Label
                  htmlFor={domain.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {domain.icon && <span>{domain.icon}</span>}
                  <span>{domain.name}</span>
                </Label>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={selectedIds.size === 0}>
            Anadir ({selectedIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
