import { withApiRoute } from '@/lib/observability/withApiRoute';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { API_ERRORS } from '@/lib/api/errors';
import { fail, ok } from '@/lib/api/response';
import { setAuthCookies } from '@/lib/auth';

async function POSTHandler(req: Request) {
  try {
    const cookieStore = await cookies();

    const existingRefreshToken = cookieStore.get('sb-refresh-token')?.value;
    if (!existingRefreshToken) {
      return fail({ error: 'Δεν υπάρχει ενεργή συνεδρία' }, 401);
    }

    const body = await req.json();
    const { access_token, refresh_token, remember } = body;
    const shouldRemember = remember === true;

    if (!access_token || !refresh_token) {
      return fail({ error: 'Λείπουν τα tokens' }, 400);
    }

    if (refresh_token !== existingRefreshToken) {
      console.info('Refresh token rotation detected; updating cookies with the latest token.');
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${access_token}` } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser(access_token);

    if (userError || !userData.user) {
      return fail({ error: 'Μη έγκυρο access token' }, 401);
    }

    // Set auth cookies using shared utility
    await setAuthCookies(access_token, refresh_token, shouldRemember);

    return ok({ success: true });
  } catch (error) {
    console.error('Token refresh error:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

export const POST = withApiRoute(POSTHandler);
