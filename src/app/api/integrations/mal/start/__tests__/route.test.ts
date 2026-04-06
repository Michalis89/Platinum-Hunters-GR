jest.mock('next/server', () => ({
  __esModule: true,
  NextResponse: {
    redirect: jest.fn(),
    json: jest.fn((body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    })),
  },
}));

jest.mock('@/lib/observability/withApiRoute', () => ({
  __esModule: true,
  withApiRoute: (handler: unknown) => handler,
}));

jest.mock('@/lib/supabase-route-handler', () => ({
  __esModule: true,
  createRouteHandlerClient: jest.fn(),
}));

jest.mock('@/lib/api/auth', () => {
  class UnauthorizedError extends Error {}

  return {
    __esModule: true,
    requireAuth: jest.fn(),
    UnauthorizedError,
  };
});

jest.mock('@/lib/integrations/mal', () => ({
  __esModule: true,
  MAL_OAUTH_CATEGORY_COOKIE: 'mal-category',
  MAL_OAUTH_STATE_COOKIE: 'mal-state',
  MAL_OAUTH_USER_COOKIE: 'mal-user',
  MAL_OAUTH_VERIFIER_COOKIE: 'mal-verifier',
  buildMalAuthorizeUrl: jest.fn(),
  generatePkceState: jest.fn(),
  getMalOAuthConfig: jest.fn(),
}));

import { GET } from '@/app/api/integrations/mal/start/route';
import { NextResponse } from 'next/server';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { buildMalAuthorizeUrl, generatePkceState, getMalOAuthConfig } from '@/lib/integrations/mal';

function createRequest(url: string) {
  return { url } as Request;
}

describe('app/api/integrations/mal/start/route', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.restoreAllMocks();
  });

  it('returns 401 when authentication fails', async () => {
    (createRouteHandlerClient as jest.Mock).mockResolvedValue({});
    (requireAuth as jest.Mock).mockRejectedValue(new UnauthorizedError('unauthorized'));

    const response = await GET(createRequest('https://example.com/api/integrations/mal/start'));

    expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized' }, { status: 401 });
    expect(response.status).toBe(401);
    expect(console.error).not.toHaveBeenCalled();
  });

  it('redirects to MAL and stores oauth cookies for anime by default', async () => {
    process.env.NODE_ENV = 'development';

    const supabase = { tag: 'supabase' };
    const cookieSet = jest.fn();
    const redirectResponse = {
      cookies: {
        set: cookieSet,
      },
    };
    const authorizeUrl = new URL('https://myanimelist.net/v1/oauth2/authorize?client_id=abc');

    (createRouteHandlerClient as jest.Mock).mockResolvedValue(supabase);
    (requireAuth as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } });
    (getMalOAuthConfig as jest.Mock).mockReturnValue({
      clientId: 'client-123',
      redirectUri: 'https://example.com/api/integrations/mal/callback',
    });
    (generatePkceState as jest.Mock).mockReturnValue({
      state: 'state-1',
      codeVerifier: 'verifier-1',
      codeChallenge: 'challenge-1',
    });
    (buildMalAuthorizeUrl as jest.Mock).mockReturnValue(authorizeUrl);
    (NextResponse.redirect as jest.Mock).mockReturnValue(redirectResponse);

    const response = await GET(
      createRequest('https://example.com/api/integrations/mal/start?category=unknown'),
    );

    expect(requireAuth).toHaveBeenCalledWith(supabase);
    expect(buildMalAuthorizeUrl).toHaveBeenCalledWith({
      clientId: 'client-123',
      redirectUri: 'https://example.com/api/integrations/mal/callback',
      state: 'state-1',
      codeChallenge: 'challenge-1',
    });
    expect(NextResponse.redirect).toHaveBeenCalledWith(authorizeUrl.toString());
    expect(cookieSet).toHaveBeenNthCalledWith(
      1,
      'mal-state',
      'state-1',
      expect.objectContaining({
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 600,
      }),
    );
    expect(cookieSet).toHaveBeenNthCalledWith(
      2,
      'mal-verifier',
      'verifier-1',
      expect.objectContaining({
        secure: false,
      }),
    );
    expect(cookieSet).toHaveBeenNthCalledWith(
      3,
      'mal-user',
      'user-1',
      expect.objectContaining({
        secure: false,
      }),
    );
    expect(cookieSet).toHaveBeenNthCalledWith(
      4,
      'mal-category',
      'anime',
      expect.objectContaining({
        secure: false,
      }),
    );
    expect(response).toBe(redirectResponse);
  });

  it('stores the manga category and production-secure cookies when requested', async () => {
    process.env.NODE_ENV = 'production';

    const redirectResponse = {
      cookies: {
        set: jest.fn(),
      },
    };

    (createRouteHandlerClient as jest.Mock).mockResolvedValue({});
    (requireAuth as jest.Mock).mockResolvedValue({ user: { id: 'user-2' } });
    (getMalOAuthConfig as jest.Mock).mockReturnValue({
      clientId: 'client-456',
      redirectUri: 'https://example.com/callback',
    });
    (generatePkceState as jest.Mock).mockReturnValue({
      state: 'state-2',
      codeVerifier: 'verifier-2',
      codeChallenge: 'challenge-2',
    });
    (buildMalAuthorizeUrl as jest.Mock).mockReturnValue(
      new URL('https://myanimelist.net/v1/oauth2/authorize?client_id=xyz'),
    );
    (NextResponse.redirect as jest.Mock).mockReturnValue(redirectResponse);

    await GET(createRequest('https://example.com/api/integrations/mal/start?category=manga'));

    expect(redirectResponse.cookies.set).toHaveBeenLastCalledWith(
      'mal-category',
      'manga',
      expect.objectContaining({
        secure: true,
      }),
    );
  });

  it('returns 500 when starting the MAL flow throws unexpectedly', async () => {
    const error = new Error('boom');
    (createRouteHandlerClient as jest.Mock).mockRejectedValue(error);

    const response = await GET(createRequest('https://example.com/api/integrations/mal/start'));

    expect(console.error).toHaveBeenCalledWith('MAL start error:', error);
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Failed to start MAL OAuth flow' },
      { status: 500 },
    );
    expect(response.status).toBe(500);
  });
});
