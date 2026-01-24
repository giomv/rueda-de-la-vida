'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Plus, GripVertical } from 'lucide-react';
import { DOMAIN_SUGGESTIONS } from '@/lib/utils/domain-suggestions';
import type { Domain } from '@/lib/types';

interface DomainListProps {
  domains: Domain[];
  onAdd: (name: string, icon: string) => void;
  onRemove: (domainId: string) => void;
  onRename: (domainId: string, name: string) => void;
}

export function DomainList({ domains, onAdd, onRemove, onRename }: DomainListProps) {
  const [newDomain, setNewDomain] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const availableSuggestions = DOMAIN_SUGGESTIONS.filter(
    (s) => !domains.some((d) => d.name === s.name)
  );

  const handleAdd = () => {
    if (newDomain.trim() && domains.length < 10) {
      onAdd(newDomain.trim(), '📌');
      setNewDomain('');
    }
  };

  const handleSuggestionClick = (suggestion: typeof DOMAIN_SUGGESTIONS[0]) => {
    if (domains.length < 10) {
      onAdd(suggestion.name, suggestion.icon);
    }
  };

  const handleStartEdit = (domain: Domain) => {
    setEditingId(domain.id);
    setEditValue(domain.name);
  };

  const handleSaveEdit = (domainId: string) => {
    if (editValue.trim()) {
      onRename(domainId, editValue.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Current domains */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">
            Tus dominios ({domains.length}/10)
          </h3>
          {domains.length < 4 && (
            <span className="text-xs text-destructive">Mínimo 4 dominios</span>
          )}
        </div>

        <div className="space-y-1.5">
          {domains.map((domain) => (
            <div
              key={domain.id}
              className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card group"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              <span className="text-lg">{domain.icon}</span>
              {editingId === domain.id ? (
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleSaveEdit(domain.id)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(domain.id)}
                  className="h-7 text-sm"
                  autoFocus
                />
              ) : (
                <span
                  className="flex-1 text-sm cursor-pointer"
                  onDoubleClick={() => handleStartEdit(domain)}
                >
                  {domain.name}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemove(domain.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Add custom domain */}
      {domains.length < 10 && (
        <div className="flex gap-2">
          <Input
            placeholder="Agregar dominio personalizado..."
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1"
          />
          <Button size="sm" onClick={handleAdd} disabled={!newDomain.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Suggestions */}
      {availableSuggestions.length > 0 && domains.length < 10 && (
        <div className="space-y-2">
          <h4 className="text-sm text-muted-foreground">Sugerencias</h4>
          <div className="flex flex-wrap gap-2">
            {availableSuggestions.map((suggestion) => (
              <Badge
                key={suggestion.name}
                variant="outline"
                className="cursor-pointer hover:bg-accent transition-colors py-1.5 px-3"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion.icon} {suggestion.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
