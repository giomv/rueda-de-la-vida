'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { DimensionCardImage, DimensionsContent } from '@/lib/types/landing';
import { Section } from './Section';

interface Props {
  content: DimensionsContent;
}

function DimensionImage({ image }: { image: DimensionCardImage }) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-xl bg-muted/40"
      style={{ aspectRatio: image.aspectRatio || '4/3' }}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        className={image.fit === 'cover' ? 'object-cover' : 'object-contain'}
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    </div>
  );
}

export function DimensionsGrid({ content }: Props) {
  /* Merge the 3 cards + finance into a unified list for alternating rows */
  const allRows = [
    ...content.cards.map((card) => ({
      id: card.id,
      title: card.title,
      description: card.description,
      footer: card.footer,
      image: card.image,
    })),
    {
      id: 'finanzas',
      title: content.finance.title,
      description: content.finance.subtitle,
      footer: content.finance.description,
      image: content.finance.image,
    },
  ];

  return (
    <Section id={content.id}>
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-16">
        {content.title}
      </h2>

      <div className="flex flex-col gap-16 md:gap-24">
        {allRows.map((row, i) => {
          const imageFirst = i % 2 !== 0;

          return (
            <div
              key={row.id}
              id={row.id}
              className={cn(
                'flex flex-col md:flex-row items-center gap-8 md:gap-12',
                imageFirst && 'md:flex-row-reverse',
              )}
            >
              {/* Text side */}
              <div className="flex-1 space-y-4">
                <h3 className="text-xl md:text-2xl font-semibold">
                  {row.title}
                </h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {row.description}
                </p>
                <p className="text-sm text-muted-foreground/80 italic">
                  {row.footer}
                </p>
              </div>

              {/* Image side */}
              <div className="flex-1 w-full">
                {row.image && <DimensionImage image={row.image} />}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
