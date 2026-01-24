import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CircleDot, Edit3, BarChart3, Target, BookOpen, Lightbulb, ClipboardList, CheckCircle } from 'lucide-react';

const steps = [
  {
    icon: Edit3,
    title: '1. Define tus dominios',
    description: 'Elige entre 4 y 10 áreas de tu vida que quieras evaluar. Puedes usar nuestras sugerencias o crear las tuyas.',
  },
  {
    icon: CircleDot,
    title: '2. Puntúa cada área',
    description: 'Califica cada dominio del 0 al 10 según tu satisfacción actual. Sé honesto contigo mismo.',
  },
  {
    icon: BarChart3,
    title: '3. Visualiza tu rueda',
    description: 'Observa tu gráfico radar. Las áreas más grandes son tus fortalezas, las más pequeñas tus oportunidades.',
  },
  {
    icon: Target,
    title: '4. Prioriza',
    description: 'Ordena tus dominios por importancia y selecciona 1-3 áreas de enfoque para trabajar.',
  },
  {
    icon: BookOpen,
    title: '5. Reflexiona',
    description: 'Responde preguntas guiadas que te ayudarán a entender mejor tu situación actual.',
  },
  {
    icon: Lightbulb,
    title: '6. Imagina tu vida ideal',
    description: 'Para cada área de enfoque, describe cómo sería un 10/10. ¿Cómo te sentirías? ¿Qué harías?',
  },
  {
    icon: ClipboardList,
    title: '7. Crea tu plan de acción',
    description: 'Define metas concretas y acciones semanales para cada área prioritaria.',
  },
  {
    icon: CheckCircle,
    title: '8. Da seguimiento',
    description: 'Registra tus hábitos diarios y repite la rueda cada 3-6 meses para medir tu progreso.',
  },
];

export default function ComoFuncionaPage() {
  return (
    <div className="py-16 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Cómo funciona?
          </h1>
          <p className="text-lg text-muted-foreground">
            8 pasos para evaluar y mejorar el equilibrio en tu vida
          </p>
        </div>

        <div className="space-y-4">
          {steps.map((step) => (
            <Card key={step.title} className="border-0 shadow-sm">
              <CardContent className="flex gap-4 items-start pt-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/rueda/nueva">
            <Button size="lg">Comenzar ahora</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
