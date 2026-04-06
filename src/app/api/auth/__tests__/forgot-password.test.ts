/**
 * @jest-environment node
 */

import 'whatwg-fetch';

const mockGenerateLink = jest.fn();
const mockSendResetPasswordEmail = jest.fn();
const mockValidateEmail = jest.fn();
const mockRateLimit = jest.fn();
const mockGetClientIp = jest.fn();
const mockRateLimitHeaders = jest.fn();
const mockResolveSiteUrl = jest.fn();

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number; headers?: HeadersInit }) => ({
      status: init?.status ?? 200,
      headers: new Headers(init?.headers),
      json: async () => body,
    }),
  },
}));

jest.mock('@/lib/observability/withApiRoute', () => ({
  __esModule: true,
  withApiRoute: (handler: unknown) => handler,
}));

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({
    auth: {
      admin: {
        generateLink: (...args: unknown[]) => mockGenerateLink(...args),
      },
    },
  }),
}));

jest.mock('@/lib/email/send', () => ({
  sendResetPasswordEmail: (...args: unknown[]) => mockSendResetPasswordEmail(...args),
}));

jest.mock('@/utils/validation/auth', () => ({
  validateEmail: (...args: unknown[]) => mockValidateEmail(...args),
}));

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  getClientIp: (...args: unknown[]) => mockGetClientIp(...args),
  rateLimitHeaders: (...args: unknown[]) => mockRateLimitHeaders(...args),
}));

jest.mock('@/lib/auth/site-url', () => ({
  resolveSiteUrl: (...args: unknown[]) => mockResolveSiteUrl(...args),
}));

import { POST } from '@/app/api/auth/forgot-password/route';
import { API_ERRORS } from '@/lib/api/errors';

describe('app/api/auth/forgot-password/route', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';

    mockRateLimit.mockResolvedValue({ success: true });
    mockGetClientIp.mockReturnValue('127.0.0.1');
    mockRateLimitHeaders.mockReturnValue({ 'x-ratelimit-remaining': '0' });
    mockResolveSiteUrl.mockReturnValue('https://example.com');
    mockValidateEmail.mockReturnValue({ isValid: true });
    mockGenerateLink.mockResolvedValue({
      data: {
        properties: {
          action_link: 'https://example.com/auth/reset-password?token=abc',
          hashed_token: 'hash-123',
        },
      },
      error: null,
    });
    mockSendResetPasswordEmail.mockResolvedValue(undefined);
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  function makeRequest(body: unknown) {
    return new Request('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  }

  it('returns 429 in production when rate limit blocks request', async () => {
    process.env.NODE_ENV = 'production';
    mockRateLimit.mockResolvedValueOnce({ success: false, remaining: 0, reset: 123, limit: 3 });
    mockRateLimitHeaders.mockReturnValueOnce({ 'x-ratelimit-remaining': '0' });

    const res = await POST(makeRequest({ email: 'user@example.com' }));

    expect(mockGetClientIp).toHaveBeenCalled();
    expect(mockRateLimit).toHaveBeenCalledWith('forgotIp', '127.0.0.1');
    expect(res.status).toBe(429);
    expect(res.headers.get('x-ratelimit-remaining')).toBe('0');
    await expect(res.json()).resolves.toEqual({
      error: 'Too many attempts. Please try again later.',
    });
    expect(mockGenerateLink).not.toHaveBeenCalled();
  });

  it('skips rate-limit in non-production and returns validation error', async () => {
    mockValidateEmail.mockReturnValueOnce({ isValid: false, error: 'Invalid email format' });

    const res = await POST(makeRequest({ email: 'bad' }));

    expect(mockRateLimit).not.toHaveBeenCalled();
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Invalid email format' });
  });

  it('returns default invalid-email message when validator has no error text', async () => {
    mockValidateEmail.mockReturnValueOnce({ isValid: false });

    const res = await POST(makeRequest({ email: 'bad' }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Invalid email' });
  });

  it('returns 404 when provider reports user_not_found code', async () => {
    mockGenerateLink.mockResolvedValueOnce({
      data: null,
      error: { code: 'user_not_found', message: 'No such user' },
    });
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    const res = await POST(makeRequest({ email: 'user@example.com' }));

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({
      error:
        "We couldn't find an account with that email address. Check for typos or create a new account.",
    });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('returns 404 when provider message indicates user not found', async () => {
    mockGenerateLink.mockResolvedValueOnce({
      data: null,
      error: { message: 'User with this email not found' },
    });

    const res = await POST(makeRequest({ email: 'user@example.com' }));
    expect(res.status).toBe(404);
  });

  it('returns 500 when provider returns other link error', async () => {
    mockGenerateLink.mockResolvedValueOnce({
      data: null,
      error: { code: 'unexpected_error', message: 'service unavailable' },
    });

    const res = await POST(makeRequest({ email: 'user@example.com' }));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      error: 'Unable to process password recovery right now. Please try again shortly.',
    });
  });

  it('returns 500 when link generation has no error but no recovery link', async () => {
    mockGenerateLink.mockResolvedValueOnce({
      data: { properties: {} },
      error: null,
    });

    const res = await POST(makeRequest({ email: 'user@example.com' }));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      error: 'Unable to process password recovery right now. Please try again shortly.',
    });
  });

  it('returns internal error when reset email sending fails', async () => {
    mockSendResetPasswordEmail.mockRejectedValueOnce(new Error('smtp down'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const res = await POST(makeRequest({ email: 'user@example.com' }));

    expect(res.status).toBe(API_ERRORS.INTERNAL.status);
    await expect(res.json()).resolves.toEqual(API_ERRORS.INTERNAL);
    expect(errorSpy).toHaveBeenCalledWith(
      'Failed to send reset password email:',
      expect.any(Error),
    );
    errorSpy.mockRestore();
  });

  it('sends hashed-token recovery link when hashed token exists', async () => {
    mockGenerateLink.mockResolvedValueOnce({
      data: {
        properties: {
          action_link: 'https://example.com/auth/reset-password?token=abc',
          hashed_token: 'hash + token',
        },
      },
      error: null,
    });

    const res = await POST(makeRequest({ email: 'user@example.com' }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(mockSendResetPasswordEmail).toHaveBeenCalledWith(
      'user@example.com',
      'https://example.com/auth/reset-password?token_hash=hash%20%2B%20token&type=recovery',
    );
  });

  it('falls back to provider action_link when hashed token is missing', async () => {
    mockGenerateLink.mockResolvedValueOnce({
      data: {
        properties: {
          action_link: 'https://example.com/auth/reset-password?token=abc',
          hashed_token: undefined,
        },
      },
      error: null,
    });

    const res = await POST(makeRequest({ email: 'user@example.com' }));

    expect(res.status).toBe(200);
    expect(mockSendResetPasswordEmail).toHaveBeenCalledWith(
      'user@example.com',
      'https://example.com/auth/reset-password?token=abc',
    );
  });

  it('returns internal error when request parsing throws', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const res = await POST(makeRequest('{'));

    expect(res.status).toBe(API_ERRORS.INTERNAL.status);
    await expect(res.json()).resolves.toEqual(API_ERRORS.INTERNAL);
    expect(errorSpy).toHaveBeenCalledWith('Forgot password handler error:', expect.anything());
    errorSpy.mockRestore();
  });
});
