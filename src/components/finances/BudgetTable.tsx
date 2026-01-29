'use client';

import { useState, Fragment } from 'react';
import { Plus, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BudgetAccountRow } from './BudgetAccountRow';
import { BudgetAccountForm } from './BudgetAccountForm';
import { KPICard } from './KPICard';
import { OverspendingAlert } from './OverspendingAlert';
import { copyBudgetFromPreviousMonth } from '@/lib/actions/finances-actions';
import type { BudgetSummary, BudgetAccountWithActual, BudgetCategory } from '@/lib/types/finances';

interface BudgetTableProps {
  summary: BudgetSummary;
  onRefresh: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const categoryOrder: BudgetCategory[] = ['INCOME', 'EXPENSE', 'SAVINGS'];
const categoryLabels: Record<BudgetCategory, string> = {
  INCOME: 'Ingresos',
  EXPENSE: 'Gastos',
  SAVINGS: 'Ahorros',
};
const categoryColors: Record<BudgetCategory, string> = {
  INCOME: 'bg-green-100 dark:bg-green-900/30',
  EXPENSE: 'bg-red-100 dark:bg-red-900/30',
  SAVINGS: 'bg-blue-100 dark:bg-blue-900/30',
};

export function BudgetTable({ summary, onRefresh }: BudgetTableProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BudgetAccountWithActual | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  // Group accounts by category
  const accountsByCategory = categoryOrder.reduce((acc, category) => {
    acc[category] = summary.accounts
      .filter((a) => a.category === category)
      .sort((a, b) => {
        // Put "Otros" at the end
        if (a.is_otros_account) return 1;
        if (b.is_otros_account) return -1;
        return a.order_position - b.order_position;
      });
    return acc;
  }, {} as Record<BudgetCategory, BudgetAccountWithActual[]>);

  const handleCopyFromPrevious = async () => {
    setIsCopying(true);
    try {
      await copyBudgetFromPreviousMonth(summary.budget.year, summary.budget.month);
      onRefresh();
    } catch (error) {
      console.error('Error copying budget:', error);
    } finally {
      setIsCopying(false);
    }
  };

  // Check if budget is mostly empty (only has "Otros" account)
  const hasOnlyOtros = summary.accounts.length === 1 && summary.accounts[0].is_otros_account;

  return (
    <div className="space-y-6">
      {/* KPI Card */}
      <KPICard label="Me quedan" value={summary.remaining} />

      {/* Overspending alert */}
      {summary.isOverspending && <OverspendingAlert />}

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva cuenta
        </Button>
        {hasOnlyOtros && (
          <Button variant="outline" onClick={handleCopyFromPrevious} disabled={isCopying}>
            <Copy className="h-4 w-4 mr-2" />
            {isCopying ? 'Copiando...' : 'Copiar del mes anterior'}
          </Button>
        )}
      </div>

      {/* Budget Table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4 font-medium">Cuenta</th>
                <th className="text-right py-3 px-4 font-medium">Base</th>
                <th className="text-right py-3 px-4 font-medium">Actual</th>
                <th className="text-right py-3 px-4 font-medium">Restante</th>
                <th className="py-3 px-4 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {categoryOrder.map((category) => {
                const accounts = accountsByCategory[category];
                const categoryTotal = accounts.reduce(
                  (acc, a) => ({
                    base: acc.base + a.base_budget,
                    actual: acc.actual + a.actual,
                  }),
                  { base: 0, actual: 0 }
                );

                return (
                  <Fragment key={category}>
                    {/* Category header */}
                    <tr className={categoryColors[category]}>
                      <td colSpan={5} className="py-2 px-4 font-semibold">
                        {categoryLabels[category]}
                      </td>
                    </tr>
                    {/* Accounts */}
                    {accounts.map((account) => (
                      <BudgetAccountRow
                        key={account.id}
                        account={account}
                        onUpdate={onRefresh}
                        onEdit={setEditingAccount}
                      />
                    ))}
                    {/* Category subtotal */}
                    {accounts.length > 0 && (
                      <tr className="border-b bg-muted/30">
                        <td className="py-2 px-4 text-sm text-muted-foreground">
                          Subtotal {categoryLabels[category]}
                        </td>
                        <td className="py-2 px-4 text-right font-medium">
                          {formatCurrency(categoryTotal.base)}
                        </td>
                        <td className="py-2 px-4 text-right font-medium">
                          {formatCurrency(categoryTotal.actual)}
                        </td>
                        <td className="py-2 px-4 text-right font-medium">
                          {formatCurrency(categoryTotal.base - categoryTotal.actual)}
                        </td>
                        <td></td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Add account form */}
      <BudgetAccountForm
        budgetId={summary.budget.id}
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSuccess={onRefresh}
      />

      {/* Edit account form */}
      {editingAccount && (
        <BudgetAccountForm
          budgetId={summary.budget.id}
          account={editingAccount}
          open={!!editingAccount}
          onOpenChange={(open) => !open && setEditingAccount(null)}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
}
