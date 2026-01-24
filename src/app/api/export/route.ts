import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { data: wheels } = await supabase
    .from('wheels')
    .select(`
      *,
      domains (*),
      scores (*),
      priorities (*),
      reflections (*),
      ideal_life (*),
      action_plans (*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({
    exported_at: new Date().toISOString(),
    user_id: user.id,
    wheels: wheels || [],
  });
}
