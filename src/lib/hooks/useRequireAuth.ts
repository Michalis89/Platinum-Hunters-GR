'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectIsLoading } from '@/store/slices/authSlice';

export const RETURN_URL_KEY = 'platinum-hunters-return-url';

type UseRequireAuthOptions = {
  redirectPath?: string;
};

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

      const target =
        redirectPath ?? `/pages/auth/login?redirect=${encodeURIComponent(currentUrl)}`;
      router.push(target);
    }
  }, [isAuthenticated, isLoading, redirectPath, router]);

  return { isAuthenticated, isLoading };
}
