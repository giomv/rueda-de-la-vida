'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CircleDot, User, Users, Map, ListChecks, Wallet, Gauge, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Gauge },
  { href: '/mi-plan', label: 'Mi Plan', icon: ListChecks },
  { href: '/finanzas', label: 'Finanzas', icon: Wallet },
  { href: '/plan-de-vida', label: 'Plan de vida', icon: Map },
  { href: '/bitacora', label: 'Bitácora', icon: BookOpen },
  { href: '/espacios', label: 'Espacios', icon: Users },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
