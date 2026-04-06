import 'whatwg-fetch';

jest.mock('next/server', () => ({
  __esModule: true,
  NextResponse: {
    redirect: jest.fn(),
  },
}));

const cookiesMock = jest.fn();
jest.mock('next/headers', () => ({
  __esModule: true,
  cookies: (...args: unknown[]) => cookiesMock(...args),
}));

jest.mock('@/lib/observability/withApiRoute', () => ({
  __esModule: true,
  withApiRoute: (handler: unknown) => handler,
}));

const createRouteHandlerClientMock = jest.fn();
jest.mock('@/lib/supabase-route-handler', () => ({
  __esModule: true,
  createRouteHandlerClient: (...args: unknown[]) => createRouteHandlerClientMock(...args),
}));

const requireAuthMock = jest.fn();
jest.mock('@/lib/api/auth', () => ({
  __esModule: true,
  requireAuth: (...args: unknown[]) => requireAuthMock(...args),
  UnauthorizedError: class UnauthorizedError extends Error {},
}));

const failMock = jest.fn((body: unknown, status: number) => ({
  status,
  json: async () => body,
}));
jest.mock('@/lib/api/response', () => ({
  __esModule: true,
  fail: (...args: unknown[]) => failMock(...args),
}));

const exchangeMalAuthCodeMock = jest.fn();
const getMalOAuthConfigMock = jest.fn();
jest.mock('@/lib/integrations/mal', () => ({
  __esModule: true,
  MAL_OAUTH_CATEGORY_COOKIE: 'mal-category',
  MAL_OAUTH_STATE_COOKIE: 'mal-state',
  MAL_OAUTH_USER_COOKIE: 'mal-user',
  MAL_OAUTH_VERIFIER_COOKIE: 'mal-verifier',
  exchangeMalAuthCode: (...args: unknown[]) => exchangeMalAuthCodeMock(...args),
  getMalOAuthConfig: (...args: unknown[]) => getMalOAuthConfigMock(...args),
}));

import { GET } from '@/app/api/integrations/mal/callback/route';
import { NextResponse } from 'next/server';
import { UnauthorizedError } from '@/lib/api/auth';

function createCookieStore(values: Record<string, string | undefined>) {
  return {
    get: (name: string) => {
      const value = values[name];
      return value === undefined ? undefined : { value };
    },
  };
}

function createRedirectResponse() {
  return {
    cookies: {
      set: jest.fn(),
    },
  };
}

function createSupabase({ upsertError = null as { message: string } | null } = {}) {
  const upsert = jest.fn().mockResolvedValue({ error: upsertError });
  const from = jest.fn().mockReturnValue({ upsert });
  return { from, upsert };
}

