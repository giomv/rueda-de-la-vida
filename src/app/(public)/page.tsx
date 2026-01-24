'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { OnboardingSlider } from '@/components/onboarding/OnboardingSlider';
import { InfoAccordion } from '@/components/onboarding/InfoAccordion';
import {
  CircleDot,
  Target,
  TrendingUp,
  Users,
  BarChart3,
  Shield,
} from 'lucide-react';

const features = [
  {
    icon: CircleDot,
    title: 'Evalúa tu vida',
    description: 'Puntúa las áreas más importantes de tu vida del 0 al 10.',
  },
  {
    icon: BarChart3,
    title: 'Visualiza resultados',
    description: 'Gráfico radar que muestra el equilibrio entre tus áreas.',
  },
  {
    icon: Target,
    title: 'Define prioridades',
    description: 'Identifica qué áreas necesitan más atención.',
  },
  {
    icon: TrendingUp,
    title: 'Crea tu plan',
    description: 'Establece metas y hábitos para mejorar cada área.',
  },
  {
    icon: Users,
    title: 'Modo pareja',
    description: 'Comparte y compara con tu pareja para crecer juntos.',
  },
  {
    icon: Shield,
    title: 'Privado y seguro',
    description: 'Tus datos son tuyos. Control total de tu privacidad.',
  },
];

export default function LandingPage() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const router = useRouter();

  const handleStart = () => {
    setShowOnboarding(false);
    router.push('/rueda/nueva');
  };

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-20 md:py-32 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Descubre el equilibrio en tu vida
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            La Rueda de la Vida te ayuda a evaluar, visualizar y mejorar las áreas
            más importantes de tu vida. Comienza tu viaje de autoconocimiento hoy.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" onClick={() => setShowOnboarding(true)}>
              Empezar ahora
            </Button>
            <Link href="/como-funciona">
              <Button size="lg" variant="outline">
                ¿Cómo funciona?
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Todo lo que necesitas para tu desarrollo personal
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Info section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold text-center mb-8">
            Preguntas frecuentes
          </h2>
          <InfoAccordion />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-primary/5">
        <div className="container mx-auto text-center max-w-xl">
          <h2 className="text-2xl font-bold mb-4">
            ¿Listo para comenzar?
          </h2>
          <p className="text-muted-foreground mb-6">
            No necesitas cuenta para probar. Crea tu primera rueda ahora mismo.
          </p>
          <Button size="lg" onClick={() => setShowOnboarding(true)}>
            Crear mi primera rueda
          </Button>
        </div>
      </section>

      <OnboardingSlider
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onStart={handleStart}
      />
    </div>
  );
}
