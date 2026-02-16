import { withApiRoute } from '@/lib/observability/withApiRoute';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { API_ERRORS } from '@/lib/api/errors';
import { fail, ok } from '@/lib/api/response';
import { clearAuthCookies } from '@/lib/auth';

async function POSTHandler() {
  try {
    const supabase = await createRouteHandlerClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      return fail({ error: 'Logout error' }, 500);
    }

    await clearAuthCookies();

    return ok({
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

export const POST = withApiRoute(POSTHandler);
