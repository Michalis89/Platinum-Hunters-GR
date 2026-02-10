import { withApiRoute } from '@/lib/observability/withApiRoute';

import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import type { Database } from '@/lib/supabase/database.types';
import { API_ERRORS } from '@/lib/api/errors';
import { fail, ok } from '@/lib/api/response';
import { clearAuthCookies } from '@/lib/auth';

async function GETHandler() {
  try {
    const supabase = await createRouteHandlerClient();

    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError);
      return fail({ error: 'Σφάλμα ελέγχου session' }, 500);
    }

    if (!session) {
      return ok({ user: null, session: null });
    }

    // Fetch user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return fail({ error: 'Σφάλμα φόρτωσης προφίλ' }, 500);
    }

    const typedUserProfile = userProfile as Database['public']['Tables']['users']['Row'];

    // Check if account is deleted, suspended, or banned
    if (typedUserProfile.account_status === 'deleted') {
      // Sign out the user and clear cookies
      await supabase.auth.signOut();
      await clearAuthCookies();

      return ok({ user: null, session: null });
    }

    if (
      typedUserProfile.account_status === 'suspended' ||
      typedUserProfile.account_status === 'banned'
    ) {
      // Sign out suspended/banned users
      await supabase.auth.signOut();
      await clearAuthCookies();

      return fail(
        {
          error:
            typedUserProfile.account_status === 'suspended'
              ? 'Ο λογαριασμός σας έχει ανασταλεί'
              : 'Ο λογαριασμός σας έχει αποκλειστεί',
        },
        403,
      );
    }

    return ok({
      user: typedUserProfile,
      session,
    });
  } catch (error) {
    console.error('Session error:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

export const GET = withApiRoute(GETHandler);
