import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function EspecialistaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'specialist') redirect('/dashboard');

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {children}
    </div>
  );
}
