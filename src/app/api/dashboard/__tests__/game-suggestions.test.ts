jest.mock('next/server', () => ({
  __esModule: true,
  NextResponse: {
    json: jest.fn(),
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

jest.mock('@/lib/api/response', () => ({
  __esModule: true,
  fail: jest.fn((body: unknown, status: number) => ({
    status,
    json: async () => body,
  })),
}));

jest.mock('@/lib/dashboard/gameSuggestionsEngine', () => ({
  __esModule: true,
  buildGameSuggestions: jest.fn(),
}));

import { GET } from '@/app/api/dashboard/game-suggestions/route';
import { API_ERRORS } from '@/lib/api/errors';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { fail } from '@/lib/api/response';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { buildGameSuggestions } from '@/lib/dashboard/gameSuggestionsEngine';
import { NextResponse } from 'next/server';

describe('app/api/dashboard/game-suggestions/route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns suggestions with no-store cache headers for authenticated users', async () => {
    const response = {
      headers: {
        set: jest.fn(),
      },
    };
    const supabase = { marker: 'supabase' };
    const session = { user: { id: 'user-123' } };
    const suggestions = [{ id: 'game-1', title: 'Elden Ring' }];

    (NextResponse.json as jest.Mock).mockReturnValue(response);
    (createRouteHandlerClient as jest.Mock).mockResolvedValue(supabase);
    (requireAuth as jest.Mock).mockResolvedValue(session);
    (buildGameSuggestions as jest.Mock).mockResolvedValue(suggestions);

    const result = await GET();

    expect(createRouteHandlerClient).toHaveBeenCalledTimes(1);
    expect(requireAuth).toHaveBeenCalledWith(supabase);
    expect(buildGameSuggestions).toHaveBeenCalledWith({
      supabase,
      userId: 'user-123',
    });
    expect(NextResponse.json).toHaveBeenCalledWith(suggestions);
    expect(response.headers.set).toHaveBeenCalledWith('Cache-Control', 'no-store, must-revalidate');
    expect(result).toBe(response);
  });

  it('returns the standardized unauthorized response when auth fails', async () => {
    const authError = new UnauthorizedError('unauthorized');

    (createRouteHandlerClient as jest.Mock).mockResolvedValue({});
    (requireAuth as jest.Mock).mockRejectedValue(authError);

    const result = await GET();

    expect(fail).toHaveBeenCalledWith(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    expect(console.error).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: API_ERRORS.UNAUTHORIZED.status,
      json: expect.any(Function),
    });
  });

  it('returns the standardized internal error when suggestions loading throws', async () => {
    const supabase = { marker: 'supabase' };
    const session = { user: { id: 'user-123' } };
    const error = new Error('boom');

    (createRouteHandlerClient as jest.Mock).mockResolvedValue(supabase);
    (requireAuth as jest.Mock).mockResolvedValue(session);
    (buildGameSuggestions as jest.Mock).mockRejectedValue(error);

    const result = await GET();

    expect(console.error).toHaveBeenCalledWith('Game suggestions error:', error);
    expect(fail).toHaveBeenCalledWith(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    expect(result).toEqual({
      status: API_ERRORS.INTERNAL.status,
      json: expect.any(Function),
    });
  });
});
