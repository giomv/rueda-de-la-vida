'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createBudgetAccount, updateBudgetAccount } from '@/lib/actions/finances-actions';
import { BUDGET_CATEGORIES } from '@/lib/types/finances';
import type { BudgetAccount, BudgetCategory } from '@/lib/types/finances';

interface BudgetAccountFormProps {
  budgetId: string;
  account?: BudgetAccount;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BudgetAccountForm({
  budgetId,
  account,
  open,
  onOpenChange,
  onSuccess,
}: BudgetAccountFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(account?.name || '');
  const [category, setCategory] = useState<BudgetCategory>(account?.category || 'EXPENSE');
  const [baseBudget, setBaseBudget] = useState(account?.base_budget?.toString() || '0');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      if (account) {
        await updateBudgetAccount(account.id, {
          name,
          category,
          base_budget: parseFloat(baseBudget) || 0,
        });
      } else {
        await createBudgetAccount(budgetId, {
          name,
          category,
          base_budget: parseFloat(baseBudget) || 0,
        });
      }
      onSuccess?.();
      onOpenChange(false);
      // Reset form
      setName('');
      setCategory('EXPENSE');
      setBaseBudget('0');
    } catch (error) {
      console.error('Error saving account:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {account ? 'Editar cuenta' : 'Nueva cuenta'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Comida, Transporte, Salario..."
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as BudgetCategory)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUDGET_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.key} value={cat.key}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseBudget">Presupuesto base</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="baseBudget"
                type="number"
                step="0.01"
                min="0"
                value={baseBudget}
                onChange={(e) => setBaseBudget(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {account ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
