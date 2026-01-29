'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MoreVertical, Edit, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { updateBudgetAccount, deleteBudgetAccount } from '@/lib/actions/finances-actions';
import type { BudgetAccountWithActual } from '@/lib/types/finances';

interface BudgetAccountRowProps {
  account: BudgetAccountWithActual;
  onUpdate?: () => void;
  onEdit?: (account: BudgetAccountWithActual) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function BudgetAccountRow({ account, onUpdate, onEdit }: BudgetAccountRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [baseBudget, setBaseBudget] = useState(account.base_budget.toString());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateBudgetAccount(account.id, {
        base_budget: parseFloat(baseBudget) || 0,
      });
      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating account:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteBudgetAccount(account.id);
      setShowDeleteDialog(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting account:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const remaining = account.base_budget - account.actual;
  const isOverBudget = remaining < 0;

  return (
    <>
      <tr className="border-b">
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">{account.name}</span>
            {account.transactionCount > 0 && (
              <Link
                href={`/finanzas/cuenta/${account.id}`}
                className="text-xs text-muted-foreground hover:text-primary"
              >
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
        </td>
        <td className="py-3 px-4 text-right">
          {isEditing ? (
            <div className="flex items-center justify-end gap-2">
              <Input
                type="number"
                value={baseBudget}
                onChange={(e) => setBaseBudget(e.target.value)}
                className="w-24 text-right"
                autoFocus
              />
              <Button size="sm" onClick={handleSave} disabled={isLoading}>
                OK
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setBaseBudget(account.base_budget.toString());
                  setIsEditing(false);
                }}
              >
                X
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="hover:underline"
            >
              {formatCurrency(account.base_budget)}
            </button>
          )}
        </td>
        <td className="py-3 px-4 text-right">
          {formatCurrency(account.actual)}
        </td>
        <td
          className={cn(
            'py-3 px-4 text-right font-medium',
            isOverBudget
              ? 'text-red-600 dark:text-red-400'
              : 'text-green-600 dark:text-green-400'
          )}
        >
          {formatCurrency(remaining)}
        </td>
        <td className="py-3 px-4 text-right">
          {!account.is_otros_account && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(account)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </td>
      </tr>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar cuenta</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estas seguro de que deseas eliminar "{account.name}"? Los gastos asociados se reasignaran a "Otros".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isLoading}>
              {isLoading ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
