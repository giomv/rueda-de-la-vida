'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExpenseList } from '@/components/finances';
import { getExpensesByAccount } from '@/lib/actions/finances-actions';
import type { ExpenseWithRelations } from '@/lib/types/finances';

export default function CuentaPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = use(params);
  const router = useRouter();
  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountName, setAccountName] = useState('');

  useEffect(() => {
    async function loadExpenses() {
      try {
        const data = await getExpensesByAccount(accountId);
        setExpenses(data);
        // Get account name from first expense
        if (data.length > 0 && data[0].budget_account) {
          setAccountName(data[0].budget_account.name);
        }
      } catch (error) {
        console.error('Error loading expenses:', error);
      } finally {
        setLoading(false);
      }
    }
    loadExpenses();
  }, [accountId]);

  const handleExpenseDelete = async () => {
    const data = await getExpensesByAccount(accountId);
    setExpenses(data);
  };

  // Calculate total
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{accountName || 'Cuenta'}</h1>
          <p className="text-sm text-muted-foreground">
            {expenses.length} transacciones
          </p>
        </div>
      </div>

      {/* Total */}
      <div className="mb-6 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">Total</p>
        <p className="text-2xl font-bold">
          ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Expense list */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-20 bg-muted rounded-lg" />
          <div className="h-20 bg-muted rounded-lg" />
          <div className="h-20 bg-muted rounded-lg" />
        </div>
      ) : (
        <ExpenseList expenses={expenses} onExpenseDelete={handleExpenseDelete} />
      )}
    </div>
  );
}
