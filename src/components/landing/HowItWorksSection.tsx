'use client';

import type { HowItWorksContent } from '@/lib/types/landing';
import { Section } from './Section';

interface Props {
  content: HowItWorksContent;
}

export function HowItWorksSection({ content }: Props) {
  return (
    <Section id={content.id}>
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
        {content.title}
      </h2>

      <ol className="space-y-6 max-w-lg mx-auto mb-10">
        {content.steps.map((step, i) => (
          <li key={i} className="flex items-start gap-4">
            <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0">
              {i + 1}
            </span>
            <p className="text-sm text-muted-foreground pt-1">{step}</p>
          </li>
        ))}
      </ol>

      <div className="text-center space-y-1">
        {content.close.map((line) => (
          <p key={line} className="font-semibold">
            {line}
          </p>
        ))}
      </div>
    </Section>
  );
}
