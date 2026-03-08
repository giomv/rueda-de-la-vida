'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  CircleDot,
  User,
  Users,
  HelpCircle,
  Map,
  LogOut,
  Moon,
  Sun,
  ListChecks,
  Wallet,
  Gauge,
  BookOpen,
  Shield,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { cn, getHomePathForRole } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/lib/types';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Gauge },
  { href: '/mi-plan', label: 'Mi Plan', icon: ListChecks },
  { href: '/finanzas', label: 'Finanzas', icon: Wallet },
  { href: '/bitacora', label: 'Bitácora', icon: BookOpen },
  { href: '/espacios', label: 'Espacios', icon: Users },
  { href: '/mis-ruedas', label: 'Mis Ruedas', icon: CircleDot },
  { href: '/plan-de-vida', label: 'Plan de Vida', icon: Map },
  { href: '/perfil', label: 'Perfil', icon: User },
  { href: '/ayuda', label: 'Ayuda', icon: HelpCircle },
];

const specialistNavItems = [
  { href: '/especialista', label: 'Escritorio', icon: Gauge },
  { href: '/especialista/usuarios', label: 'Mis Usuarios', icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('user');

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  useEffect(() => {
    setMounted(true);

    async function checkRole() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile?.role) setUserRole(profile.role as UserRole);
      }
    }
    checkRole();
  }, []);

  const homeHref = getHomePathForRole(userRole);

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card h-screen sticky top-0">
      <div className="p-6">
        <Link href={homeHref} className="flex items-center gap-2">
          <CircleDot className="h-8 w-8 text-primary" />
          <span className="font-bold text-xl">VIA</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {userRole === 'admin' ? (
          <Link
            href="/admin"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === '/admin' || pathname.startsWith('/admin/')
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Shield className="h-5 w-5" />
            Panel Admin
          </Link>
        ) : userRole === 'specialist' ? (
          specialistNavItems.map((item) => {
            const isActive = item.href === '/especialista'
              ? pathname === '/especialista'
              : pathname.startsWith(item.href);
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
          })
        ) : (
          navItems.map((item) => {
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
          })
        )}
      </nav>

      <div className="p-4 border-t border-border space-y-1">
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
        {(userRole === 'admin' || userRole === 'specialist') && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        )}
      </div>
    </aside>
  );
}
