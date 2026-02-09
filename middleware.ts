import { type NextRequest } from 'next/server';
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

  try {
    const { user, response } = await createMiddlewareClient(request);

    const isProtectedRoute = PROTECTED_ROUTES.some(
      route => pathname === route || pathname.startsWith(`${route}/`),
    );
    const isAuthRoute = AUTH_ROUTES.some(
      route => pathname === route || pathname.startsWith(`${route}/`),
    );

    if (isProtectedRoute && !user) {
      const redirectUrl = new URL('/pages/auth/login', request.url);
      redirectUrl.searchParams.set('redirectTo', pathname);
      return Response.redirect(redirectUrl);
    }

    if (isAuthRoute && user) {
      const redirectTo = request.nextUrl.searchParams.get('redirectTo');
      const redirectUrl = new URL(redirectTo || '/dashboard', request.url);
      return Response.redirect(redirectUrl);
    }

    // ✅ Apply CSP here (dev vs prod)
    const isProd = process.env.NODE_ENV === 'production';
    response.headers.set('Content-Security-Policy', buildCsp(isProd));

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap|robots.txt|.*\\..*$).*)'],
};
