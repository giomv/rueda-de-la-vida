'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function InfoAccordion() {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="what">
        <AccordionTrigger>¿Qué es la Rueda de la Vida?</AccordionTrigger>
        <AccordionContent>
          <p className="text-muted-foreground">
            La Rueda de la Vida es una herramienta de coaching y desarrollo personal que
            te permite evaluar de forma visual las diferentes áreas de tu vida. Cada área
            se puntúa del 0 al 10, creando un gráfico tipo radar que muestra el equilibrio
            (o desequilibrio) entre las distintas dimensiones de tu vida.
          </p>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="why">
        <AccordionTrigger>¿Para qué sirve?</AccordionTrigger>
        <AccordionContent>
          <ul className="space-y-2 text-muted-foreground">
            <li>• Tomar conciencia de tu situación actual en cada área</li>
            <li>• Identificar áreas que necesitan atención</li>
            <li>• Establecer prioridades de mejora</li>
            <li>• Crear planes de acción concretos</li>
            <li>• Medir tu progreso a lo largo del tiempo</li>
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="recommendations">
        <AccordionTrigger>Recomendaciones</AccordionTrigger>
        <AccordionContent>
          <ul className="space-y-2 text-muted-foreground">
            <li>• Busca un momento tranquilo y sin distracciones</li>
            <li>• Sé completamente honesto contigo mismo</li>
            <li>• No compares tus respuestas con las de otros</li>
            <li>• Puntúa según cómo te sientes HOY, no cómo te gustaría sentirte</li>
            <li>• Repite el ejercicio cada 3-6 meses para ver tu evolución</li>
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="who">
        <AccordionTrigger>¿Para quién es?</AccordionTrigger>
        <AccordionContent>
          <p className="text-muted-foreground">
            Para cualquier persona que quiera tomarse un momento para reflexionar sobre su vida,
            identificar áreas de mejora y crear un plan para vivir de forma más equilibrada y
            satisfactoria. No necesitas experiencia previa en coaching o desarrollo personal.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
