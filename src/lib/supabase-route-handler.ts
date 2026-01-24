/**
 * Supabase Client for API Route Handlers
 * Handles cookies for user sessions
 */

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

type RouteHandlerOptions = {
  ignoreCookies?: boolean;
};

export async function createRouteHandlerClient(
  accessTokenOverride?: string,
  options: RouteHandlerOptions = {},
) {
  const { ignoreCookies = false } = options;
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // Get auth tokens from cookies (unless an override is provided)
  const accessToken =
    accessTokenOverride ??
    (ignoreCookies ? undefined : cookieStore.get('sb-access-token')?.value);
  const refreshToken =
    accessTokenOverride !== undefined || ignoreCookies
      ? undefined
      : cookieStore.get('sb-refresh-token')?.value;

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {},
    },
  });

  // If we have tokens, set the session (access only is OK for short-lived calls)
  if (accessToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || '',
    });
  }

  return supabase;
}