describe('app/api/integrations/mal/callback/route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    getMalOAuthConfigMock.mockReturnValue({
      clientId: 'cid',
      clientSecret: 'secret',
      redirectUri: 'https://example.com/api/integrations/mal/callback',
    });
    exchangeMalAuthCodeMock.mockResolvedValue({
      access_token: 'access',
      refresh_token: 'refresh',
      expires_in: 3600,
      scope: 'read write',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('redirects with error when oauth params are missing or oauthError exists', async () => {
    const redirectResponse = createRedirectResponse();
    cookiesMock.mockResolvedValue(createCookieStore({ 'mal-category': 'manga' }));
    (NextResponse.redirect as jest.Mock).mockReturnValue(redirectResponse);

    const response = await GET(
      new Request('https://example.com/api/integrations/mal/callback?error=access_denied'),
    );

    const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0] as string;
    expect(redirectUrl).toContain('/backlog?category=manga');
    expect(redirectUrl).toContain('mal=error');
    expect(redirectUrl).toContain('mal_reason=missing_params_or_oauth_error');
    expect(redirectResponse.cookies.set).toHaveBeenCalledTimes(4);
    expect(response).toBe(redirectResponse);
  });

  it('redirects with missing_oauth_cookies when required cookies are missing', async () => {
    const redirectResponse = createRedirectResponse();
    cookiesMock.mockResolvedValue(createCookieStore({ 'mal-category': 'anime' }));
    (NextResponse.redirect as jest.Mock).mockReturnValue(redirectResponse);

    const response = await GET(
      new Request('https://example.com/api/integrations/mal/callback?code=abc&state=s1'),
    );

    const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0] as string;
    expect(redirectUrl).toContain('mal_reason=missing_oauth_cookies');
    expect(response).toBe(redirectResponse);
  });

  it('redirects with state_mismatch when callback state differs from cookie', async () => {
    const redirectResponse = createRedirectResponse();
    cookiesMock.mockResolvedValue(
      createCookieStore({
        'mal-state': 'saved-state',
        'mal-verifier': 'verifier',
        'mal-user': 'user-1',
        'mal-category': 'anime',
      }),
    );
    (NextResponse.redirect as jest.Mock).mockReturnValue(redirectResponse);

    await GET(
      new Request('https://example.com/api/integrations/mal/callback?code=abc&state=other-state'),
    );
    const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0] as string;
    expect(redirectUrl).toContain('mal_reason=state_mismatch');
  });

  it('redirects with oauth_user_mismatch when authenticated user differs from oauth cookie', async () => {
    const redirectResponse = createRedirectResponse();
    const supabase = createSupabase();
    cookiesMock.mockResolvedValue(
      createCookieStore({
        'mal-state': 'saved-state',
        'mal-verifier': 'verifier',
        'mal-user': 'user-cookie',
        'mal-category': 'anime',
      }),
    );
    createRouteHandlerClientMock.mockResolvedValue(supabase);
    requireAuthMock.mockResolvedValue({ user: { id: 'session-user' } });
    (NextResponse.redirect as jest.Mock).mockReturnValue(redirectResponse);

    await GET(
      new Request('https://example.com/api/integrations/mal/callback?code=abc&state=saved-state'),
    );
    const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0] as string;
    expect(redirectUrl).toContain('mal_reason=oauth_user_mismatch');
  });

  it('redirects with token_exchange_failed and error snippet when token exchange throws', async () => {
    const redirectResponse = createRedirectResponse();
    const supabase = createSupabase();
    cookiesMock.mockResolvedValue(
      createCookieStore({
        'mal-state': 'saved-state',
        'mal-verifier': 'verifier',
        'mal-user': 'user-1',
        'mal-category': 'anime',
      }),
    );
    createRouteHandlerClientMock.mockResolvedValue(supabase);
    requireAuthMock.mockResolvedValue({ user: { id: 'user-1' } });
    exchangeMalAuthCodeMock.mockRejectedValueOnce(new Error('token failed hard'));
    (NextResponse.redirect as jest.Mock).mockReturnValue(redirectResponse);

    await GET(
      new Request('https://example.com/api/integrations/mal/callback?code=abc&state=saved-state'),
    );
    const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0] as string;
    expect(redirectUrl).toContain('mal_reason=token_exchange_failed');
    expect(redirectUrl).toContain('mal_token_error=token+failed+hard');
  });

  it('handles non-Error token exchange throws by stringifying the error', async () => {
    const redirectResponse = createRedirectResponse();
    const supabase = createSupabase();
    cookiesMock.mockResolvedValue(
      createCookieStore({
        'mal-state': 'saved-state',
        'mal-verifier': 'verifier',
        'mal-user': 'user-1',
        'mal-category': 'anime',
      }),
    );
    createRouteHandlerClientMock.mockResolvedValue(supabase);
    requireAuthMock.mockResolvedValue({ user: { id: 'user-1' } });
    exchangeMalAuthCodeMock.mockRejectedValueOnce('raw-failure');
    (NextResponse.redirect as jest.Mock).mockReturnValue(redirectResponse);

    await GET(
      new Request('https://example.com/api/integrations/mal/callback?code=abc&state=saved-state'),
    );
    const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0] as string;
    expect(redirectUrl).toContain('mal_token_error=raw-failure');
  });

  it('redirects with integration_upsert_failed when saving integration fails', async () => {
    const redirectResponse = createRedirectResponse();
    const supabase = createSupabase({ upsertError: { message: 'db fail' } });
    cookiesMock.mockResolvedValue(
      createCookieStore({
        'mal-state': 'saved-state',
        'mal-verifier': 'verifier',
        'mal-user': 'user-1',
        'mal-category': 'anime',
      }),
    );
    createRouteHandlerClientMock.mockResolvedValue(supabase);
    requireAuthMock.mockResolvedValue({ user: { id: 'user-1' } });
    (NextResponse.redirect as jest.Mock).mockReturnValue(redirectResponse);

    await GET(
      new Request('https://example.com/api/integrations/mal/callback?code=abc&state=saved-state'),
    );
    const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0] as string;
    expect(redirectUrl).toContain('mal_reason=integration_upsert_failed');
  });

  it('redirects with success and stores parsed scopes when callback completes', async () => {
    const redirectResponse = createRedirectResponse();
    const supabase = createSupabase();
    cookiesMock.mockResolvedValue(
      createCookieStore({
        'mal-state': 'saved-state',
        'mal-verifier': 'verifier',
        'mal-user': 'user-1',
        'mal-category': 'manga',
      }),
    );
    createRouteHandlerClientMock.mockResolvedValue(supabase);
    requireAuthMock.mockResolvedValue({ user: { id: 'user-1' } });
    exchangeMalAuthCodeMock.mockResolvedValueOnce({
      access_token: 'access',
      refresh_token: 'refresh',
      expires_in: 3600,
      scope: 'read   write',
    });
    (NextResponse.redirect as jest.Mock).mockReturnValue(redirectResponse);

    const res = await GET(
      new Request('https://example.com/api/integrations/mal/callback?code=abc&state=saved-state'),
    );

    const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0] as string;
    expect(redirectUrl).toContain('/backlog?category=manga');
    expect(redirectUrl).toContain('mal=success');
    expect(supabase.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        provider: 'mal',
        access_token: 'access',
        refresh_token: 'refresh',
        scopes: ['read', 'write'],
      }),
      { onConflict: 'user_id,provider' },
    );
    expect(res).toBe(redirectResponse);
  });

  it('stores empty scopes when token scope is missing', async () => {
    const redirectResponse = createRedirectResponse();
    const supabase = createSupabase();
    cookiesMock.mockResolvedValue(
      createCookieStore({
        'mal-state': 'saved-state',
        'mal-verifier': 'verifier',
        'mal-user': 'user-1',
        'mal-category': 'anime',
      }),
    );
    createRouteHandlerClientMock.mockResolvedValue(supabase);
    requireAuthMock.mockResolvedValue({ user: { id: 'user-1' } });
    exchangeMalAuthCodeMock.mockResolvedValueOnce({
      access_token: 'access',
      refresh_token: 'refresh',
      expires_in: 3600,
      scope: undefined,
    });
    (NextResponse.redirect as jest.Mock).mockReturnValue(redirectResponse);

    await GET(
      new Request('https://example.com/api/integrations/mal/callback?code=abc&state=saved-state'),
    );
    expect(supabase.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        scopes: [],
      }),
      { onConflict: 'user_id,provider' },
    );
  });

  it('handles unauthorized and unexpected errors in outer catch', async () => {
    const redirectResponse1 = createRedirectResponse();
    const redirectResponse2 = createRedirectResponse();
    cookiesMock.mockResolvedValue(
      createCookieStore({
        'mal-state': 'saved',
        'mal-verifier': 'verifier',
        'mal-user': 'user-1',
        'mal-category': 'anime',
      }),
    );
    (NextResponse.redirect as jest.Mock)
      .mockReturnValueOnce(redirectResponse1)
      .mockReturnValueOnce(redirectResponse2);

    createRouteHandlerClientMock.mockResolvedValue({});
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError('nope'));
    await GET(
      new Request('https://example.com/api/integrations/mal/callback?code=abc&state=saved'),
    );
    const unauthorizedUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0] as string;
    expect(unauthorizedUrl).toContain('mal_reason=unauthorized');

    createRouteHandlerClientMock.mockRejectedValueOnce(new Error('boom'));
    await GET(
      new Request('https://example.com/api/integrations/mal/callback?code=abc&state=saved'),
    );
    const unexpectedUrl = (NextResponse.redirect as jest.Mock).mock.calls[1][0] as string;
    expect(unexpectedUrl).toContain('mal_reason=unexpected_error');
  });

  it('stringifies non-Error unexpected failures in outer catch', async () => {
    const redirectResponse = createRedirectResponse();
    cookiesMock.mockResolvedValue(
      createCookieStore({
        'mal-state': 'saved',
        'mal-verifier': 'verifier',
        'mal-user': 'user-1',
        'mal-category': 'anime',
      }),
    );
    (NextResponse.redirect as jest.Mock).mockReturnValue(redirectResponse);
    createRouteHandlerClientMock.mockRejectedValueOnce('plain-error');

    await GET(
      new Request('https://example.com/api/integrations/mal/callback?code=abc&state=saved'),
    );
    expect(console.error).toHaveBeenCalledWith('MAL callback: unexpected error', 'plain-error');
  });
});
