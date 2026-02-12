'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { DimensionsContent } from '@/lib/types/landing';
import { Section } from './Section';

interface Props {
  content: DimensionsContent;
}

export function DimensionsGrid({ content }: Props) {
  return (
    <Section id={content.id}>
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
        {content.title}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {content.cards.map((card) => (
          <Card
            key={card.id}
            id={card.id}
            className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-3">{card.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 whitespace-pre-line">
                {card.description}
              </p>
              <p className="text-xs text-muted-foreground/80 italic">
                {card.footer}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Finance callout */}
      <div
        id="finanzas"
        className="rounded-lg border border-border bg-card p-6 md:p-8 text-center"
      >
        <span className="text-2xl mb-2 block">{content.finance.icon}</span>
        <h3 className="font-semibold text-lg mb-2">{content.finance.title}</h3>
        <p className="text-muted-foreground text-sm mb-2">
          {content.finance.subtitle}
        </p>
        <p className="text-xs text-muted-foreground/80 italic">
          {content.finance.description}
        </p>
      </div>
    </Section>
  );
}
