import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import getSupabaseServer from '@/lib/supabase-server';
import { API_ERRORS } from '@/lib/api/errors';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { fail, ok } from '@/lib/api/response';

export async function POST() {
  try {
    const supabase = await createRouteHandlerClient();

    const session = await requireAuth(supabase);

    const userId = session.user.id;

    const { error: deleteError } = await supabase.from('users').delete().eq('id', userId);

    if (deleteError) {
      console.error('User deletion error:', deleteError);
      return fail({ error: 'Σφάλμα διαγραφής λογαριασμού' }, 500);
    }

    const supabaseAdmin = getSupabaseServer();
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error('Auth deletion error (continuing):', authDeleteError);
    }

    try {
      await supabase.auth.signOut();
    } catch (signOutError: unknown) {
      console.log('SignOut warning (continuing anyway):', signOutError);
    }

    return ok({
      message: 'Ο λογαριασμός διαγράφηκε επιτυχώς',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}
