'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectIsLoading } from '@/store/slices/authSlice';

/**
 * @deprecated This hook is deprecated and should no longer be used.
 *
 * Authentication is now handled server-side via middleware.ts which provides:
 * - Faster redirects (no client-side delay)
 * - Better SEO (immediate server response)
 * - Reduced JavaScript bundle size
 * - Improved INP (Interaction to Next Paint) performance
 *
 * Protected routes are automatically secured by middleware. Remove this hook from your components.
 *
 * Migration: Delete calls to useRequireAuth() - middleware handles auth checks automatically.
 */
export const RETURN_URL_KEY = 'hobbistas-hub-return-url';

type UseRequireAuthOptions = {
  redirectPath?: string;
};

/**
 * @deprecated Use middleware.ts for authentication instead.
 * This hook remains only for backward compatibility with the RETURN_URL_KEY constant.
 */
export function useRequireAuth({ redirectPath }: UseRequireAuthOptions = {}) {
  const router = useRouter();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectIsLoading);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      if (typeof window === 'undefined') return;

      const currentUrl = window.location.pathname + window.location.search;
      try {
        window.sessionStorage.setItem(RETURN_URL_KEY, currentUrl);
      } catch {
        // Ignore storage errors
      }

      const target = redirectPath ?? `/pages/auth/login?redirect=${encodeURIComponent(currentUrl)}`;
      router.push(target);
    }
  }, [isAuthenticated, isLoading, redirectPath, router]);

  return { isAuthenticated, isLoading };
}
