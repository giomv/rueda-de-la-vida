'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from './KPICard';
import { AnnualTrendChart } from './AnnualTrendChart';
import { MONTH_NAMES } from '@/lib/types/finances';
import { formatCurrency } from '@/lib/utils/format-currency';
import type { AnnualSummary as AnnualSummaryType } from '@/lib/types/finances';

interface AnnualSummaryProps {
  summary: AnnualSummaryType;
}

export function AnnualSummary({ summary }: AnnualSummaryProps) {
  return (
    <div className="space-y-6">
      {/* Annual KPI */}
      <KPICard label="Balance anual" value={summary.totals.remaining} />

      {/* Annual totals */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Ingresos</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(summary.totals.income.base)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Gastos</p>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(summary.totals.expense.actual)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Ahorros</p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(summary.totals.savings.base)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trend chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gastos por mes</CardTitle>
        </CardHeader>
        <CardContent>
          <AnnualTrendChart data={summary.monthlyTrend} />
        </CardContent>
      </Card>

      {/* Top expense accounts */}
      {summary.topAccounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top gastos del año</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.topAccounts.map((account, index) => (
                <div key={account.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-sm w-6">
                      #{index + 1}
                    </span>
                    <span className="font-medium">{account.name}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(account.actual)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly breakdown table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalle mensual</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-2 px-4 font-medium">Mes</th>
                  <th className="text-right py-2 px-4 font-medium">Ingresos</th>
                  <th className="text-right py-2 px-4 font-medium">Gastos</th>
                  <th className="text-right py-2 px-4 font-medium">Ahorros</th>
                  <th className="text-right py-2 px-4 font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {summary.months.map((month) => (
                  <tr key={month.month} className="border-b">
                    <td className="py-2 px-4">{MONTH_NAMES[month.month - 1]}</td>
                    <td className="py-2 px-4 text-right text-green-600 dark:text-green-400">
                      {formatCurrency(month.income.base)}
                    </td>
                    <td className="py-2 px-4 text-right text-red-600 dark:text-red-400">
                      {formatCurrency(month.expense.actual)}
                    </td>
                    <td className="py-2 px-4 text-right text-blue-600 dark:text-blue-400">
                      {formatCurrency(month.savings.base)}
                    </td>
                    <td
                      className={`py-2 px-4 text-right font-medium ${
                        month.remaining >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {formatCurrency(month.remaining)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
