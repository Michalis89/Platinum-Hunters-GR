import { type NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase-middleware';
import {
  LOGIN_REQUIRED_PREFIXES,
  AUTH_ROUTES,
  DASHBOARD_PATH,
  HOME_PATHS,
} from '@/lib/routes/authRoutes';
import { clearAuthCookiesFromResponse } from '@/lib/auth/cookies';

function buildCsp(isProd: boolean) {
  const scriptSrc = [`'self'`, ...(isProd ? [] : [`'unsafe-eval'`])];

  return [
    `default-src 'self'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    `frame-ancestors 'none'`,
    `script-src ${scriptSrc.join(' ')}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https:`,
    `font-src 'self' data:`,
    `connect-src 'self' https: wss:`,
    `media-src 'self' https:`,
    `worker-src 'self' blob:`,
    `form-action 'self'`,
  ].join('; ');
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const redirectBack = `${pathname}${request.nextUrl.search}`;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return;
  }

  const matchesRoute = (route: string) => pathname === route || pathname.startsWith(`${route}/`);
  const requiresAuth = LOGIN_REQUIRED_PREFIXES.some(matchesRoute);
  const isDashboardRoute = pathname === DASHBOARD_PATH;
  const isHomeRoute = HOME_PATHS.includes(pathname);
  const isProtectedRoute = requiresAuth || isDashboardRoute;
  const isAuthRoute = AUTH_ROUTES.some(
    route => pathname === route || pathname.startsWith(`${route}/`),
  );

  try {
    const { user, response } = await createMiddlewareClient(request);

    if (!user) {
      // Clear any stale/expired auth cookies when no valid user session exists
      clearAuthCookiesFromResponse(response);

      if (isDashboardRoute) {
        const redirectResponse = NextResponse.redirect(new URL('/home', request.url));
        clearAuthCookiesFromResponse(redirectResponse);
        return redirectResponse;
      }
      if (requiresAuth) {
        const redirectUrl = new URL('/auth/login', request.url);
        redirectUrl.searchParams.set('redirectTo', redirectBack);
        const redirectResponse = NextResponse.redirect(redirectUrl);
        clearAuthCookiesFromResponse(redirectResponse);
        return redirectResponse;
      }
    }

    // Check email confirmation for protected routes
    if (isProtectedRoute && user && !user.email_confirmed_at) {
      const redirectUrl = new URL('/auth/confirm-email', request.url);
      redirectUrl.searchParams.set('state', 'pending');
      return NextResponse.redirect(redirectUrl);
    }

    if (isHomeRoute && user) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Redirect authenticated users away from auth routes (only if email confirmed)
    if (isAuthRoute && user) {
      if (user.email_confirmed_at) {
        const redirectTo = request.nextUrl.searchParams.get('redirectTo');
        const redirectUrl = new URL(redirectTo || '/dashboard', request.url);
        return NextResponse.redirect(redirectUrl);
      }
      // If email not confirmed, allow access to auth routes (like confirm-email)
    }

    // ✅ Apply CSP here (dev vs prod)
    const isProd = process.env.NODE_ENV === 'production';
    response.headers.set('Content-Security-Policy', buildCsp(isProd));

    return response;
  } catch (error) {
    console.error('Middleware error:', error);

    // Clear expired/invalid auth cookies
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
    clearAuthCookiesFromResponse(response);

    if (isDashboardRoute) {
      const redirectResponse = NextResponse.redirect(new URL('/home', request.url));
      clearAuthCookiesFromResponse(redirectResponse);
      return redirectResponse;
    }
    if (requiresAuth) {
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('redirectTo', redirectBack);
      const redirectResponse = NextResponse.redirect(redirectUrl);
      clearAuthCookiesFromResponse(redirectResponse);
      return redirectResponse;
    }

    // For non-protected routes, continue with cleared cookies
    const isProd = process.env.NODE_ENV === 'production';
    response.headers.set('Content-Security-Policy', buildCsp(isProd));

    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap|robots.txt|.*\\..*$).*)'],
};
