import { type NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase-middleware';

const PROTECTED_ROUTES = [
  '/dashboard',
  '/pages/profile',
  '/pages/backlog',
  '/pages/support',
  '/admin',
];
const AUTH_ROUTES = ['/pages/auth/login', '/pages/auth/register', '/forgot-password'];

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

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return;
  }

  // Check if this is a protected route BEFORE trying to get user
  const isProtectedRoute = PROTECTED_ROUTES.some(
    route => pathname === route || pathname.startsWith(`${route}/`),
  );
  const isAuthRoute = AUTH_ROUTES.some(
    route => pathname === route || pathname.startsWith(`${route}/`),
  );

  try {
    const { user, response } = await createMiddlewareClient(request);

    // Redirect to login if not authenticated
    if (isProtectedRoute && !user) {
      const redirectUrl = new URL('/pages/auth/login', request.url);
      redirectUrl.searchParams.set('redirectTo', pathname);
      return Response.redirect(redirectUrl);
    }

    // Check email confirmation for protected routes
    if (isProtectedRoute && user && !user.email_confirmed_at) {
      const redirectUrl = new URL('/pages/auth/confirm-email', request.url);
      redirectUrl.searchParams.set('state', 'pending');
      return Response.redirect(redirectUrl);
    }

    // Redirect authenticated users away from auth routes (only if email confirmed)
    if (isAuthRoute && user) {
      if (user.email_confirmed_at) {
        const redirectTo = request.nextUrl.searchParams.get('redirectTo');
        const redirectUrl = new URL(redirectTo || '/pages/profile', request.url);
        return Response.redirect(redirectUrl);
      }
      // If email not confirmed, allow access to auth routes (like confirm-email)
    }

    // ✅ Apply CSP here (dev vs prod)
    const isProd = process.env.NODE_ENV === 'production';
    response.headers.set('Content-Security-Policy', buildCsp(isProd));

    return response;
  } catch (error) {
    console.error('Middleware error:', error);

    // If error occurred on protected route (likely expired session), redirect to login
    if (isProtectedRoute) {
      const redirectUrl = new URL('/pages/auth/login', request.url);
      redirectUrl.searchParams.set('redirectTo', pathname);
      return Response.redirect(redirectUrl);
    }

    // For non-protected routes, continue with default response
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const isProd = process.env.NODE_ENV === 'production';
    response.headers.set('Content-Security-Policy', buildCsp(isProd));

    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap|robots.txt|.*\\..*$).*)'],
};
