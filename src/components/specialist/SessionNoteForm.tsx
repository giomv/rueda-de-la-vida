'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Lock, Share2, Save, Send } from 'lucide-react';
import { PrivateNotesList } from './PrivateNotesList';
import { RecommendationList } from './RecommendationList';
import { useSpecialistNoteStore } from '@/lib/stores/specialist-note-store';
import { getTypeSuggestions } from '@/lib/actions/specialist-actions';

interface SessionNoteFormProps {
  onSaveDraft: () => void;
  onSaveAndPublish: () => void;
  isSaving: boolean;
  isPublished?: boolean;
}

export function SessionNoteForm({
  onSaveDraft,
  onSaveAndPublish,
  isSaving,
  isPublished,
}: SessionNoteFormProps) {
  const store = useSpecialistNoteStore();
  const [typeSuggestions, setTypeSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (store.session_type.length >= 2) {
      getTypeSuggestions({ query: store.session_type })
        .then(setTypeSuggestions)
        .catch(() => {});
    } else {
      setTypeSuggestions([]);
    }
  }, [store.session_type]);

  return (
    <div className="space-y-6">
      {/* Session Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2 relative">
          <Label htmlFor="session-type">Tipo de sesion</Label>
          <Input
            id="session-type"
            value={store.session_type}
            onChange={(e) => store.setField('session_type', e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Ej: Psicologia, Nutricion..."
            maxLength={60}
          />
          {showSuggestions && typeSuggestions.length > 0 && (
            <div className="absolute z-10 top-full left-0 right-0 bg-popover border rounded-md shadow-md mt-1">
              {typeSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                  onMouseDown={() => {
                    store.setField('session_type', suggestion);
                    setShowSuggestions(false);
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="session-date">Fecha</Label>
          <Input
            id="session-date"
            type="date"
            value={store.session_date}
            onChange={(e) => store.setField('session_date', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duracion (minutos)</Label>
          <Input
            id="duration"
            type="number"
            min="1"
            max="480"
            value={store.duration_minutes}
            onChange={(e) => store.setField('duration_minutes', e.target.value)}
            placeholder="60"
          />
        </div>
      </div>

      <Separator />

      {/* Private Notes */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">Notas privadas</h3>
          <span className="text-xs text-muted-foreground">(solo visibles para ti)</span>
        </div>
        <PrivateNotesList
          notes={store.private_notes}
          onAdd={store.addPrivateNote}
          onRemove={store.removePrivateNote}
          onUpdate={store.updatePrivateNote}
        />
      </div>

      {/* Private Follow-up */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="followup">Seguimiento privado</Label>
        </div>
        <Textarea
          id="followup"
          value={store.private_followup}
          onChange={(e) => store.setField('private_followup', e.target.value)}
          placeholder="Notas de seguimiento..."
          className="min-h-[80px]"
        />
      </div>

      <Separator />

      {/* Shared Recommendations */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Share2 className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Recomendaciones compartidas</h3>
          <span className="text-xs text-muted-foreground">(visibles para el usuario al publicar)</span>
        </div>
        <RecommendationList
          recommendations={store.shared_recommendations}
          onAdd={store.addRecommendation}
          onRemove={store.removeRecommendation}
          onUpdate={store.updateRecommendation}
        />
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button
          type="button"
          variant="outline"
          onClick={onSaveDraft}
          disabled={isSaving}
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Guardando...' : 'Guardar borrador'}
        </Button>
        {!isPublished && (
          <Button
            type="button"
            onClick={onSaveAndPublish}
            disabled={isSaving || store.shared_recommendations.filter(r => r.text.trim()).length === 0}
          >
            <Send className="h-4 w-4" />
            {isSaving ? 'Guardando...' : 'Guardar y publicar recomendaciones'}
          </Button>
        )}
      </div>
    </div>
  );
}
