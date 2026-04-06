/**
 * @jest-environment node
 */

import 'whatwg-fetch';

jest.mock('next/server', () => ({
  __esModule: true,
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    })),
  },
}));

const getSupabaseServerMock = jest.fn();
jest.mock('@/lib/supabase-server', () => ({
  __esModule: true,
  default: (...args: unknown[]) => getSupabaseServerMock(...args),
}));

const fetchUserStatsMock = jest.fn();
const fetchContinueDataMock = jest.fn();
jest.mock('@/lib/dashboard/server-data', () => ({
  __esModule: true,
  fetchUserStats: (...args: unknown[]) => fetchUserStatsMock(...args),
  fetchContinueData: (...args: unknown[]) => fetchContinueDataMock(...args),
}));

const fetchCategoryDashboardDataMock = jest.fn();
jest.mock('@/lib/dashboard/category-data', () => ({
  __esModule: true,
  DASHBOARD_TAB_CATEGORIES: ['games', 'anime', 'manga', 'movies', 'tv', 'books'],
  fetchCategoryDashboardData: (...args: unknown[]) => fetchCategoryDashboardDataMock(...args),
}));

import { GET } from '@/app/api/public/share/[token]/dashboard/route';

type SupabaseConfig = {
  tokenRow?: unknown;
  userRow?: unknown;
};

function makeSupabase(config: SupabaseConfig = {}) {
  const tokenRow = Object.prototype.hasOwnProperty.call(config, 'tokenRow')
    ? config.tokenRow
    : { user_id: 'u1', expires_at: null };
  const userRow = Object.prototype.hasOwnProperty.call(config, 'userRow')
    ? config.userRow
    : { id: 'u1', username: 'john', display_name: 'John' };

  const tokenMaybeSingle = jest.fn().mockResolvedValue({ data: tokenRow });
  const tokenEq = jest.fn().mockReturnValue({ maybeSingle: tokenMaybeSingle });
  const tokenSelect = jest.fn().mockReturnValue({ eq: tokenEq });

  const userMaybeSingle = jest.fn().mockResolvedValue({ data: userRow });
  const userEq = jest.fn().mockReturnValue({ maybeSingle: userMaybeSingle });
  const userSelect = jest.fn().mockReturnValue({ eq: userEq });

  const from = jest.fn((table: string) => {
    if (table === 'share_tokens') {
      return { select: tokenSelect };
    }
    if (table === 'users') {
      return { select: userSelect };
    }
    throw new Error(`Unexpected table: ${table}`);
  });

  return { from };
}

