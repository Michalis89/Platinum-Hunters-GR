import { withApiRoute } from '@/lib/observability/withApiRoute';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import type { Database } from '@/lib/supabase/database.types';
import { API_ERRORS } from '@/lib/api/errors';
import { fail, ok } from '@/lib/api/response';
import { clearAuthCookies } from '@/lib/auth';

const NO_STORE_HEADERS = {
  headers: {
    'Cache-Control': 'no-store',
  },
} satisfies ResponseInit;

async function GETHandler() {
  try {
    const supabase = await createRouteHandlerClient();

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError);
      return fail({ error: 'Session check error' }, 500, NO_STORE_HEADERS);
    }

    if (!session) {
      return ok({ user: null, session: null }, NO_STORE_HEADERS);
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return fail({ error: 'Profile loading error' }, 500, NO_STORE_HEADERS);
    }

    const typedUserProfile = userProfile as Database['public']['Tables']['users']['Row'];

    if (typedUserProfile.account_status === 'deleted') {
      await supabase.auth.signOut();
      await clearAuthCookies();

      return ok({ user: null, session: null }, NO_STORE_HEADERS);
    }

    if (
      typedUserProfile.account_status === 'suspended' ||
      typedUserProfile.account_status === 'banned'
    ) {
      await supabase.auth.signOut();
      await clearAuthCookies();

      return fail(
        {
          error:
            typedUserProfile.account_status === 'suspended'
              ? 'Your account has been suspended'
              : 'Your account has been blocked',
        },
        403,
        NO_STORE_HEADERS,
      );
    }

    return ok(
      {
        user: typedUserProfile,
        session,
      },
      NO_STORE_HEADERS,
    );
  } catch (error) {
    console.error('Session error:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status, NO_STORE_HEADERS);
  }
}

export const GET = withApiRoute(GETHandler);
