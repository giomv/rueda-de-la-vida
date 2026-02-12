import Link from 'next/link';
import { CircleDot } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <CircleDot className="h-7 w-7 text-primary" />
            <span className="font-bold text-xl">VIA</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/#modelos"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline"
            >
              Modelos
            </Link>
            <Link
              href="/#faq"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline"
            >
              FAQ
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Iniciar sesión
              </Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>VIA — Diseña tu vida con intención.</p>
        </div>
      </footer>
    </div>
  );
}