describe('app/api/public/share/[token]/dashboard/route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    fetchUserStatsMock.mockResolvedValue({ active_categories: ['games'] });
    fetchContinueDataMock.mockResolvedValue({ enabledCategories: ['games'] });
    fetchCategoryDashboardDataMock.mockResolvedValue([{ category: 'games', items: [] }]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 404 when token is missing or expired', async () => {
    getSupabaseServerMock.mockReturnValueOnce(makeSupabase({ tokenRow: null }));
    let res = await GET(new Request('http://localhost/api/public/share/t1/dashboard'), {
      params: Promise.resolve({ token: 't1' }),
    });
    expect(res.status).toBe(404);

    getSupabaseServerMock.mockReturnValueOnce(
      makeSupabase({ tokenRow: { user_id: 'u1', expires_at: '2000-01-01T00:00:00.000Z' } }),
    );
    res = await GET(new Request('http://localhost/api/public/share/t2/dashboard'), {
      params: Promise.resolve({ token: 't2' }),
    });
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'Invalid or expired token' });
  });

  it('returns 404 when user is not found', async () => {
    getSupabaseServerMock.mockReturnValue(
      makeSupabase({
        tokenRow: { user_id: 'u1', expires_at: null },
        userRow: null,
      }),
    );

    const res = await GET(new Request('http://localhost/api/public/share/t3/dashboard'), {
      params: Promise.resolve({ token: 't3' }),
    });

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'User not found' });
  });

  it('returns dashboard payload using continue enabled categories when present', async () => {
    const supabase = makeSupabase({
      tokenRow: { user_id: 'u10', expires_at: null },
      userRow: { id: 'u10', username: 'maria', display_name: 'Maria' },
    });
    getSupabaseServerMock.mockReturnValue(supabase);
    fetchUserStatsMock.mockResolvedValueOnce({ active_categories: ['books', 'invalid'] });
    fetchContinueDataMock.mockResolvedValueOnce({ enabledCategories: ['anime', 'invalid', 'tv'] });
    fetchCategoryDashboardDataMock.mockResolvedValueOnce([
      { category: 'anime' },
      { category: 'tv' },
    ]);

    const res = await GET(new Request('http://localhost/api/public/share/t4/dashboard'), {
      params: Promise.resolve({ token: 't4' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(fetchUserStatsMock).toHaveBeenCalledWith(supabase, 'u10');
    expect(fetchContinueDataMock).toHaveBeenCalledWith(supabase, 'u10');
    expect(fetchCategoryDashboardDataMock).toHaveBeenCalledWith(supabase, 'u10', ['anime', 'tv']);
    expect(body.user).toEqual({ id: 'u10', username: 'maria', displayName: 'Maria' });
    expect(body.mediaCategories).toEqual(['anime', 'tv']);
    expect(body.sections).toEqual([{ category: 'anime' }, { category: 'tv' }]);
  });

  it('falls back to stats active categories and supports empty categories', async () => {
    const supabase = makeSupabase({
      tokenRow: { user_id: 'u11', expires_at: null },
      userRow: { id: 'u11', username: 'kate', display_name: 'Kate' },
    });
    getSupabaseServerMock.mockReturnValueOnce(supabase);
    fetchContinueDataMock.mockResolvedValueOnce({ enabledCategories: ['invalid-only'] });
    fetchUserStatsMock.mockResolvedValueOnce({ active_categories: ['books', 'oops', 'games'] });
    fetchCategoryDashboardDataMock.mockResolvedValueOnce([
      { category: 'books' },
      { category: 'games' },
    ]);

    let res = await GET(new Request('http://localhost/api/public/share/t5/dashboard'), {
      params: Promise.resolve({ token: 't5' }),
    });
    expect(res.status).toBe(200);
    let body = await res.json();
    expect(body.mediaCategories).toEqual(['books', 'games']);
    expect(fetchCategoryDashboardDataMock).toHaveBeenCalledWith(supabase, 'u11', [
      'books',
      'games',
    ]);

    const supabase2 = makeSupabase({
      tokenRow: { user_id: 'u12', expires_at: null },
      userRow: { id: 'u12', username: 'noa', display_name: 'Noa' },
    });
    getSupabaseServerMock.mockReturnValueOnce(supabase2);
    fetchContinueDataMock.mockResolvedValueOnce({});
    fetchUserStatsMock.mockResolvedValueOnce({});
    fetchCategoryDashboardDataMock.mockResolvedValueOnce([]);

    res = await GET(new Request('http://localhost/api/public/share/t6/dashboard'), {
      params: Promise.resolve({ token: 't6' }),
    });
    expect(res.status).toBe(200);
    body = await res.json();
    expect(body.mediaCategories).toEqual([]);
    expect(fetchCategoryDashboardDataMock).toHaveBeenCalledWith(supabase2, 'u12', []);
  });

  it('returns 500 on unexpected thrown error', async () => {
    getSupabaseServerMock.mockImplementationOnce(() => {
      throw new Error('boom');
    });

    const res = await GET(new Request('http://localhost/api/public/share/t7/dashboard'), {
      params: Promise.resolve({ token: 't7' }),
    });

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Server error' });
    expect(console.error).toHaveBeenCalledWith(
      'Public share dashboard fetch error:',
      expect.any(Error),
    );
  });
});
