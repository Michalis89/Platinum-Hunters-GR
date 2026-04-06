/**
 * @jest-environment node
 */

const mockRateLimit = jest.fn();
const mockGetClientIp = jest.fn(() => '127.0.0.1');
const mockRateLimitHeaders = jest.fn(() => ({}));
const mockVerifyCaptchaToken = jest.fn();
const mockSendConfirmEmail = jest.fn();
const mockResolveSiteUrl = jest.fn(() => 'http://localhost:3000');

const mockMaybeSingle = jest.fn();
const mockUsersUpsert = jest.fn();
const mockCategoryUpsert = jest.fn();
const mockCreateUser = jest.fn();
const mockDeleteUser = jest.fn();
const mockGenerateLink = jest.fn();

const mockFrom = jest.fn((table: string) => {
  if (table === 'users') {
    return {
      select: jest.fn(() => {
        const builder = {
          eq: jest.fn(() => builder),
          neq: jest.fn(() => builder),
          maybeSingle: mockMaybeSingle,
        };
        return builder;
      }),
      upsert: (...args: unknown[]) => mockUsersUpsert(...args),
    };
  }

  if (table === 'user_category_profiles') {
    return {
      upsert: (...args: unknown[]) => mockCategoryUpsert(...args),
    };
  }

  throw new Error(`Unexpected table: ${table}`);
});

const mockSupabaseAdmin = {
  from: mockFrom,
  auth: {
    admin: {
      createUser: (...args: unknown[]) => mockCreateUser(...args),
      deleteUser: (...args: unknown[]) => mockDeleteUser(...args),
      generateLink: (...args: unknown[]) => mockGenerateLink(...args),
    },
  },
};

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  getClientIp: (...args: unknown[]) => mockGetClientIp(...args),
  rateLimitHeaders: (...args: unknown[]) => mockRateLimitHeaders(...args),
}));

jest.mock('@/lib/captcha/turnstile', () => ({
  verifyCaptchaToken: (...args: unknown[]) => mockVerifyCaptchaToken(...args),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => mockSupabaseAdmin,
}));

jest.mock('@/lib/email/send', () => ({
  sendConfirmEmail: (...args: unknown[]) => mockSendConfirmEmail(...args),
}));

jest.mock('@/lib/auth/site-url', () => ({
  resolveSiteUrl: (...args: unknown[]) => mockResolveSiteUrl(...args),
}));

jest.mock('@/lib/observability/withApiRoute', () => ({
  withApiRoute: (handler: (...args: unknown[]) => unknown) => handler,
}));

function makeUserUpsertChain(result: unknown) {
  return {
    select: jest.fn(() => ({
      single: jest.fn().mockResolvedValue(result),
    })),
  };
}

function makeRequest() {
  return new Request('http://localhost/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      email: 'user@example.com',
      password: 'Password1!',
      username: 'user123',
      agree_to_terms: true,
      acceptedPolicies: {
        termsVersion: '2026-02-09',
        privacyVersion: '2026-02-09',
        termsPath: '/terms',
        privacyPath: '/privacy',
        acceptedAt: new Date().toISOString(),
      },
      captchaToken: 'captcha-token',
    }),
  });
}

describe('POST /api/auth/signup RC-006', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockRateLimit.mockResolvedValue({ success: true });
    mockVerifyCaptchaToken.mockResolvedValue({ success: true, errors: [] });
    mockMaybeSingle.mockResolvedValue({ data: null });
    mockCategoryUpsert.mockResolvedValue({ error: null });
    mockDeleteUser.mockResolvedValue({ error: null });
    mockGenerateLink.mockResolvedValue({
      data: { properties: { action_link: 'http://localhost:3000/confirm' } },
      error: null,
    });
    mockSendConfirmEmail.mockResolvedValue(undefined);
  });

  it('returns 409 and rolls back auth user on users upsert 23505', async () => {
    mockCreateUser.mockResolvedValueOnce({
      data: { user: { id: 'auth-user-1' } },
      error: null,
    });
    mockUsersUpsert.mockReturnValueOnce(
      makeUserUpsertChain({
        error: { code: '23505', message: 'duplicate key value violates unique constraint' },
      }),
    );

    const { POST } = await import('@/app/api/auth/signup/route');
    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body).toEqual({ error: 'Username or email is already in use.' });
    expect(mockDeleteUser).toHaveBeenCalledWith('auth-user-1');
  });

  it('with concurrent identical signups returns one success and one conflict', async () => {
    const createUserResolvers: Array<(value: unknown) => void> = [];
    mockCreateUser.mockImplementation(
      () =>
        new Promise(resolve => {
          createUserResolvers.push(resolve);
        }),
    );

    mockUsersUpsert.mockReturnValueOnce(makeUserUpsertChain({ error: null })).mockReturnValueOnce(
      makeUserUpsertChain({
        error: { code: '23505', message: 'duplicate key value violates unique constraint' },
      }),
    );

    const { POST } = await import('@/app/api/auth/signup/route');

    const firstPromise = POST(makeRequest());
    const secondPromise = POST(makeRequest());

    while (createUserResolvers.length < 2) {
      await Promise.resolve();
    }

    createUserResolvers[0]?.({
      data: { user: { id: 'auth-user-1' } },
      error: null,
    });
    createUserResolvers[1]?.({
      data: { user: { id: 'auth-user-2' } },
      error: null,
    });

    const [firstResponse, secondResponse] = await Promise.all([firstPromise, secondPromise]);

    const statuses = [firstResponse.status, secondResponse.status].sort();
    expect(statuses).toEqual([200, 409]);
    expect(mockDeleteUser).toHaveBeenCalledWith('auth-user-2');
  });
});
