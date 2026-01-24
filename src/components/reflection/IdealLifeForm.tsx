'use client';

import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IDEAL_LIFE_PROMPTS } from '@/lib/types';
import type { Domain } from '@/lib/types';

interface IdealLifeFormProps {
  domain: Domain;
  visionText: string;
  promptAnswers: Record<string, string>;
  onVisionChange: (text: string) => void;
  onPromptChange: (promptKey: string, answer: string) => void;
}

export function IdealLifeForm({
  domain,
  visionText,
  promptAnswers,
  onVisionChange,
  onPromptChange,
}: IdealLifeFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <span>{domain.icon}</span>
          {domain.name} - Vida ideal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            ¿Cómo se ve un 10/10 en {domain.name}?
          </Label>
          <Textarea
            placeholder={`Describe tu visión ideal para ${domain.name}...`}
            value={visionText}
            onChange={(e) => onVisionChange(e.target.value)}
            className="resize-none"
            rows={4}
          />
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Imagina que ya lograste tu 10/10:
          </p>
          {IDEAL_LIFE_PROMPTS.map((prompt) => (
            <div key={prompt.key} className="space-y-1.5">
              <Label htmlFor={`${domain.id}-${prompt.key}`} className="text-sm">
                {prompt.label}
              </Label>
              <Textarea
                id={`${domain.id}-${prompt.key}`}
                placeholder="..."
                value={promptAnswers[prompt.key] || ''}
                onChange={(e) => onPromptChange(prompt.key, e.target.value)}
                className="resize-none"
                rows={2}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
