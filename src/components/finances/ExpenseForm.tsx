'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createExpense, updateExpense, getAccountsForMonth } from '@/lib/actions/finances-actions';
import { getUserDomains } from '@/lib/actions/domain-actions';
import type { BudgetAccount, Expense } from '@/lib/types/finances';
import type { LifeDomain } from '@/lib/types';

interface ExpenseFormProps {
  expense?: Expense;
  onSuccess?: () => void;
}

export function ExpenseForm({ expense, onSuccess }: ExpenseFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<BudgetAccount[]>([]);
  const [domains, setDomains] = useState<LifeDomain[]>([]);

  const today = new Date().toISOString().split('T')[0];
  const [amount, setAmount] = useState(expense?.amount?.toString() || '');
  const [date, setDate] = useState(expense?.date || today);
  const [accountId, setAccountId] = useState(expense?.budget_account_id || '__none__');
  const [domainId, setDomainId] = useState(expense?.domain_id || '__none__');
  const [note, setNote] = useState(expense?.note || '');

  // Load accounts and domains
  useEffect(() => {
    async function loadData() {
      const [year, month] = date.split('-').map(Number);
      const [accountsData, domainsData] = await Promise.all([
        getAccountsForMonth(year, month),
        getUserDomains(),
      ]);
      setAccounts(accountsData);
      setDomains(domainsData);
    }
    loadData();
  }, [date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    setIsLoading(true);
    try {
      const finalAccountId = accountId === '__none__' ? null : accountId;
      const finalDomainId = domainId === '__none__' ? null : domainId;

      if (expense) {
        await updateExpense(expense.id, {
          amount: parseFloat(amount),
          date,
          budget_account_id: finalAccountId,
          domain_id: finalDomainId,
          note: note || null,
        });
      } else {
        await createExpense({
          amount: parseFloat(amount),
          date,
          budget_account_id: finalAccountId,
          domain_id: finalDomainId,
          note: note || null,
        });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        // Reset form for new expense
        setAmount('');
        setNote('');
        router.refresh();
      }
    } catch (error) {
      console.error('Error saving expense:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="amount">Monto</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            $
          </span>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-7 text-2xl h-14"
            required
            autoFocus
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Fecha</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="account">Cuenta (opcional)</Label>
        <Select value={accountId} onValueChange={setAccountId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccionar cuenta..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Sin asignar (Otros)</SelectItem>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="domain">Dominio de vida (opcional)</Label>
        <Select value={domainId} onValueChange={setDomainId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccionar dominio..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Sin dominio</SelectItem>
            {domains.map((domain) => (
              <SelectItem key={domain.id} value={domain.id}>
                {domain.icon} {domain.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Nota (opcional)</Label>
        <Textarea
          id="note"
          placeholder="Descripcion del gasto..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {expense ? 'Guardar cambios' : 'Agregar gasto'}
      </Button>
    </form>
  );
}
