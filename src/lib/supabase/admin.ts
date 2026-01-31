import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

function getEnvVar(name: 'NEXT_PUBLIC_SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY'): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }

  return value;
}

export function createSupabaseAdminClient() {
  const url = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
  const key = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
    },
  });
}
