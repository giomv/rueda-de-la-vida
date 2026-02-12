'use client';

import type { FinalCtaContent } from '@/lib/types/landing';
import { Section } from './Section';
import { CtaButton } from './CtaButton';

interface Props {
  content: FinalCtaContent;
}

export function FinalCtaSection({ content }: Props) {
  return (
    <Section id={content.id} className="bg-primary/5">
      <div className="text-center max-w-xl mx-auto">
        {content.copy.map((line, i) => (
          <p key={i} className="text-xl md:text-2xl font-bold">
            {line}
          </p>
        ))}

        <div className="flex gap-4 justify-center flex-wrap mt-8">
          {content.ctas.map((cta) => (
            <CtaButton key={cta.label} cta={cta} />
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-4">{content.note}</p>
      </div>
    </Section>
  );
}
