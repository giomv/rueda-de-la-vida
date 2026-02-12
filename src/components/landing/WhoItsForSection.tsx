'use client';

import { Check } from 'lucide-react';
import type { WhoItsForContent } from '@/lib/types/landing';
import { Section } from './Section';

interface Props {
  content: WhoItsForContent;
}

export function WhoItsForSection({ content }: Props) {
  return (
    <Section id={content.id} alt>
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
        {content.title}
      </h2>
      <p className="text-muted-foreground text-center mb-8">
        {content.intro}
      </p>
      <ul className="space-y-4 max-w-lg mx-auto">
        {content.bullets.map((bullet) => (
          <li
            key={bullet}
            className="flex items-start gap-3 text-sm"
          >
            <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
