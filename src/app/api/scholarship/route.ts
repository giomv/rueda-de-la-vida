import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const REQUIRED_FIELDS = [
  'nombre',
  'email',
  'telefono',
  'edad',
  'centro',
  'carrera',
  'pais',
  'ciudad',
  'construyendo',
  'motivacion',
] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Validate required fields
  const missing = REQUIRED_FIELDS.filter((f) => !body[f]?.trim());
  if (missing.length > 0) {
    return NextResponse.json(
      { error: 'Missing required fields', fields: missing },
      { status: 400 },
    );
  }

  // Validate email
  if (!EMAIL_RE.test(body.email.trim())) {
    return NextResponse.json(
      { error: 'Correo electrónico inválido' },
      { status: 400 },
    );
  }

  // Validate phone (6-18 digits after stripping non-digits)
  const phoneDigits = body.telefono.replace(/\D/g, '');
  if (phoneDigits.length < 6 || phoneDigits.length > 18) {
    return NextResponse.json(
      { error: 'Número de teléfono inválido' },
      { status: 400 },
    );
  }

  const age = Number(body.edad);
  if (!Number.isInteger(age) || age < 1 || age > 120) {
    return NextResponse.json({ error: 'Invalid age' }, { status: 400 });
  }

  const supabase = await createClient();

  const { error } = await supabase.from('scholarship_applications').insert({
    name: body.nombre.trim(),
    email: body.email.trim(),
    phone: body.telefono.trim(),
    age,
    institution: body.centro.trim(),
    career: body.carrera.trim(),
    country: body.pais.trim(),
    city: body.ciudad.trim(),
    location: `${body.pais.trim()}, ${body.ciudad.trim()}`,
    building: body.construyendo.trim(),
    motivation: body.motivacion.trim(),
  });

  if (error) {
    console.error('Scholarship insert error:', error);
    return NextResponse.json(
      { error: 'Failed to save application' },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
