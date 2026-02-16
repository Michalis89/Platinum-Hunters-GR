import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const AUTH_STORAGE_KEY = 'hobbistas-hub-auth';
const AUTH_PERSISTENCE_KEY = 'hobbistas-hub-auth-persist';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY',
  );
}

function getPersistencePreference(): boolean {
  if (typeof window === 'undefined') {return true;}
  try {
    const value = window.localStorage.getItem(AUTH_PERSISTENCE_KEY);
    if (value === null) {return true;}
    return value === 'true';
  } catch {
    return true;
  }
}

export function isAuthPersistenceEnabled(): boolean {
  return getPersistencePreference();
}

export function setAuthPersistence(enabled: boolean): void {
  if (typeof window === 'undefined') {return;}

  try {
    window.localStorage.setItem(AUTH_PERSISTENCE_KEY, enabled ? 'true' : 'false');
  } catch {
    // Ignore storage errors.
  }

  try {
    const localValue = window.localStorage.getItem(AUTH_STORAGE_KEY);
    const sessionValue = window.sessionStorage.getItem(AUTH_STORAGE_KEY);

    if (enabled) {
      if (sessionValue) {
        window.localStorage.setItem(AUTH_STORAGE_KEY, sessionValue);
        window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
      }
      return;
    }

    if (localValue) {
      window.sessionStorage.setItem(AUTH_STORAGE_KEY, localValue);
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors.
  }
}

const supabaseStorage = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') {return null;}

    try {
      const shouldPersist = getPersistencePreference();
      const primary = shouldPersist ? window.localStorage : window.sessionStorage;
      const fallback = shouldPersist ? window.sessionStorage : window.localStorage;

      const primaryValue = primary.getItem(key);
      if (primaryValue !== null) {
        return primaryValue;
      }

      const fallbackValue = fallback.getItem(key);
      if (fallbackValue !== null) {
        primary.setItem(key, fallbackValue);
        fallback.removeItem(key);
      }

      return fallbackValue;
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') {return;}

    try {
      const shouldPersist = getPersistencePreference();
      const primary = shouldPersist ? window.localStorage : window.sessionStorage;
      const fallback = shouldPersist ? window.sessionStorage : window.localStorage;
      primary.setItem(key, value);
      fallback.removeItem(key);
    } catch {
      // Ignore storage errors.
    }
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') {return;}

    try {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    } catch {
      // Ignore storage errors.
    }
  },
};

/**
 * Supabase client for browser with auth enabled
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable automatic token refresh
    autoRefreshToken: true,
    // Persist session in localStorage
    persistSession: true,
    // Detect session from URL (for email confirmation, password reset, etc.)
    detectSessionInUrl: true,
    // Storage key for session
    storageKey: AUTH_STORAGE_KEY,
    // Use adaptive storage: localStorage for remember-me, sessionStorage otherwise
    storage: typeof window !== 'undefined' ? supabaseStorage : undefined,
  },
  global: {
    headers: {
      'x-application-name': 'hobbistas-hub-com',
    },
  },
});

/**
 * Get current session
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  return data.session;
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  return data.user;
}

/**
 * Sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: unknown) => void) {
  return supabase.auth.onAuthStateChange(callback);
}
