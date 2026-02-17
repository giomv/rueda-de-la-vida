'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { SessionCard } from '@/components/journal/SessionCard';
import { listSessions } from '@/lib/actions/journal-actions';
import { listSharedSpaces } from '@/lib/actions/space-actions';
import { getUserDomains } from '@/lib/actions/domain-actions';
import type { SessionListItem, SessionListFilters } from '@/lib/types/journal';
import type { SharedSpace } from '@/lib/types/journal';
import type { LifeDomain } from '@/lib/types';

export default function SesionesPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    }>
      <SesionesContent />
    </Suspense>
  );
}

function SesionesContent() {
  const searchParams = useSearchParams();
  const initialSpaceId = searchParams.get('spaceId');

  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [domains, setDomains] = useState<LifeDomain[]>([]);
  const [spaces, setSpaces] = useState<SharedSpace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [ownershipFilter, setOwnershipFilter] = useState<'all' | 'mine' | 'shared'>(
    initialSpaceId ? 'shared' : 'all'
  );
  const [spaceFilter, setSpaceFilter] = useState<string>(initialSpaceId || 'ALL');
  const [domainFilter, setDomainFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const buildFilters = useCallback((): SessionListFilters => {
    const filters: SessionListFilters = { limit: 20 };
    if (ownershipFilter !== 'all') filters.ownership = ownershipFilter;
    if (ownershipFilter === 'shared' && spaceFilter !== 'ALL') filters.spaceId = spaceFilter;
    if (domainFilter !== 'ALL') filters.domain_id = domainFilter;
    if (debouncedSearch.trim()) filters.search = debouncedSearch.trim();
    return filters;
  }, [ownershipFilter, spaceFilter, domainFilter, debouncedSearch]);

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters = buildFilters();
      const result = await listSessions(filters);
      setSessions(result.items);
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch {
      // Error handled silently - empty state will show
    } finally {
      setIsLoading(false);
    }
  }, [buildFilters]);

  const loadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const filters = buildFilters();
      filters.cursor = nextCursor;
      const result = await listSessions(filters);
      setSessions((prev) => [...prev, ...result.items]);
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch {
      // Error handled silently
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Load domains and spaces once
  useEffect(() => {
    Promise.all([
      getUserDomains(),
      listSharedSpaces(),
    ]).then(([d, s]) => {
      setDomains(d);
      setSpaces(s);
    }).catch(() => {});
  }, []);

  // Reload on filter change
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const clearFilters = () => {
    setOwnershipFilter('all');
    setSpaceFilter('ALL');
    setDomainFilter('ALL');
    setSearchTerm('');
  };

  const hasActiveFilters =
    ownershipFilter !== 'all' ||
    domainFilter !== 'ALL' ||
    searchTerm.trim() !== '';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bitácora</h1>
        <Button asChild>
          <Link href="/bitacora/sesion/nueva">
            <Plus className="h-4 w-4" />
            Nueva sesión
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          <Select
            value={ownershipFilter}
            onValueChange={(v) => {
              setOwnershipFilter(v as 'all' | 'mine' | 'shared');
              if (v !== 'shared') setSpaceFilter('ALL');
            }}
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="mine">Mis sesiones</SelectItem>
              <SelectItem value="shared">Compartidas conmigo</SelectItem>
            </SelectContent>
          </Select>

          {ownershipFilter === 'shared' && spaces.length > 0 && (
            <Select value={spaceFilter} onValueChange={setSpaceFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos los espacios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los espacios</SelectItem>
                {spaces.map((space) => (
                  <SelectItem key={space.id} value={space.id}>
                    {space.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={domainFilter} onValueChange={setDomainFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Dominio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los dominios</SelectItem>
              {domains.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.icon && <span className="mr-1">{d.icon}</span>}
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar sesiones..."
            className="pl-9 pr-9"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          {hasActiveFilters ? (
            <>
              <p className="text-muted-foreground">
                No se encontraron sesiones con estos filtros.
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            </>
          ) : (
            <>
              <p className="text-muted-foreground">
                No tienes sesiones registradas.
              </p>
              <p className="text-sm text-muted-foreground">
                Registra tu primera sesión para llevar un historial ordenado.
              </p>
              <Button asChild>
                <Link href="/bitacora/sesion/nueva">Nueva sesión</Link>
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}

          {hasMore && (
            <div className="pt-2 text-center">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? 'Cargando...' : 'Cargar más'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
