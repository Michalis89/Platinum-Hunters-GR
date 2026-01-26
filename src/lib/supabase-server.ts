import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

/**
 * Supabase Server Client (Service Role)
 *
 * Creates a fresh client per invocation to avoid shared state in serverless.
 * Uses the service role key for elevated permissions (admin operations).
 *
 * IMPORTANT: This client bypasses Row Level Security (RLS).
 * Only use for admin operations that require elevated permissions.
 *
 * For user-context operations in API routes, use createRouteHandlerClient() instead.
 */
const createSupabaseServer = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * Get a fresh Supabase server client.
 *
 * Each call creates a new client instance to ensure no shared mutable state
 * between serverless function invocations.
 */
const getSupabaseServer = () => createSupabaseServer();

export default getSupabaseServer;
