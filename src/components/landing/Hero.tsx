'use client';

import type { HeroContent } from '@/lib/types/landing';
import { CtaButton } from './CtaButton';

interface HeroProps {
  content: HeroContent;
}

export function Hero({ content }: HeroProps) {
  return (
    <section className="py-20 md:py-32 px-4">
      <div className="container mx-auto text-center max-w-3xl">
        <span className="inline-block text-sm font-medium tracking-widest uppercase text-muted-foreground mb-4">
          {content.badge}
        </span>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
          {content.title}
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
          {content.subtitle}
        </p>
        <p className="text-base text-muted-foreground mb-4 max-w-2xl mx-auto">
          {content.description}
        </p>
        <p className="text-base font-semibold mb-8">
          {content.tagline}
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          {content.ctas.map((cta) => (
            <CtaButton key={cta.label} cta={cta} />
          ))}
        </div>
      </div>
    </section>
  );
}
