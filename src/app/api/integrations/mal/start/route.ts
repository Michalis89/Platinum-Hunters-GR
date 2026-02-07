import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/observability/withApiRoute';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import {
  MAL_OAUTH_CATEGORY_COOKIE,
  MAL_OAUTH_STATE_COOKIE,
  MAL_OAUTH_USER_COOKIE,
  MAL_OAUTH_VERIFIER_COOKIE,
  buildMalAuthorizeUrl,
  generatePkceState,
  getMalOAuthConfig,
} from '@/lib/integrations/mal';

async function GETHandler(req: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);
    const { searchParams } = new URL(req.url);
    const requestedCategory = searchParams.get('category');
    const syncCategory = requestedCategory === 'manga' ? 'manga' : 'anime';

    const { clientId, redirectUri } = getMalOAuthConfig();
    const { state, codeVerifier, codeChallenge } = generatePkceState();

    const authorizeUrl = buildMalAuthorizeUrl({
      clientId,
      redirectUri,
      state,
      codeChallenge,
    });

    const res = NextResponse.redirect(authorizeUrl.toString()); // <- string

    const cookieOptions = {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 10,
    };

    res.cookies.set(MAL_OAUTH_STATE_COOKIE, state, cookieOptions);
    res.cookies.set(MAL_OAUTH_VERIFIER_COOKIE, codeVerifier, cookieOptions);
    res.cookies.set(MAL_OAUTH_USER_COOKIE, session.user.id, cookieOptions);
    res.cookies.set(MAL_OAUTH_CATEGORY_COOKIE, syncCategory, cookieOptions);

    return res;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('MAL start error:', error);
    return NextResponse.json({ error: 'Failed to start MAL OAuth flow' }, { status: 500 });
  }
}

export const GET = withApiRoute(GETHandler);
