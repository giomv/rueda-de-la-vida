'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CircleDot,
  GitCompareArrows,
  Heart,
  User,
  HelpCircle,
  Map,
  Moon,
  Sun,
  ListChecks,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/inicio', label: 'Inicio', icon: LayoutDashboard },
  { href: '/mi-plan', label: 'Mi Plan', icon: ListChecks },
  { href: '/mis-ruedas', label: 'Mis Ruedas', icon: CircleDot },
  { href: '/plan-de-vida', label: 'Plan de Vida', icon: Map },
  { href: '/comparar', label: 'Comparar', icon: GitCompareArrows },
  { href: '/pareja', label: 'Pareja', icon: Heart },
  { href: '/perfil', label: 'Perfil', icon: User },
  { href: '/ayuda', label: 'Ayuda', icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card h-screen sticky top-0">
      <div className="p-6">
        <Link href="/inicio" className="flex items-center gap-2">
          <CircleDot className="h-8 w-8 text-primary" />
          <span className="font-bold text-xl">VIA</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        {mounted && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          </Button>
        )}
      </div>
    </aside>
  );
}
