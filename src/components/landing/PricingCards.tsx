'use client';

import { Check } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { PricingContent } from '@/lib/types/landing';
import { Section } from './Section';
import { CtaButton } from './CtaButton';
import { cn } from '@/lib/utils';

interface Props {
  content: PricingContent;
}

export function PricingCards({ content }: Props) {
  return (
    <Section id={content.id} alt>
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
        {content.title}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {content.cards.map((card) => (
          <Card
            key={card.id}
            className={cn(
              'flex flex-col transition-shadow duration-300',
              card.highlighted
                ? 'border-primary shadow-md hover:shadow-lg'
                : 'hover:shadow-md',
            )}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span>{card.icon}</span>
                {card.name}
              </CardTitle>
              {card.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {card.description}
                </p>
              )}
            </CardHeader>

            <CardContent className="flex-1 space-y-4">
              {/* Main features */}
              {card.features.length > 0 && (
                <ul className="space-y-2">
                  {card.features.map((f) => (
                    <li key={f.text} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      {f.text}
                    </li>
                  ))}
                </ul>
              )}

              {/* Session features (mentorship card) */}
              {card.sessionTitle && (
                <div>
                  <p className="text-sm font-medium mb-2">{card.sessionTitle}</p>
                  <ul className="space-y-2">
                    {card.sessionFeatures?.map((f) => (
                      <li key={f.text} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        {f.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs text-muted-foreground italic">
                {card.ideal}
              </p>
              {card.note && (
                <p className="text-xs font-medium text-destructive">
                  {card.note}
                </p>
              )}
            </CardContent>

            <CardFooter className="flex flex-col items-center gap-3 pt-4">
              <div className="text-center">
                <span className="text-3xl font-bold">{card.price}</span>
                <p className="text-xs text-muted-foreground">
                  {card.priceLabel}
                </p>
              </div>
              <CtaButton cta={card.cta} size="default" className="w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </Section>
  );
}
