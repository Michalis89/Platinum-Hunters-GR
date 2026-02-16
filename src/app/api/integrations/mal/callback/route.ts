import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/observability/withApiRoute';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import {
  MAL_OAUTH_CATEGORY_COOKIE,
  MAL_OAUTH_STATE_COOKIE,
  MAL_OAUTH_USER_COOKIE,
  MAL_OAUTH_VERIFIER_COOKIE,
  exchangeMalAuthCode,
  getMalOAuthConfig,
} from '@/lib/integrations/mal';

function buildBacklogRedirect(
  requestUrl: string,
  status: 'success' | 'error',
  category: 'anime' | 'manga',
) {
  const redirectUrl = new URL(`/backlog?category=${category}`, requestUrl);
  redirectUrl.searchParams.set('mal', status);
  return redirectUrl;
}

async function redirectWithClear(
  req: Request,
  status: 'success' | 'error',
  extra?: Record<string, string>,
) {
  const cookieStore = await cookies();
  const oauthCategory = cookieStore.get(MAL_OAUTH_CATEGORY_COOKIE)?.value;
  const category = oauthCategory === 'manga' ? 'manga' : 'anime';
  const url = buildBacklogRedirect(req.url, status, category);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      url.searchParams.set(k, v);
    }
  }

  const res = NextResponse.redirect(url.toString());

  // Clear OAuth cookies reliably by attaching Set-Cookie headers to the response.
  res.cookies.set(MAL_OAUTH_STATE_COOKIE, '', { path: '/', expires: new Date(0) });
  res.cookies.set(MAL_OAUTH_VERIFIER_COOKIE, '', { path: '/', expires: new Date(0) });
  res.cookies.set(MAL_OAUTH_USER_COOKIE, '', { path: '/', expires: new Date(0) });
  res.cookies.set(MAL_OAUTH_CATEGORY_COOKIE, '', { path: '/', expires: new Date(0) });

  return res;
}

async function GETHandler(req: Request) {
  // Read-only cookie store (do NOT use it for delete/set in redirects).
  const cookieStore = await cookies();

  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const oauthError = searchParams.get('error');

    if (oauthError || !code || !state) {
      console.error('MAL callback: missing params or oauthError', {
        oauthError,
        hasCode: !!code,
        hasState: !!state,
      });
      return await redirectWithClear(req, 'error', { mal_reason: 'missing_params_or_oauth_error' });
    }

    const savedState = cookieStore.get(MAL_OAUTH_STATE_COOKIE)?.value;
    const codeVerifier = cookieStore.get(MAL_OAUTH_VERIFIER_COOKIE)?.value;
    const oauthUserId = cookieStore.get(MAL_OAUTH_USER_COOKIE)?.value;

    if (!savedState || !codeVerifier || !oauthUserId) {
      console.error('MAL callback: missing OAuth cookies', {
        hasSavedState: !!savedState,
        hasVerifier: !!codeVerifier,
        hasOauthUserId: !!oauthUserId,
      });
      return await redirectWithClear(req, 'error', { mal_reason: 'missing_oauth_cookies' });
    }

    if (state !== savedState) {
      console.error('MAL callback: state mismatch', { state, savedState });
      return await redirectWithClear(req, 'error', { mal_reason: 'state_mismatch' });
    }

    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);

    if (session.user.id !== oauthUserId) {
      console.error('MAL callback: oauth user mismatch', {
        sessionUserId: session.user.id,
        oauthUserId,
      });
      return await redirectWithClear(req, 'error', { mal_reason: 'oauth_user_mismatch' });
    }

    const { clientId, clientSecret, redirectUri } = getMalOAuthConfig();

    let tokens: Awaited<ReturnType<typeof exchangeMalAuthCode>>;
    try {
      tokens = await exchangeMalAuthCode({
        clientId,
        clientSecret,
        redirectUri,
        code,
        codeVerifier,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('MAL callback: token exchange failed', msg);
      return await redirectWithClear(req, 'error', {
        mal_reason: 'token_exchange_failed',
        mal_token_error: msg.slice(0, 180),
      });
    }

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    const scopes = tokens.scope
      ? tokens.scope
          .split(' ')
          .map(value => value.trim())
          .filter(Boolean)
      : [];

    const { error: integrationError } = await supabase.from('user_integrations' as never).upsert(
      {
        user_id: session.user.id,
        provider: 'mal',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        scopes,
      } as never,
      { onConflict: 'user_id,provider' },
    );

    if (integrationError) {
      console.error('MAL callback: integration upsert error:', integrationError);
      return await redirectWithClear(req, 'error', { mal_reason: 'integration_upsert_failed' });
    }

    console.warn('MAL callback: success', { userId: session.user.id, scopes, expiresAt });
    return await redirectWithClear(req, 'success');
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      console.error('MAL callback: unauthorized');
      return await redirectWithClear(req, 'error', { mal_reason: 'unauthorized' });
    }

    const msg = error instanceof Error ? error.message : String(error);
    console.error('MAL callback: unexpected error', msg);
    return await redirectWithClear(req, 'error', { mal_reason: 'unexpected_error' });
  }
}

export const GET = withApiRoute(GETHandler);
