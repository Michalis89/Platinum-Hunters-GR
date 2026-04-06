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

import { GET } from '@/app/api/public/user/[username]/dashboard/route';

function makeSupabaseUserLookup(user: unknown) {
  const maybeSingle = jest.fn().mockResolvedValue({ data: user, error: null });
  const eq = jest.fn().mockReturnValue({ maybeSingle });
  const select = jest.fn().mockReturnValue({ eq });
  const from = jest.fn().mockReturnValue({ select });
  return { from, spies: { select, eq, maybeSingle } };
}

describe('app/api/public/user/[username]/dashboard/route', () => {
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

  it('returns 404 when user is not found', async () => {
    getSupabaseServerMock.mockReturnValue(makeSupabaseUserLookup(null));

    const res = await GET(new Request('http://localhost/api/public/user/john/dashboard'), {
      params: Promise.resolve({ username: 'john' }),
    });

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'User not found' });
  });

  it('returns 403 when profile visibility is private', async () => {
    getSupabaseServerMock.mockReturnValue(
      makeSupabaseUserLookup({
        id: 'u1',
        username: 'john',
        display_name: 'John',
        privacy_settings: { profile_visibility: 'private' },
      }),
    );

    const res = await GET(new Request('http://localhost/api/public/user/john/dashboard'), {
      params: Promise.resolve({ username: 'john' }),
    });

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'Profile is private' });
  });

  it('returns public dashboard using continue enabled categories when available', async () => {
    const supabase = makeSupabaseUserLookup({
      id: 'u1',
      username: 'john',
      display_name: 'John',
      privacy_settings: { profile_visibility: 'public' },
    });
    getSupabaseServerMock.mockReturnValue(supabase);
    fetchUserStatsMock.mockResolvedValueOnce({ active_categories: ['books', 'invalid'] });
    fetchContinueDataMock.mockResolvedValueOnce({ enabledCategories: ['anime', 'invalid', 'tv'] });
    fetchCategoryDashboardDataMock.mockResolvedValueOnce([
      { category: 'anime' },
      { category: 'tv' },
    ]);

    const res = await GET(new Request('http://localhost/api/public/user/john/dashboard'), {
      params: Promise.resolve({ username: 'john' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(fetchCategoryDashboardDataMock).toHaveBeenCalledWith(supabase, 'u1', ['anime', 'tv']);
    expect(body.mediaCategories).toEqual(['anime', 'tv']);
    expect(body.user).toEqual({ id: 'u1', username: 'john', displayName: 'John' });
  });

  it('falls back to stats active categories when continue categories are empty/invalid', async () => {
    const supabase = makeSupabaseUserLookup({
      id: 'u2',
      username: 'maria',
      display_name: 'Maria',
      privacy_settings: null,
    });
    getSupabaseServerMock.mockReturnValue(supabase);
    fetchUserStatsMock.mockResolvedValueOnce({ active_categories: ['books', 'oops', 'games'] });
    fetchContinueDataMock.mockResolvedValueOnce({ enabledCategories: ['invalid-only'] });
    fetchCategoryDashboardDataMock.mockResolvedValueOnce([
      { category: 'books' },
      { category: 'games' },
    ]);

    const res = await GET(new Request('http://localhost/api/public/user/maria/dashboard'), {
      params: Promise.resolve({ username: 'maria' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.mediaCategories).toEqual(['books', 'games']);
    expect(fetchCategoryDashboardDataMock).toHaveBeenCalledWith(supabase, 'u2', ['books', 'games']);
  });

  it('uses empty arrays when enabled/active categories are missing', async () => {
    const supabase = makeSupabaseUserLookup({
      id: 'u3',
      username: 'kate',
      display_name: 'Kate',
      privacy_settings: {},
    });
    getSupabaseServerMock.mockReturnValue(supabase);
    fetchUserStatsMock.mockResolvedValueOnce({});
    fetchContinueDataMock.mockResolvedValueOnce({});
    fetchCategoryDashboardDataMock.mockResolvedValueOnce([]);

    const res = await GET(new Request('http://localhost/api/public/user/kate/dashboard'), {
      params: Promise.resolve({ username: 'kate' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.mediaCategories).toEqual([]);
    expect(fetchCategoryDashboardDataMock).toHaveBeenCalledWith(supabase, 'u3', []);
  });

  it('returns 500 when unexpected error is thrown', async () => {
    getSupabaseServerMock.mockImplementationOnce(() => {
      throw new Error('boom');
    });

    const res = await GET(new Request('http://localhost/api/public/user/john/dashboard'), {
      params: Promise.resolve({ username: 'john' }),
    });

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Server error' });
    expect(console.error).toHaveBeenCalledWith('Public dashboard fetch error:', expect.any(Error));
  });
});
