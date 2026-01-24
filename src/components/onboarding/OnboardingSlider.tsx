'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { CircleDot, Target, Rocket, ChevronRight, ChevronLeft } from 'lucide-react';

interface OnboardingSliderProps {
  open: boolean;
  onClose: () => void;
  onStart: () => void;
}

const slides = [
  {
    icon: CircleDot,
    title: '¿Qué es la Rueda de la Vida?',
    description:
      'Es una herramienta de autoconocimiento que te permite evaluar de forma visual las áreas más importantes de tu vida. Te ayuda a identificar dónde estás hoy y dónde quieres estar.',
    highlight: 'Visualiza tu vida como un todo.',
  },
  {
    icon: Target,
    title: 'Recomendaciones',
    description:
      'Sé honesto contigo mismo al puntuar cada área. No hay respuestas correctas o incorrectas. Toma tu tiempo para reflexionar. Este es un espacio seguro para ti.',
    highlight: 'La honestidad es clave para el autoconocimiento.',
  },
  {
    icon: Rocket,
    title: '¿Estás listo?',
    description:
      'En los siguientes pasos vas a definir las áreas de tu vida, puntuarlas del 0 al 10, visualizar tus resultados y crear un plan de acción para mejorar.',
    highlight: 'Tu viaje de transformación comienza ahora.',
  },
];

export function OnboardingSlider({ open, onClose, onStart }: OnboardingSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleStart = () => {
    setCurrentSlide(0);
    onStart();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogTitle className="sr-only">Introducción a la Rueda de la Vida</DialogTitle>
        <div className="flex flex-col items-center text-center py-6 px-2">
          {(() => {
            const slide = slides[currentSlide];
            const Icon = slide.icon;
            return (
              <>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-3">{slide.title}</h2>
                <p className="text-muted-foreground mb-4">{slide.description}</p>
                <p className="text-sm font-medium text-primary">{slide.highlight}</p>
              </>
            );
          })()}

          {/* Dots */}
          <div className="flex gap-2 my-6">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentSlide ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-3 w-full">
            {currentSlide > 0 && (
              <Button variant="outline" onClick={handlePrev} className="flex-1">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
            )}
            {currentSlide < slides.length - 1 ? (
              <Button onClick={handleNext} className="flex-1">
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleStart} className="flex-1">
                Comenzar
                <Rocket className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
