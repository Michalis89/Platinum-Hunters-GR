/**
 * Session API Route
 * GET /api/auth/session
 * PH-30: User Authentication System
 */

import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { cookies } from 'next/headers';
import type { User } from '@/types/user';
import { API_ERRORS } from '@/lib/api/errors';
import { fail, ok } from '@/lib/api/response';

export async function GET() {
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

    const typedUserProfile = userProfile as User;

    // Check if account is deleted, suspended, or banned
    if (typedUserProfile.account_status === 'deleted') {
      // Sign out the user and clear cookies
      await supabase.auth.signOut();

      // Clear session cookies
      const cookieStore = await cookies();
      cookieStore.delete('sb-access-token');
      cookieStore.delete('sb-refresh-token');

      return ok({ user: null, session: null });
    }

    if (typedUserProfile.account_status === 'suspended' || typedUserProfile.account_status === 'banned') {
      // Sign out suspended/banned users
      await supabase.auth.signOut();

      // Clear session cookies
      const cookieStore = await cookies();
      cookieStore.delete('sb-access-token');
      cookieStore.delete('sb-refresh-token');

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
