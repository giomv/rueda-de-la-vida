'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ScholarshipContent } from '@/lib/types/landing';
import { Section } from './Section';

interface Props {
  content: ScholarshipContent;
}

export function ScholarshipSection({ content }: Props) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/scholarship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Error al enviar la postulación');
      }

      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al enviar la postulación',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section id={content.id}>
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">
          {content.title}
        </h2>
        <p className="text-lg text-muted-foreground font-medium">
          {content.subtitle}
        </p>
      </div>

      <div className={`${content.includeImage ? 'max-w-4xl' : 'max-w-2xl'} mx-auto space-y-8`}>
        {/* Intro */}
        <div className="space-y-3">
          {content.intro.map((line, i) => (
            <p
              key={i}
              className={
                i >= 2 ? 'font-semibold' : 'text-muted-foreground text-sm'
              }
            >
              {line}
            </p>
          ))}
        </div>

        {/* What's included + Audience (with optional side image) */}
        <div className={content.includeImage ? 'flex flex-col md:flex-row items-start gap-10 md:gap-14' : 'space-y-8'}>
          {/* Text side */}
          <div className="flex-1 space-y-8">
            {/* What's included */}
            <div>
              <h3 className="font-semibold mb-3">{content.includesTitle}</h3>
              <ul className="space-y-2">
                {content.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground italic mt-3">
                {content.includesNote}
              </p>
            </div>

            {/* Audience */}
            <div>
              <h3 className="font-semibold mb-2">{content.audienceTitle}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {content.audienceIntro}
              </p>
              <ul className="space-y-2">
                {content.audienceBullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Image side */}
          {content.includeImage && (
            <div className="flex-1 w-full">
              <div className="relative w-full overflow-hidden rounded-2xl bg-muted/40 aspect-[3/4]">
                <Image
                  src={content.includeImage.src}
                  alt={content.includeImage.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          )}
        </div>

        {/* Application form */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">{content.processTitle}</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {content.processIntro}
            </p>

            {submitted ? (
              <div className="text-center py-8">
                <p className="font-semibold mb-2">
                  Gracias por tu postulación
                </p>
                <p className="text-sm text-muted-foreground">
                  {content.processNote}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {content.formFields.map((field) => (
                  <div key={field.name} className="space-y-1.5">
                    <Label htmlFor={field.name}>{field.label}</Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        id={field.name}
                        name={field.name}
                        required={field.required}
                        value={formData[field.name] || ''}
                        onChange={handleChange}
                        rows={3}
                      />
                    ) : (
                      <Input
                        id={field.name}
                        name={field.name}
                        type={field.type}
                        required={field.required}
                        value={formData[field.name] || ''}
                        onChange={handleChange}
                      />
                    )}
                  </div>
                ))}

                <p className="text-xs text-muted-foreground">
                  {content.processNote}
                </p>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {content.cta.label}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}
