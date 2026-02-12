'use client';

import { Button } from '@/components/ui/button';
import { useScrollTo } from '@/hooks/use-scroll-to';
import type { CtaConfig } from '@/lib/types/landing';

interface CtaButtonProps {
  cta: CtaConfig;
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function CtaButton({ cta, size = 'lg', className }: CtaButtonProps) {
  const scrollTo = useScrollTo();

  const isExternal = cta.href.startsWith('http');

  const handleClick = () => {
    if (cta.scrollTo) {
      scrollTo(cta.scrollTo);
    }
    if (isExternal) {
      window.open(cta.href, '_blank', 'noopener');
    }
  };

  if (isExternal) {
    return (
      <Button
        size={size}
        variant={cta.variant}
        className={className}
        onClick={handleClick}
      >
        {cta.label}
      </Button>
    );
  }

  return (
    <Button
      size={size}
      variant={cta.variant}
      className={className}
      onClick={() => {
        if (cta.scrollTo) scrollTo(cta.scrollTo);
      }}
    >
      {cta.label}
    </Button>
  );
}
