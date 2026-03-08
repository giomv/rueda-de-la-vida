'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { InviteUserDialog } from '@/components/specialist/InviteUserDialog';
import { SpecialistUserCard } from '@/components/specialist/SpecialistUserCard';
import { searchMyUsers } from '@/lib/actions/specialist-actions';
import type { SpecialistUserListItem } from '@/lib/types/specialist';

export default function UsuariosPage() {
  const [users, setUsers] = useState<SpecialistUserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await searchMyUsers(debouncedSearch);
      setUsers(result);
    } catch {
      // Empty state will show
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis Usuarios</h1>
        <InviteUserDialog onInvited={loadUsers} />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre o correo..."
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

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          {searchTerm ? (
            <p className="text-muted-foreground">No se encontraron usuarios.</p>
          ) : (
            <>
              <p className="text-muted-foreground">No tienes usuarios vinculados.</p>
              <p className="text-sm text-muted-foreground">
                Invita a tus usuarios usando su correo electronico.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((item) => (
            <SpecialistUserCard key={item.relation.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
