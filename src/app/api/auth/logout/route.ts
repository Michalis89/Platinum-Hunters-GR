import { withApiRoute } from '@/lib/observability/withApiRoute';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { API_ERRORS } from '@/lib/api/errors';
import { fail, ok } from '@/lib/api/response';
import { clearAuthCookies } from '@/lib/auth';

const NO_STORE_HEADERS = {
  headers: {
    'Cache-Control': 'no-store',
  },
} satisfies ResponseInit;

async function POSTHandler() {
  try {
    const supabase = await createRouteHandlerClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      return fail({ error: 'Logout error' }, 500, NO_STORE_HEADERS);
    }

    await clearAuthCookies();

    return ok(
      {
        message: 'Logout successful',
      },
      NO_STORE_HEADERS,
    );
  } catch (error) {
    console.error('Logout error:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status, NO_STORE_HEADERS);
  }
}

export const POST = withApiRoute(POSTHandler);
