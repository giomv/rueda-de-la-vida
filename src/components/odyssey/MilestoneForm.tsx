'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { MilestoneTagSelector } from './MilestoneTagSelector';
import { DomainSelector } from './DomainSelector';
import { MILESTONE_CATEGORIES } from '@/lib/types';
import type { OdysseyMilestone, MilestoneCategory, MilestoneTag, LifeDomain } from '@/lib/types';

interface MilestoneFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description: string;
    category: MilestoneCategory | null;
    domain_id: string | null;
    tag: MilestoneTag;
    year: number;
    replicateToAllYears?: boolean;
  }) => void;
  year: number;
  initial?: Partial<OdysseyMilestone>;
  showTags?: boolean;
  domains?: LifeDomain[];
}

export function MilestoneForm({ open, onClose, onSave, year, initial, showTags = false, domains = [] }: MilestoneFormProps) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [domainId, setDomainId] = useState<string | null>(initial?.domain_id || null);
  const [category, setCategory] = useState<MilestoneCategory | null>(initial?.category || null);
  const [tag, setTag] = useState<MilestoneTag>(initial?.tag || 'normal');
  const [selectedYear, setSelectedYear] = useState(initial?.year || year);
  const [replicateToAllYears, setReplicateToAllYears] = useState(false);

  const isNewMilestone = !initial;

  // Reset form when initial changes
  useEffect(() => {
    setTitle(initial?.title || '');
    setDescription(initial?.description || '');
    setDomainId(initial?.domain_id || null);
    setCategory(initial?.category || null);
    setTag(initial?.tag || 'normal');
    setSelectedYear(initial?.year || year);
    setReplicateToAllYears(false);
  }, [initial, year]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      category: domains.length > 0 ? null : category,
      domain_id: domainId,
      tag,
      year: selectedYear,
      replicateToAllYears: isNewMilestone ? replicateToAllYears : undefined,
    });
    setTitle('');
    setDescription('');
    setDomainId(null);
    setCategory(null);
    setTag('normal');
    setSelectedYear(year);
    setReplicateToAllYears(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initial ? 'Editar hito' : 'Nuevo hito'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Año</label>
            <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    Año {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Título</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="¿Qué quieres lograr?"
              maxLength={100}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Descripción (opcional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Más detalles..."
              rows={2}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {domains.length > 0 ? 'Dominio' : 'Categoría'}
            </label>
            {domains.length > 0 ? (
              <DomainSelector
                domains={domains}
                value={domainId}
                onChange={setDomainId}
                placeholder="Selecciona un dominio"
              />
            ) : (
              <Select value={category || 'personal'} onValueChange={(v) => setCategory(v as MilestoneCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MILESTONE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.key} value={cat.key}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {showTags && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Tipo</label>
              <MilestoneTagSelector value={tag} onChange={setTag} />
            </div>
          )}

          {isNewMilestone && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="replicate-years"
                checked={replicateToAllYears}
                onCheckedChange={(checked) => setReplicateToAllYears(checked === true)}
              />
              <Label htmlFor="replicate-years" className="text-sm cursor-pointer">
                Replicar en todos los años
              </Label>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!title.trim()}>
              {initial ? 'Guardar' : 'Agregar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
