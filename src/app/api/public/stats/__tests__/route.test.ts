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

jest.mock('@/lib/observability/withApiRoute', () => ({
  __esModule: true,
  withApiRoute: (handler: unknown) => handler,
}));

const createClientMock = jest.fn();
jest.mock('@supabase/supabase-js', () => ({
  __esModule: true,
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

const unstableCacheMock = jest.fn((fn: unknown) => fn);
jest.mock('next/cache', () => ({
  __esModule: true,
  unstable_cache: (...args: unknown[]) => unstableCacheMock(...args),
}));

jest.mock('@/lib/cache/tags', () => ({
  __esModule: true,
  CACHE_CONFIG: {
    PUBLIC_DATA: { revalidate: 300 },
  },
  CACHE_TAGS: {
    PUBLIC_STATS: 'public-stats',
    ARTICLES: 'articles',
  },
}));

import { GET, runtime, revalidate } from '@/app/api/public/stats/route';

type CountResult = { count?: number | null; error?: unknown };

function makeSupabase(config: {
  users?: CountResult;
  games?: CountResult;
  anime?: CountResult;
  manga?: CountResult;
  movies?: CountResult;
  tv?: CountResult;
  books?: CountResult;
  articles?: CountResult;
}) {
  const usersResult = { count: 10, error: null, ...config.users };
  const gamesResult = { count: 20, error: null, ...config.games };
  const animeResult = { count: 30, error: null, ...config.anime };
  const mangaResult = { count: 40, error: null, ...config.manga };
  const moviesResult = { count: 50, error: null, ...config.movies };
  const tvResult = { count: 60, error: null, ...config.tv };
  const booksResult = { count: 70, error: null, ...config.books };
  const articlesResult = { count: 80, error: null, ...config.articles };

  const from = jest.fn((table: string) => {
    if (table === 'users') {
      return {
        select: jest.fn().mockResolvedValue(usersResult),
      };
    }

    if (table === 'media_items') {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn((_column: string, value: string) => {
            const byCategory: Record<string, CountResult> = {
              games: gamesResult,
              anime: animeResult,
              manga: mangaResult,
              movies: moviesResult,
              tv: tvResult,
              books: booksResult,
            };
            return Promise.resolve(byCategory[value]);
          }),
        }),
      };
    }

    if (table === 'articles') {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue(articlesResult),
        }),
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  });

  return { from };
}

describe('app/api/public/stats/route', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.test',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('exports runtime and revalidate', () => {
    expect(runtime).toBe('nodejs');
    expect(revalidate).toBe(300);
  });

  it('returns public stats and uses cached loader', async () => {
    createClientMock.mockReturnValue(
      makeSupabase({
        users: { count: 11 },
        games: { count: 22 },
        anime: { count: 33 },
        manga: { count: 44 },
        movies: { count: 55 },
        tv: { count: 66 },
        books: { count: null },
        articles: { count: 88 },
      }),
    );

    const res = await GET(new Request('http://localhost/api/public/stats'));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      totalUsers: 11,
      totalGames: 22,
      totalAnime: 33,
      totalManga: 44,
      totalMovies: 55,
      totalTv: 66,
      totalBooks: 0,
      totalArticles: 88,
    });

    expect(createClientMock).toHaveBeenCalledWith('https://supabase.test', 'service-role', {
      auth: { persistSession: false },
    });
    expect(unstableCacheMock).toHaveBeenCalledWith(expect.any(Function), ['public-stats-v1'], {
      revalidate: 300,
      tags: ['public-stats', 'articles'],
    });
  });

  it('returns 500 when any stats query has an error', async () => {
    createClientMock.mockReturnValue(
      makeSupabase({
        movies: { count: 0, error: { message: 'query failed' } },
      }),
    );

    const res = await GET(new Request('http://localhost/api/public/stats'));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Failed to load public stats' });
  });

  it('falls back to 0 when counts are undefined', async () => {
    createClientMock.mockReturnValue(
      makeSupabase({
        users: { count: undefined },
        games: { count: undefined },
        anime: { count: undefined },
        manga: { count: undefined },
        movies: { count: undefined },
        tv: { count: undefined },
        books: { count: undefined },
        articles: { count: undefined },
      }),
    );

    const res = await GET(new Request('http://localhost/api/public/stats'));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      totalUsers: 0,
      totalGames: 0,
      totalAnime: 0,
      totalManga: 0,
      totalMovies: 0,
      totalTv: 0,
      totalBooks: 0,
      totalArticles: 0,
    });
  });
});
