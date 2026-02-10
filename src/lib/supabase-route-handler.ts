/**
 * Supabase Client for API Route Handlers
 * Handles cookies for user sessions
 */

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/supabase/database.types';

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
      autoRefreshToken: true,
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

  // If we have both tokens, set the full session
  // Only call setSession when we have a valid refresh token to avoid unexpected behavior
  if (accessToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }
  // If we only have access token, the Authorization header is already set above
  // and we skip setSession to avoid passing empty refresh token

  return supabase;
}
