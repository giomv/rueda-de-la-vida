'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Plus, Star, Trash2, Link as LinkIcon, Users, Globe, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useJournalStore } from '@/lib/stores/journal-store';
import { getTypeSuggestions } from '@/lib/actions/journal-actions';
import { listSharedSpaces } from '@/lib/actions/space-actions';
import type { LifeDomain } from '@/lib/types';
import type { Goal } from '@/lib/types/lifeplan';
import { FREQUENCY_OPTIONS } from '@/lib/types/lifeplan';
import type { SessionWithRelations, CreateSessionInput, SharedSpace } from '@/lib/types/journal';
import { SESSION_TYPE_OPTIONS } from '@/lib/types/journal';
import { cn } from '@/lib/utils';

interface SessionFormProps {
  domains: LifeDomain[];
  goals: Goal[];
  session?: SessionWithRelations;
  onSave: (input: CreateSessionInput) => void;
  onCancel: () => void;
  isSaving: boolean;
  isOwner?: boolean;
}

export function SessionForm({
  domains,
  goals,
  session,
  onSave,
  onCancel,
  isSaving,
  isOwner = true,
}: SessionFormProps) {
  const store = useJournalStore();

  // Type suggestions
  const [typeSuggestions, setTypeSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const typeInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Share toggle
  const [isSharing, setIsSharing] = useState(false);
  const [spaces, setSpaces] = useState<SharedSpace[]>([]);
  const [spacesLoaded, setSpacesLoaded] = useState(false);

  // Hydrate on mount for edit mode
  useEffect(() => {
    if (session) {
      store.hydrate(session);
      setIsSharing(!!session.shared_space_id);
    } else {
      store.reset();
      setIsSharing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  // Load spaces when share toggle is turned on
  useEffect(() => {
    if (isSharing && !spacesLoaded) {
      listSharedSpaces()
        .then((s) => {
          // Only show spaces with accepted members
          setSpaces(s);
          setSpacesLoaded(true);
        })
        .catch(() => setSpacesLoaded(true));
    }
  }, [isSharing, spacesLoaded]);

  // Fetch type suggestions with debounce
  const fetchSuggestions = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const suggestions = await getTypeSuggestions({
          query,
          spaceId: store.sharedSpaceId,
        });
        setTypeSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } catch {
        setTypeSuggestions([]);
      }
    }, 300);
  }, [store.sharedSpaceId]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        typeInputRef.current &&
        !typeInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show per-item visibility toggles when sharing (owner or collaborator)
  const showShareToggles = isSharing;

  const filteredGoals = store.domainId
    ? goals.filter((g) => g.domain_id === store.domainId || !g.domain_id)
    : goals;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const input: CreateSessionInput = {
      type: store.type,
      date: store.date,
      title: store.title || undefined,
      provider_name: store.providerName || undefined,
      notes: store.notes || undefined,
      duration_minutes: store.durationMinutes ? parseInt(store.durationMinutes) : undefined,
      domain_id: store.domainId,
      goal_id: store.goalId,
      visibility: store.visibility,
      insights: store.insights.filter((i) => i.text.trim()),
      actions: store.actions.filter((a) => a.text.trim()),
      attachments: store.attachments.filter((a) => a.url?.trim()),
      sharedSpaceId: isSharing ? store.sharedSpaceId : null,
    };

    onSave(input);
  };

  const handleShareToggle = (checked: boolean) => {
    setIsSharing(checked);
    if (!checked) {
      store.setSharedSpaceId(null);
    }
    // When sharing, force visibility to DEFAULT
    if (checked && store.visibility === 'PRIVATE') {
      store.setVisibility('DEFAULT');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section 0: Share Toggle (only for owners) */}
      {isOwner && <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Compartir sesión
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Sesión compartida</p>
              <p className="text-xs text-muted-foreground">
                Comparte esta sesión en un espacio colaborativo
              </p>
            </div>
            <Switch
              checked={isSharing}
              onCheckedChange={handleShareToggle}
              disabled={store.visibility === 'PRIVATE'}
            />
          </div>

          {isSharing && (
            <div className="space-y-2">
              <Label>Espacio</Label>
              <Select
                value={store.sharedSpaceId || 'NONE'}
                onValueChange={(v) => store.setSharedSpaceId(v === 'NONE' ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un espacio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Sin espacio</SelectItem>
                  {spaces.map((space) => (
                    <SelectItem key={space.id} value={space.id}>
                      {space.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {store.sharedSpaceId && store.visibility === 'PRIVATE' && (
                <p className="text-xs text-destructive">
                  Las sesiones privadas no se pueden compartir
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>}

      {/* Section 1: Session Info */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la sesión</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Type - Free text with autocomplete */}
          <div className="space-y-2 relative">
            <Label htmlFor="type">Tipo de sesión *</Label>
            <Input
              ref={typeInputRef}
              id="type"
              value={store.type}
              onChange={(e) => {
                const value = e.target.value;
                store.setType(value);
                fetchSuggestions(value);
              }}
              onFocus={() => {
                fetchSuggestions(store.type);
              }}
              placeholder="Ej: Terapia de pareja, Alineamiento mensual"
              maxLength={60}
              required
              autoComplete="off"
              disabled={!isOwner}
            />
            {showSuggestions && typeSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto"
              >
                {typeSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                    onClick={() => {
                      store.setType(suggestion);
                      setShowSuggestions(false);
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Fecha *</Label>
            <Input
              id="date"
              type="date"
              value={store.date}
              onChange={(e) => store.setDate(e.target.value)}
              required
              disabled={!isOwner}
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={store.title}
              onChange={(e) => store.setTitle(e.target.value)}
              placeholder="Ej: Sesión sobre manejo de ansiedad"
              disabled={!isOwner}
            />
          </div>

          {/* Provider */}
          <div className="space-y-2">
            <Label htmlFor="provider">Profesional</Label>
            <Input
              id="provider"
              value={store.providerName}
              onChange={(e) => store.setProviderName(e.target.value)}
              placeholder="Nombre del profesional o centro"
              disabled={!isOwner}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duración (min)</Label>
            <Input
              id="duration"
              type="number"
              min={1}
              max={480}
              value={store.durationMinutes}
              onChange={(e) => store.setDurationMinutes(e.target.value)}
              placeholder="60"
              disabled={!isOwner}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas generales</Label>
            <Textarea
              id="notes"
              value={store.notes}
              onChange={(e) => store.setNotes(e.target.value)}
              placeholder="Agrega notas sobre esta sesión..."
              rows={4}
              disabled={!isOwner}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Categorization */}
      <Card>
        <CardHeader>
          <CardTitle>Categorización</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Dominio de vida</Label>
            <Select
              value={store.domainId || 'NONE'}
              onValueChange={(v) => {
                store.setDomainId(v === 'NONE' ? null : v);
                store.setGoalId(null);
              }}
              disabled={!isOwner}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin dominio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Sin dominio</SelectItem>
                {domains.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.icon && <span className="mr-1">{d.icon}</span>}
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Meta relacionada</Label>
            <Select
              value={store.goalId || 'NONE'}
              onValueChange={(v) => store.setGoalId(v === 'NONE' ? null : v)}
              disabled={!isOwner}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin meta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Sin meta</SelectItem>
                {filteredGoals.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights</CardTitle>
          <p className="text-sm text-muted-foreground">
            ¿Qué aprendiste o descubriste en esta sesión?
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {store.insights.map((insight, index) => (
            <div
              key={index}
              className={cn(
                'space-y-2 p-3 rounded-lg border bg-card',
                showShareToggles && insight.is_shared === false && 'border-dashed opacity-75'
              )}
            >
              <div className="flex items-center gap-2">
                <Input
                  value={insight.text}
                  onChange={(e) =>
                    store.updateInsight(index, { text: e.target.value })
                  }
                  placeholder="Escribe un insight..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => store.togglePrimary(index)}
                  title="Marcar como principal"
                >
                  <Star
                    className={cn(
                      'h-4 w-4',
                      insight.is_primary
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    )}
                  />
                </Button>
                {showShareToggles && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => store.toggleInsightShared(index)}
                    title={insight.is_shared !== false ? 'Visible para ambos' : 'Solo visible para ti'}
                  >
                    {insight.is_shared !== false ? (
                      <Globe className="h-4 w-4 text-primary" />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => store.removeInsight(index)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
              <Input
                value={insight.note || ''}
                onChange={(e) =>
                  store.updateInsight(index, { note: e.target.value || undefined })
                }
                placeholder="Nota adicional (opcional)"
                className="text-sm"
              />
            </div>
          ))}

          {store.insights.length < 5 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={store.addInsight}
              className="w-full"
            >
              <Plus className="h-4 w-4" />
              Agregar insight
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Section 4: Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones</CardTitle>
          <p className="text-sm text-muted-foreground">
            ¿Qué vas a hacer con lo aprendido?
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {store.actions.map((action, index) => (
            <div
              key={index}
              className={cn(
                'space-y-2 p-3 rounded-lg border bg-card',
                showShareToggles && action.is_shared === false && 'border-dashed opacity-75'
              )}
            >
              <div className="flex items-center gap-2">
                <Input
                  value={action.text}
                  onChange={(e) =>
                    store.updateAction(index, { text: e.target.value })
                  }
                  placeholder="Describe la acción..."
                  className="flex-1"
                />
                {showShareToggles && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => store.toggleActionShared(index)}
                    title={action.is_shared !== false ? 'Visible para ambos' : 'Solo visible para ti'}
                  >
                    {action.is_shared !== false ? (
                      <Globe className="h-4 w-4 text-primary" />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => store.removeAction(index)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Select
                  value={action.frequency_type || 'NONE'}
                  onValueChange={(v) =>
                    store.updateAction(index, {
                      frequency_type: v === 'NONE' ? null : v,
                    })
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Frecuencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Solo nota</SelectItem>
                    {FREQUENCY_OPTIONS.map((f) => (
                      <SelectItem key={f.key} value={f.key}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={action.target_date || ''}
                  onChange={(e) =>
                    store.updateAction(index, {
                      target_date: e.target.value || null,
                    })
                  }
                  className="flex-1"
                  placeholder="Fecha objetivo"
                />
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={store.addAction}
            className="w-full"
          >
            <Plus className="h-4 w-4" />
            Agregar acción
          </Button>
        </CardContent>
      </Card>

      {/* Section 5: Links */}
      <Card>
        <CardHeader>
          <CardTitle>Enlaces</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {store.attachments.map((att, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center gap-2',
                showShareToggles && att.is_shared === false && 'opacity-75'
              )}
            >
              <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                value={att.url || ''}
                onChange={(e) =>
                  store.updateAttachment(index, { url: e.target.value })
                }
                placeholder="https://..."
                className="flex-1"
              />
              <Input
                value={att.label || ''}
                onChange={(e) =>
                  store.updateAttachment(index, { label: e.target.value })
                }
                placeholder="Etiqueta"
                className="w-[120px]"
              />
              {showShareToggles && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => store.toggleAttachmentShared(index)}
                  title={att.is_shared !== false ? 'Visible para ambos' : 'Solo visible para ti'}
                >
                  {att.is_shared !== false ? (
                    <Globe className="h-4 w-4 text-primary" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => store.removeAttachment(index)}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={store.addAttachment}
            className="w-full"
          >
            <Plus className="h-4 w-4" />
            Agregar enlace
          </Button>
        </CardContent>
      </Card>

      {/* Section 6: Privacy (hidden when sharing or non-owner) */}
      {!isSharing && isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Privacidad</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={store.visibility === 'PRIVATE'}
                onChange={(e) =>
                  store.setVisibility(e.target.checked ? 'PRIVATE' : 'DEFAULT')
                }
                className="h-4 w-4 rounded border-border"
              />
              <div>
                <p className="text-sm font-medium">Sesión privada</p>
                <p className="text-xs text-muted-foreground">
                  Las sesiones privadas no se comparten en espacios colaborativos
                </p>
              </div>
            </label>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3 pb-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSaving || !store.date || !store.type.trim()} className="flex-1">
          {isSaving
            ? 'Guardando...'
            : session
              ? (isOwner ? 'Guardar cambios' : 'Guardar mis items')
              : 'Guardar sesión'}
        </Button>
      </div>
    </form>
  );
}
