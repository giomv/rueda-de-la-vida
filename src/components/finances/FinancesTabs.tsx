'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FINANCES_TABS } from '@/lib/types/finances';

interface FinancesTabsProps {
  className?: string;
}

export function FinancesTabs({ className }: FinancesTabsProps) {
  const pathname = usePathname();

  return (
    <div className={cn('flex gap-1 p-1 bg-muted rounded-lg', className)}>
      {FINANCES_TABS.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={cn(
              'flex-1 py-2 px-4 text-sm font-medium rounded-md text-center transition-colors',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
