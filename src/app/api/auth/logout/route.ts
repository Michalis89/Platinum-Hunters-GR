/**
 * Logout API Route
 * POST /api/auth/logout
 * PH-30: User Authentication System
 */

import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { cookies } from 'next/headers';
import { API_ERRORS } from '@/lib/api/errors';
import { fail, ok } from '@/lib/api/response';

export async function POST() {
  try {
    const supabase = await createRouteHandlerClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      return fail({ error: 'Σφάλμα αποσύνδεσης' }, 500);
    }

    // Clear session cookies
    const cookieStore = await cookies();
    cookieStore.delete('sb-access-token');
    cookieStore.delete('sb-refresh-token');

    return ok({
      message: 'Επιτυχής αποσύνδεση',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}
