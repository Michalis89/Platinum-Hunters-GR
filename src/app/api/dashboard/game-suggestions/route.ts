import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/observability/withApiRoute';

import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { API_ERRORS } from '@/lib/api/errors';
import { fail } from '@/lib/api/response';
import { buildGameSuggestions } from '@/lib/dashboard/gameSuggestionsEngine';

async function GETHandler() {
  try {
    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);
    const suggestions = await buildGameSuggestions({ supabase, userId: session.user.id });

    const response = NextResponse.json(suggestions);
    // Temporarily disable cache for testing (restore to 86400 after testing)
    response.headers.set('Cache-Control', 'no-store, must-revalidate');
    return response;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    console.error('Game suggestions error:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

export const GET = withApiRoute(GETHandler);
