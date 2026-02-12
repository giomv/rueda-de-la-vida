import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const REQUIRED_FIELDS = [
  'nombre',
  'edad',
  'centro',
  'carrera',
  'ubicacion',
  'construyendo',
  'motivacion',
] as const;

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

  const age = Number(body.edad);
  if (!Number.isInteger(age) || age < 1 || age > 120) {
    return NextResponse.json({ error: 'Invalid age' }, { status: 400 });
  }

  const supabase = await createClient();

  const { error } = await supabase.from('scholarship_applications').insert({
    name: body.nombre.trim(),
    age,
    institution: body.centro.trim(),
    career: body.carrera.trim(),
    location: body.ubicacion.trim(),
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
