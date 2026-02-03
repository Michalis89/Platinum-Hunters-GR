import { withApiRoute } from '@/lib/observability/withApiRoute';

import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import getSupabaseServer from '@/lib/supabase-server';
import { API_ERRORS } from '@/lib/api/errors';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { fail, ok } from '@/lib/api/response';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit';

async function POSTHandler(req: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);
    const userId = session.user.id;

    // Rate limit: 1 deletion attempt per hour per user (Redis-backed, serverless-safe)
    const rateLimitResult = await rateLimit('deleteAccount', userId);

    if (!rateLimitResult.success) {
      return fail(
        { error: 'Πολλές προσπάθειες. Δοκιμάστε ξανά αργότερα.' },
        429,
        { headers: rateLimitHeaders(rateLimitResult) }
      );
    }

    // Require password confirmation
    const body = await req.json().catch(() => ({}));
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return fail({ error: 'Απαιτείται ο κωδικός πρόσβασης για επιβεβαίωση' }, 400);
    }

    // Verify password by attempting to sign in
    const userEmail = session.user.email;
    if (!userEmail) {
      return fail({ error: 'Δεν βρέθηκε email χρήστη' }, 400);
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password,
    });

    if (authError) {
      return fail({ error: 'Λάθος κωδικός πρόσβασης' }, 401);
    }

    // Delete user data first (auth deletion will cascade)
    const { error: deleteError } = await supabase.from('users').delete().eq('id', userId);

    if (deleteError) {
      console.error('User deletion error:', deleteError);
      return fail({ error: 'Σφάλμα διαγραφής λογαριασμού' }, 500);
    }

    // Delete from auth
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

export const POST = withApiRoute(POSTHandler);
