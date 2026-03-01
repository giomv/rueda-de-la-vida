import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public auth routes accessible without login
  const isPublicAuthRoute =
    pathname.startsWith('/registro-invitacion');

  if (isPublicAuthRoute) {
    return supabaseResponse;
  }

  // Protected routes: redirect to login if not authenticated
  const isAppRoute = pathname.startsWith('/dashboard') ||
    pathname.startsWith('/rueda') ||
    pathname.startsWith('/mis-ruedas') ||
    pathname.startsWith('/plan-de-vida') ||
    pathname.startsWith('/comparar') ||
    pathname.startsWith('/pareja') ||
    pathname.startsWith('/perfil') ||
    pathname.startsWith('/ayuda') ||
    pathname.startsWith('/bitacora') ||
    pathname.startsWith('/espacios') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/cambiar-clave');

  // Check for guest token
  const guestToken = request.cookies.get('guest_token')?.value;

  if (isAppRoute && !user && !guestToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If user is authenticated, check for force password change and admin routes
  if (user && isAppRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, force_password_change, is_enabled')
      .eq('id', user.id)
      .single();

    // Disabled user: sign out and redirect to login
    if (profile?.is_enabled === false) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('disabled', 'true');
      return NextResponse.redirect(url);
    }

    // Force password change: redirect everywhere except /cambiar-clave
    if (profile?.force_password_change && !pathname.startsWith('/cambiar-clave')) {
      const url = request.nextUrl.clone();
      url.pathname = '/cambiar-clave';
      return NextResponse.redirect(url);
    }

    // Admin routes: only admins can access
    if (pathname.startsWith('/admin') && profile?.role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    // Admin users can only access /admin routes
    if (profile?.role === 'admin' && !pathname.startsWith('/admin') && !pathname.startsWith('/cambiar-clave')) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated users away from auth pages
  const isAuthRoute = pathname.startsWith('/login') ||
    pathname.startsWith('/recuperar-clave');

  if (isAuthRoute && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const url = request.nextUrl.clone();
    url.pathname = profile?.role === 'admin' ? '/admin' : '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
