import type { SupabaseClient } from '@supabase/supabase-js';
import { API_ERRORS } from '@/lib/api/errors';

export class UnauthorizedError extends Error {
  code = API_ERRORS.UNAUTHORIZED.code;
}

export async function requireAuth(supabase: SupabaseClient) {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    throw new UnauthorizedError();
  }

  return session;
}
