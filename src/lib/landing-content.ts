import type { LandingContent } from '@/lib/types/landing';

/* ------------------------------------------------------------------ */
/*  WhatsApp deep links – update the phone number as needed            */
/* ------------------------------------------------------------------ */
const WA_PHONE = '51991846105';
const WA_ACCESS = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent('Hola, quiero acceder a VIA')}`;
const WA_MENTORSHIP = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent('Hola, quiero acceso + mentoría estratégica en VIA')}`;

/* ------------------------------------------------------------------ */
/*  Full landing content – all copy in Spanish                         */
/* ------------------------------------------------------------------ */
export const landingContent: LandingContent = {
  whatsAppLinks: {
    access: WA_ACCESS,
    mentorship: WA_MENTORSHIP,
  },

  /* ---- HERO ---- */
  hero: {
    badge: 'VÍA',
    title: 'Diseña tu vida con intención',
    subtitle: 'Conecta tu hoy con el mañana que quieres.',
    description:
      'VIA es una plataforma digital que integra reflexión profunda, metas estratégicas y acción diaria en un solo sistema coherente.',
    tagline: 'No es productividad. Es dirección.',
    ctas: [
      { label: 'Solicitar acceso', href: WA_ACCESS, variant: 'default' },
      {
        label: 'Aplicar a acceso + mentoría',
        href: WA_MENTORSHIP,
        variant: 'outline',
        scrollTo: 'modelos',
      },
    ],
  },

  /* ---- PROBLEM / INSIGHT ---- */
  problem: {
    id: 'problema',
    title: 'El verdadero lujo es tener claridad.',
    negations: [
      'No es falta de disciplina.',
      'No es falta de motivación.',
      'No es falta de ambición.',
    ],
    revelation: 'Es falta de integración.',
    painPoints: [
      'Tienes metas escritas en distintos lugares.',
      'Haces listas que no se sostienen.',
      'Reflexionas… pero no ejecutas.',
      'Ejecutas… pero sin dirección clara.',
      'Empiezas con motivación y luego pierdes foco.',
    ],
    close: 'VIA une claridad + estructura + ejecución.',
  },

  /* ---- THREE DIMENSIONS + FINANCE ---- */
  dimensions: {
    id: 'dimensiones',
    title: 'Una plataforma. Cuatro dimensiones. Una vida coherente.',
    cards: [
      {
        id: 'diagnostico',
        title: 'Diagnóstico',
        description:
          'Evalúa cómo estás en cada dominio importante y define qué necesita tu atención ahora.',
        footer: 'No desde la culpa. Desde la conciencia.',
        image: { src: '/assets/landing/dimensiones/diagnostico.png', alt: 'Diagnóstico — VIA' },
      },
      {
        id: 'estrategia',
        title: 'Estrategia',
        description:
          'Organiza tus metas por años y horizonte. Transforma intención en estrategia.\nDecide qué construir y cuándo.',
        footer: 'Porque no todo es urgente. Pero sí importante.',
        image: { src: '/assets/landing/dimensiones/estrategia.png', alt: 'Estrategia — VIA' },
      },
      {
        id: 'ejecucion',
        title: 'Ejecución',
        description:
          'Baja todo a acciones reales. Día a día. Semana a semana.',
        footer:
          'Las acciones no están sueltas. Conecta cada acción con una intención mayor.',
        image: { src: '/assets/landing/dimensiones/ejecucion.png', alt: 'Ejecución — VIA' },
      },
    ],
    finance: {
      icon: '',
      title: 'Finanzas con propósito',
      subtitle:
        'Alinea tus decisiones financieras con la vida que estás construyendo',
      description:
        'El dinero deja de ser solo gasto. Se convierte en herramienta de diseño.',
      image: { src: '/assets/landing/dimensiones/finanzas.png', alt: 'Finanzas con propósito — VIA' },
    },
  },

  /* ---- POSITIONING ---- */
  positioning: {
    id: 'posicionamiento',
    negations: [
      'No es una agenda.',
      'No es un planner.',
      'No es un tracker financiero.',
    ],
    affirmation: 'Es un sistema de coherencia.',
  },

  /* ---- HOW IT WORKS ---- */
  howItWorks: {
    id: 'como-funciona',
    title: 'Cómo funciona',
    steps: [
      'Evalúas tu presente alineando metas a tus dominios.',
      'Las organizas estratégicamente en tu plan de Vida.',
      'Las conectas con acciones y decisiones financieras.',
      'Ejecutas con claridad desde Mi Plan y ves tu avance.',
    ],
    close: [
      'VIA no es una app de tareas.',
      'Es un sistema de diseño de vida.',
    ],
  },

  /* ---- WHO IT'S FOR ---- */
  whoItsFor: {
    id: 'para-quien',
    title: 'Para quién es VIA',
    intro: 'VIA es para profesionales que:',
    bullets: [
      'Valoran estructura sin rigidez.',
      'Están en transición, crecimiento o redefinición.',
      'Quieren expansión con equilibrio.',
      'Buscan coherencia entre lo que piensan, hacen y cómo invierten su dinero.',
      'No buscan motivación momentánea, sino dirección sostenida.',
    ],
  },

  /* ---- TESTIMONIALS ---- */
  testimonials: {
    id: 'testimoniales',
    title: 'Testimoniales',
    items: [
      {
        quote: 'No sabía cuánto lo necesitaba hasta que lo usé',
        body: 'Si bien soy una persona organizada, paso mucho tiempo en mi mente y Via me ayudó a darme cuenta las oportunidades que puedo tomar.',
        author: 'Denisse G.',
        role: 'Gerente de producto y empresaria.',
      },
      {
        quote: "Me encantó la asesoría, el acompañamiento, y la forma en la que la plataforma está construida.",
        body: "Organizaba mis metas y logras en Excel pero siempre lo sentí incompleto y un poco tedioso de completar. VIA me encantó, tener la visibilidad de no solo cumplir mis objetivos por año, sino ver cómo mi vida se iba construyendo hasta 5 años, me recuerda hacia donde debo ir sin distraerme. Siento que encontré lo que estuve buscando por años.",
        author:"Jesús M.",
        role: "CEO y Empresario"
      },
      {
        quote: "Me dio estructura sin quitarme libertad.",
        body: "No es una agenda ni un tracker más. Es una metodología que me ayudó a ordenar mi cabeza y bajar decisiones grandes a pasos concretos. Ahora me siento más tranquila de trabajar por aquello que es importante para mí.",
        author:"Marily F.",
        role: "Emprendedora y mamá"
      }
    ],
  },

  /* ---- PRICING ---- */
  pricing: {
    id: 'modelos',
    title: 'Modelos de acceso',
    cards: [
      {
        id: 'acceso',
        icon: '',
        name: 'Acceso a VIA',
        features: [
          { text: 'Acceso completo a la plataforma' },
          { text: 'Diagnóstico por dominios' },
          { text: 'Planificación estratégica por años' },
          { text: 'Sistema de acciones conectadas a metas' },
          { text: 'Integración financiera vinculada a objetivos' },
          { text: 'Historial de evolución personal' },
          { text: 'Actualizaciones futuras' },
        ],
        ideal:
          'Ideal para personas autónomas que quieren un sistema sólido donde diseñar su vida con intención',
        price: 'S/. 297',
        priceLabel: 'Pago Único',
        cta: {
          label: 'Quiero acceder a VIA',
          href: WA_ACCESS,
          variant: 'default',
        },
      },
      {
        id: 'mentoria',
        icon: '',
        name: 'Acceso + Mentoría Estratégica',
        description:
          'Incluye todo lo anterior + una sesión privada de diseño de vida personal.',
        sessionTitle: 'En esta sesión trabajamos:',
        sessionFeatures: [
          { text: '1 sesión personalizada (60–90 min)' },
          { text: 'Claridad profunda de prioridades' },
          { text: 'Reordenamiento estratégico de metas' },
          { text: 'Foco trimestral realista' },
          { text: 'Alineación financiera con visión de vida' },
          { text: 'Eliminación de ruido innecesario' },
        ],
        features: [],
        ideal:
          'Ideal para quienes quieren claridad profunda y guía estratégica personalizada.',
        note: 'Cupos limitados.',
        price: 'S/. 897',
        priceLabel: 'Aplicación previa requerida',
        highlighted: true,
        cta: {
          label: 'Quiero acceso + mentoría',
          href: WA_MENTORSHIP,
          variant: 'default',
          scrollTo: 'modelos',
        },
      },
    ],
  },

  /* ---- FOUNDER / AUTHORITY ---- */
  founder: {
    id: 'creadora',
    title: 'Creado desde estrategia y ciencia del comportamiento',
    paragraphs: [
      'VIA no nació como una app de productividad.',
      'Nació desde una pregunta más profunda:\n¿Cómo se diseña una vida con coherencia real?',
      'Soy coach profesional, profesora universitaria y desarrolladora de productos digitales. Pero también soy especialista y master en Psicología de la Salud y Estilos de Vida',
    ],
    listTitle: 'Durante años he trabajado en:',
    listItems: [
      'Diseño estratégico',
      'Desarrollo de productos',
      'Arquitectura de sistemas digitales',
      'Coaching ontologico y pragmático',
      'Y estudio del comportamiento humano aplicado al cambio sostenible',
    ],
    closing: [
      'VIA integra esos mundos.',
      'No es solo organización.',
    ],
    image: {
      src: '/assets/landing/founder.jpeg',
      alt: 'Creadora de VIA',
    },
  },

  /* ---- FOUNDER CLOSING ---- */
  founderClosing: {
    id: 'creadora-cierre',
    title: 'Es comprensión de cómo funcionan:',
    items: [
      'Los hábitos',
      'La motivación',
      'La toma de decisiones',
      'La relación con el dinero',
      'El equilibrio entre dominios de vida',
    ],
    closing: [
      'Fue creado para personas que no quieren reaccionar ante la vida, sino liderarla.',
      'Porque el crecimiento serio no se improvisa. Se diseña.',
      'VIA fue diseñado para acompañarte en este proceso.',
    ],
  },

  /* ---- OUTCOMES ---- */
  outcomes: {
    id: 'resultados',
    title: 'Lo que cambia cuando usas VIA',
    bullets: [
      'Tienes claridad mental.',
      'Reduces la culpa improductiva.',
      'Tomas decisiones con dirección.',
      'Conectas tus acciones con propósito.',
      'Alineas tu dinero con tus prioridades.',
      'Construyes ritmo sostenible.',
      'Dejas de reaccionar y empiezas a diseñar.',
    ],
  },

  /* ---- FAQ ---- */
  faq: {
    id: 'faq',
    title: 'Preguntas frecuentes',
    items: [
      {
        question: '¿Es un sistema financiero?',
        answer:
          'No es una app de contabilidad. Es una herramienta para conectar tus metas con tus decisiones financieras.',
      },
      {
        question: '¿Necesito usarla todos los días?',
        answer:
          'No. VIA está diseñada para sostener ritmo realista, no perfección.',
      },
      {
        question: '¿Es como Notion o una agenda digital?',
        answer:
          'No. Es un sistema coherente específicamente para integrar diagnóstico, metas y acción.',
      },
      {
        question: '¿La mentoría es obligatoria?',
        answer: 'No. Puedes acceder solo a la plataforma.',
      },
      {
        question: '¿Cómo se realiza el pago?',
        answer: 'La activación se gestiona vía WhatsApp.',
      },
    ],
  },

  /* ---- FINAL CTA ---- */
  finalCta: {
    id: 'cta-final',
    copy: [
      'Si tu vida es tu proyecto más importante,',
      'merece un sistema.',
    ],
    ctas: [
      { label: 'Acceder a VIA', href: WA_ACCESS, variant: 'default' },
      {
        label: 'Acceso + Mentoría',
        href: WA_MENTORSHIP,
        variant: 'outline',
      },
    ],
    note: 'Activación y pago vía WhatsApp.',
  },

  /* ---- SCHOLARSHIP ---- */
  scholarship: {
    id: 'becas',
    title: 'Programa de Becas VIA',
    subtitle: 'Por más mujeres diseñando sus vidas con proposito.',
    intro: [
      'La claridad estratégica no debería depender de las circunstancias. Creemos en la igualdad de oportunidades para pensar en grande, decidir con criterio y construir con coherencia.',
      'Por eso, VIA otorga 2 becas completas cada mes a universitarias que estén listas para liderar su propio camino con intención y visión.',
    ],
    includesTitle: '¿Qué incluye la beca?',
    includes: [
      'Acceso completo a VIA',
      '1 sesión estratégica personalizada',
      'Acompañamiento en la construcción de su primer Plan de Vida',
      'Alineación entre metas académicas, profesionales y financieras',
    ],
    includesNote:
      'La experiencia es exactamente la misma que la modalidad premium.',
    includeImage: {
      src: '/assets/landing/becas.png',
      alt: 'Programa de Becas VIA',
    },
    audienceTitle: '¿A quién está dirigido?',
    audienceIntro: 'Universitarias que:',
    audienceBullets: [
      'Tengan alto compromiso con su desarrollo.',
      'Estén en transición académica o profesional.',
      'Busquen claridad estratégica más allá de la motivación.',
      'Quieran diseñar su futuro con estructura real.',
    ],
    processTitle: 'Proceso de selección',
    processIntro: 'Cada mes se abren 2 cupos.',
    formFields: [
      { name: 'nombre', label: 'Nombre y Apellido', type: 'text', required: true },
      { name: 'email', label: 'Correo electrónico', type: 'email', required: true, placeholder: 'tu@correo.com' },
      { name: 'edad', label: 'Edad', type: 'number', required: true },
      { name: 'centro', label: 'Centro de estudios', type: 'text', required: true },
      { name: 'telefono', label: 'Teléfono', type: 'phone', required: true },
      { name: 'carrera', label: 'Carrera', type: 'text', required: true },
      { name: 'ubicacion', label: 'País y Ciudad', type: 'text', required: true },
      { name: 'pais', label: 'País', type: 'country-select', required: true },
      { name: 'ciudad', label: 'Ciudad', type: 'text', required: true, placeholder: 'Tu ciudad' },
      {
        name: 'construyendo',
        label: '¿Qué estás intentando construir actualmente?',
        type: 'textarea',
        required: true,
      },
      {
        name: 'motivacion',
        label: '¿Qué te motiva a acceder a esta beca?',
        type: 'textarea',
        required: true,
      },
    ],
    processNote: 'Las seleccionadas son notificadas directamente.',
    cta: {
      label: 'Postular a Beca VIA',
      href: '#becas',
      variant: 'default',
      scrollTo: 'becas',
    },
  },
};
