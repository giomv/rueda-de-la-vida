'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { formatCurrencyWithDecimals } from '@/lib/utils/format-currency';
import { deleteExpense } from '@/lib/actions/finances-actions';
import type { ExpenseWithRelations } from '@/lib/types/finances';

interface ExpenseCardProps {
  expense: ExpenseWithRelations;
  onDelete?: () => void;
  className?: string;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function ExpenseCard({ expense, onDelete, className }: ExpenseCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteExpense(expense.id);
      onDelete?.();
    } catch (error) {
      console.error('Error deleting expense:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Card className={cn('', className)}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg">
                  {formatCurrencyWithDecimals(expense.amount)}
                </span>
                {expense.budget_account && (
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                    {expense.budget_account.name}
                  </span>
                )}
              </div>
              {expense.note && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {expense.note}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span>{formatDate(expense.date)}</span>
                {expense.domain && (
                  <span className="flex items-center gap-1">
                    {expense.domain.icon} {expense.domain.name}
                  </span>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/finanzas/gasto/${expense.id}`}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar gasto</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estas seguro de que deseas eliminar este gasto? Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
