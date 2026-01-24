import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle, CircleDot, Target, Users, Download } from 'lucide-react';

const faqItems = [
  {
    question: '¿Qué es la Rueda de la Vida?',
    answer: 'Es una herramienta de autoconocimiento que te permite evaluar las diferentes áreas de tu vida del 0 al 10. El resultado visual te muestra el equilibrio (o desequilibrio) entre las dimensiones que son importantes para ti.',
  },
  {
    question: '¿Cada cuánto debo hacer una nueva rueda?',
    answer: 'Se recomienda repetir el ejercicio cada 3-6 meses para ver tu evolución. La app te enviará un recordatorio si lo tienes activado.',
  },
  {
    question: '¿Cuántos dominios debo elegir?',
    answer: 'Se recomienda entre 6 y 8 dominios para un balance óptimo. El mínimo es 4 y el máximo 10. Elige las áreas que sean más relevantes para tu vida actual.',
  },
  {
    question: '¿Cómo funciona el modo pareja?',
    answer: 'Un miembro genera un código de invitación y lo comparte. Una vez conectados, pueden comparar sus ruedas individuales y crear ruedas compartidas donde evalúan juntos áreas de su relación.',
  },
  {
    question: '¿Mis datos son privados?',
    answer: 'Sí. Tus datos están protegidos y solo tú puedes verlos. En el modo pareja, tú controlas qué información compartes (puntajes, prioridades, notas, o nada).',
  },
  {
    question: '¿Puedo usar la app sin crear cuenta?',
    answer: 'Sí, puedes probar creando una rueda como invitado. Tus datos se guardarán por 30 días. Si creas una cuenta, la rueda se transferirá automáticamente.',
  },
  {
    question: '¿Cómo exporto mi rueda?',
    answer: 'En la vista de resultado, usa el botón "Exportar" para guardar tu gráfico como imagen PNG o JPG. También puedes exportar todos tus datos en formato JSON desde tu perfil.',
  },
  {
    question: '¿Qué significan los puntajes?',
    answer: '0 = completamente insatisfecho, 5 = neutral/regular, 10 = plenamente satisfecho. No compares con otros: lo importante es cómo te sientes TÚ en cada área.',
  },
];

const tips = [
  { icon: CircleDot, title: 'Sé honesto', description: 'Puntúa según cómo te sientes hoy, no cómo quisieras sentirte.' },
  { icon: Target, title: 'Enfócate', description: 'Elige 1-3 áreas de enfoque. Intentar mejorar todo a la vez no funciona.' },
  { icon: Users, title: 'Comparte', description: 'Habla con alguien de confianza sobre tus resultados y prioridades.' },
  { icon: Download, title: 'Exporta', description: 'Guarda tu rueda como imagen para tenerla siempre presente.' },
];

export default function AyudaPage() {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Ayuda</h1>

      {/* Tips */}
      <div className="grid grid-cols-2 gap-3">
        {tips.map((tip) => (
          <Card key={tip.title} className="border-0 shadow-sm">
            <CardContent className="pt-4 pb-4">
              <tip.icon className="h-5 w-5 text-primary mb-2" />
              <h3 className="text-sm font-semibold mb-1">{tip.title}</h3>
              <p className="text-xs text-muted-foreground">{tip.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Preguntas frecuentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-sm text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
