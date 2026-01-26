'use client';

/**
 * AuthInit Component
 * Initializes authentication state on app mount
 * PH-30: User Authentication System
 */

import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSession, setUser, logout, selectUser } from '@/store/slices/authSlice';
import { supabase } from '@/lib/supabase-client';
import type { AppDispatch } from '@/store/store';

const AUTH_STORAGE_KEY = 'platinum-hunters-auth';
const RETURN_URL_KEY = 'platinum-hunters-return-url';
const SESSION_CHECK_INTERVAL_MS = 60 * 1000; // Check every 1 minute

/**
 * Check if a session token is expired or expiring soon
 */
function isTokenExpired(expiresAt: number | undefined | null): boolean {
  if (!expiresAt) {
    return false;
  }
  const expiresAtMs = expiresAt * 1000;
  const now = Date.now();
  return expiresAtMs <= now;
}

/**
 * Safely remove auth data from storage and cookies
 */
function clearAuthStorage() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // ignore storage errors (e.g., SSR, private browsing)
  }
  try {
    if (typeof document !== 'undefined') {
      const cookieNames = ['sb-access-token', 'sb-refresh-token'];
      cookieNames.forEach(name => {
        document.cookie = `${name}=; Max-Age=0; path=/`;
      });
    }
  } catch {
    // ignore cookie errors
  }
}

/**
 * Sync session tokens to httpOnly cookies via API
 * This ensures the backend can read the latest tokens
 */
async function syncCookies(session: { access_token: string; refresh_token: string; expires_in?: number }) {
  try {
    await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in || 3600,
      }),
    });
  } catch {
    // ignore sync errors - not critical
  }
}

export default function AuthInit() {
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector(selectUser);
  const currentUserRef = useRef(currentUser);
  const initialFetchInFlight = useRef(false);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  /**
   * Force logout and clear all auth state
   * Saves current URL so user can return after login
   */
  const forceLogout = useCallback(async () => {
    // Save current URL for redirect after login (only if on a protected page)
    try {
      const currentPath = window.location.pathname + window.location.search;
      // Don't save auth pages as return URL
      if (!currentPath.startsWith('/pages/auth')) {
        sessionStorage.setItem(RETURN_URL_KEY, currentPath);
      }
    } catch {
      // ignore storage errors
    }

    clearAuthStorage();
    try {
      await dispatch(logout());
    } catch {
      // signOut can fail if already signed out; ignore
    }
    dispatch(setUser(null));
  }, [dispatch]);

  /**
   * Validate session by checking with server (getUser makes an API call)
   * This is more reliable than getSession which only reads localStorage
   */
  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      // First check localStorage session for quick expiry check
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        return false;
      }

      // Check if token is already expired based on expires_at
      const expired = isTokenExpired(sessionData.session.expires_at);
      if (expired) {
        return false;
      }

      // Validate with server - getUser() makes an actual API call
      // This catches cases where token was revoked server-side
      const { data: userData, error } = await supabase.auth.getUser();
      if (error || !userData.user) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }, []);

  // Fetch session on mount with validation
  useEffect(() => {
    const initAuth = async () => {
      initialFetchInFlight.current = true;

      // Check if there's stored auth data and validate it
      const isValid = await validateSession();

      if (!isValid) {
        // Clear invalid session immediately
        await forceLogout();
      } else {
        // Valid session - sync cookies and fetch profile
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          await syncCookies(sessionData.session);
        }
        await dispatch(fetchSession());
      }

      initialFetchInFlight.current = false;
    };

    initAuth();

    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session || event === 'SIGNED_OUT') {
        dispatch(setUser(null));
        clearAuthStorage();
        return;
      }

      if (event === 'SIGNED_IN') {
        if (currentUserRef.current) {
          return;
        }
        // Sync cookies on sign in
        await syncCookies(session);
        dispatch(fetchSession());
        return;
      }

      if (event === 'TOKEN_REFRESHED' && session) {
        // Sync cookies when token is refreshed
        await syncCookies(session);
      }
      // USER_UPDATED, PASSWORD_RECOVERY etc. will keep existing state
    });

    return () => {
      subscription?.subscription?.unsubscribe();
    };
  }, [dispatch, forceLogout, validateSession]);

  // Keep session fresh on focus/interval to avoid stale "logged-in" UI after expiry
  useEffect(() => {
    let cancelled = false;
    let lastCheckTime = 0;
    const FOCUS_CHECK_DEBOUNCE_MS = 5000; // Don't check more than once every 5 seconds on focus

    // Quick check on focus - only validates localStorage expiry, no API call
    const quickCheckSession = async () => {
      if (initialFetchInFlight.current) return;
      if (!currentUser) return;

      // Debounce: don't check too frequently
      const now = Date.now();
      if (now - lastCheckTime < FOCUS_CHECK_DEBOUNCE_MS) return;
      lastCheckTime = now;

      const { data, error } = await supabase.auth.getSession();
      if (cancelled) return;

      // If the token is gone/invalid, clear user
      if (error || !data.session) {
        await forceLogout();
        return;
      }

      // Check token expiration from localStorage only (no API call)
      const expired = isTokenExpired(data.session.expires_at);

      if (expired) {
        await forceLogout();
      }
      // Note: We don't call fetchSession() here even if expiring soon.
      // Supabase handles token refresh automatically. Calling fetchSession
      // would cause isLoading to change, triggering re-renders that unmount
      // components like ActivityFeed, causing unwanted data refetches.
    };

    // Full validation with server - only on interval
    const fullCheckSession = async () => {
      if (initialFetchInFlight.current) return;
      if (!currentUser) return;

      const isValid = await validateSession();
      if (cancelled) return;

      if (!isValid) {
        await forceLogout();
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') quickCheckSession();
    };
    const onFocus = () => quickCheckSession();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    // Full validation with server every 1 minute
    const intervalId = window.setInterval(fullCheckSession, SESSION_CHECK_INTERVAL_MS);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
      window.clearInterval(intervalId);
    };
  }, [dispatch, currentUser, forceLogout, validateSession]);

  // Idle logout after 1h of inactivity (only for authenticated users)
  useEffect(() => {
    const IDLE_LIMIT_MS = 60 * 60 * 1000; // 1 hour
    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        // If there is still a valid session, keep it; otherwise logout hard
        if (!data.session) {
          await dispatch(logout());
          dispatch(setUser(null));
          localStorage.removeItem('platinum-hunters-auth');
        }
      }, IDLE_LIMIT_MS);
    };

    const activityEvents = ['click', 'keydown', 'mousemove', 'touchstart', 'focus', 'visibilitychange'];
    const onActivity = () => resetTimer();

    activityEvents.forEach(ev => window.addEventListener(ev, onActivity));
    resetTimer();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      activityEvents.forEach(ev => window.removeEventListener(ev, onActivity));
    };
  }, [dispatch]);

  // This component doesn't render anything
  return null;
}
