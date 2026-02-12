'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useScrollTo } from '@/hooks/use-scroll-to';

interface StickyCtaProps {
  accessHref: string;
  mentorshipHref: string;
}

export function StickyCta({ accessHref, mentorshipHref }: StickyCtaProps) {
  const [show, setShow] = useState(false);
  const scrollTo = useScrollTo();

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past hero (~500px)
      setShow(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-card/95 backdrop-blur-sm px-4 py-3">
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1 text-xs"
          onClick={() => window.open(accessHref, '_blank', 'noopener')}
        >
          Solicitar acceso
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-xs"
          onClick={() => {
            scrollTo('modelos');
            window.open(mentorshipHref, '_blank', 'noopener');
          }}
        >
          Acceso + mentoría
        </Button>
      </div>
    </div>
  );
}
