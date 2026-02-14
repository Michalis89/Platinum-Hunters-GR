const LOGIN_REQUIRED_PREFIXES = ['/pages/profile', '/pages/backlog', '/pages/support', '/admin'];
const DASHBOARD_PATH = '/dashboard';
const HOME_PATHS = ['/home', '/pages/home'];
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/reset-password',
  '/auth/confirm-email',
];

const matchesRoute = (route: string, pathname: string) =>
  pathname === route || pathname.startsWith(`${route}/`);

export const isProtectedRoute = (pathname: string) =>
  LOGIN_REQUIRED_PREFIXES.some(route => matchesRoute(route, pathname)) ||
  pathname === DASHBOARD_PATH;

export const isAuthRoute = (pathname: string) =>
  AUTH_ROUTES.some(route => matchesRoute(route, pathname));

export const shouldRedirectToLogin = (pathname: string) =>
  isProtectedRoute(pathname) && !isAuthRoute(pathname);

export const getLoginUrl = (redirectTo?: string) =>
  redirectTo ? `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}` : '/auth/login';

export { LOGIN_REQUIRED_PREFIXES, DASHBOARD_PATH, HOME_PATHS, AUTH_ROUTES };
