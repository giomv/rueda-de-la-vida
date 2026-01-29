'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExpenseForm } from '@/components/finances';
import { getExpense } from '@/lib/actions/finances-actions';
import type { Expense } from '@/lib/types/finances';

export default function EditExpensePage({
  params,
}: {
  params: Promise<{ expenseId: string }>;
}) {
  const { expenseId } = use(params);
  const router = useRouter();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExpense() {
      try {
        const data = await getExpense(expenseId);
        setExpense(data);
      } catch (error) {
        console.error('Error loading expense:', error);
      } finally {
        setLoading(false);
      }
    }
    loadExpense();
  }, [expenseId]);

  const handleSuccess = () => {
    router.push('/finanzas/historial');
  };

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-1/4" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Gasto no encontrado</p>
          <Button onClick={() => router.push('/finanzas/historial')}>
            Volver al historial
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Editar gasto</h1>
      </div>

      {/* Edit form */}
      <ExpenseForm expense={expense} onSuccess={handleSuccess} />
    </div>
  );
}
