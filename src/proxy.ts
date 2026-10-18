import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Sign-in gate. It runs before every page and every /api route.
 *
 * Sign-in is required on the online site (a production build) and switched off for local development.
 * To try the sign-in locally, start the dev server with REQUIRE_SIGN_IN=true.
 * (Kept inline on purpose: the proxy should not depend on shared modules.)
 */
const required = process.env.NODE_ENV === 'production' || process.env.REQUIRE_SIGN_IN === 'true';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/me'];

export async function proxy(request: NextRequest) {
  if (!required) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '',
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        // The session token is refreshed here, so the new cookies go on both the request and the response.
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // getClaims checks the signed token itself, so it does not need a round trip to Supabase on every request.
  let signedIn = false;
  try {
    const { data } = await supabase.auth.getClaims();
    signedIn = Boolean(data?.claims?.sub) && data?.claims?.is_anonymous !== true;
  } catch {
    signedIn = false;
  }

  if (signedIn) return response;

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  }
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  // Everything except Next's own static files and public images.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png).*)'],
};
