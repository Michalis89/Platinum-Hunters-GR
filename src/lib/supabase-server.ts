import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseServer: SupabaseClient | null = null;

const createSupabaseServer = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

const getSupabaseServer = () => {
  supabaseServer ??= createSupabaseServer();
  return supabaseServer;
};

export default getSupabaseServer;
