'use client';

import type { PositioningContent } from '@/lib/types/landing';
import { Section } from './Section';

interface Props {
  content: PositioningContent;
}

export function PositioningSection({ content }: Props) {
  return (
    <Section id={content.id} alt>
      <div className="text-center max-w-xl mx-auto space-y-2">
        {content.negations.map((line) => (
          <p key={line} className="text-lg text-muted-foreground">
            {line}
          </p>
        ))}
        <p className="text-xl md:text-2xl font-bold pt-4">
          {content.affirmation}
        </p>
      </div>
    </Section>
  );
}
