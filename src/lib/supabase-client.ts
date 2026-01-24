/**
 * Supabase Client for Browser
 * PH-30: User Authentication System
 *
 * This client is used in client components (browser)
 * For server-side, use supabase-server.ts
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY',
  );
}

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
    storageKey: 'platinum-hunters-auth',
    // Use localStorage for session storage
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  global: {
    headers: {
      'x-application-name': 'platinum-hunters-gr',
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
export function onAuthStateChange(
  callback: (event: string, session: unknown) => void,
) {
  return supabase.auth.onAuthStateChange(callback);
}
