'use client';

import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getAccountsForMonth } from '@/lib/actions/finances-actions';
import { getUserDomains } from '@/lib/actions/domain-actions';
import type { BudgetAccount } from '@/lib/types/finances';
import type { LifeDomain } from '@/lib/types';

interface FinancesFiltersProps {
  startDate: string;
  endDate: string;
  accountId?: string;
  domainId?: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onAccountChange: (accountId: string) => void;
  onDomainChange: (domainId: string) => void;
}

export function FinancesFilters({
  startDate,
  endDate,
  accountId,
  domainId,
  onStartDateChange,
  onEndDateChange,
  onAccountChange,
  onDomainChange,
}: FinancesFiltersProps) {
  const [accounts, setAccounts] = useState<BudgetAccount[]>([]);
  const [domains, setDomains] = useState<LifeDomain[]>([]);

  useEffect(() => {
    async function loadData() {
      const [year, month] = startDate.split('-').map(Number);
      const [accountsData, domainsData] = await Promise.all([
        getAccountsForMonth(year, month),
        getUserDomains(),
      ]);
      setAccounts(accountsData);
      setDomains(domainsData);
    }
    loadData();
  }, [startDate]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="space-y-2">
        <Label htmlFor="startDate">Desde</Label>
        <Input
          id="startDate"
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="endDate">Hasta</Label>
        <Input
          id="endDate"
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Cuenta</Label>
        <Select value={accountId || '__all__'} onValueChange={(val) => onAccountChange(val === '__all__' ? '' : val)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas</SelectItem>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Dominio</Label>
        <Select value={domainId || '__all__'} onValueChange={(val) => onDomainChange(val === '__all__' ? '' : val)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            {domains.map((domain) => (
              <SelectItem key={domain.id} value={domain.id}>
                {domain.icon} {domain.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
