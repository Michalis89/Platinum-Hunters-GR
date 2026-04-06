/**
 * @jest-environment node
 */

import 'whatwg-fetch';

const cachedExternalFetchMock = jest.fn();

jest.mock('@/lib/observability/withApiRoute', () => ({
  __esModule: true,
  withApiRoute: (handler: unknown) => handler,
}));

jest.mock('@/lib/constants/cache', () => ({
  __esModule: true,
  EXTERNAL_API_REVALIDATE_SECONDS: 321,
}));

jest.mock('@/lib/api-cache/external', () => {
  class MockExternalFetchError extends Error {}
  return {
    __esModule: true,
    cachedExternalFetch: (...args: unknown[]) => cachedExternalFetchMock(...args),
    ExternalFetchError: MockExternalFetchError,
  };
});

jest.mock('next/server', () => ({
  __esModule: true,
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    })),
  },
}));

import { GET } from '@/app/api/movies/details/route';
import { ExternalFetchError } from '@/lib/api-cache/external';

describe('app/api/movies/details/route', () => {
  const originalTmdbApiKey = process.env.TMDB_API_KEY;
  const originalPublicTmdbApiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  beforeEach(() => {
    cachedExternalFetchMock.mockReset();
    process.env.TMDB_API_KEY = 'server-key';
    process.env.NEXT_PUBLIC_TMDB_API_KEY = '';
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env.TMDB_API_KEY = originalTmdbApiKey;
    process.env.NEXT_PUBLIC_TMDB_API_KEY = originalPublicTmdbApiKey;
  });

  it('returns 400 when tmdb_id is missing/invalid', async () => {
    const res = await GET(new Request('http://localhost/api/movies/details'));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Missing tmdb_id' });
    expect(cachedExternalFetchMock).not.toHaveBeenCalled();
  });

  it('returns 400 for unsupported category', async () => {
    const res = await GET(
      new Request('http://localhost/api/movies/details?tmdb_id=1&category=anime'),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Unsupported category' });
  });

  it('returns 500 when no TMDB API key is configured', async () => {
    process.env.TMDB_API_KEY = '';
    process.env.NEXT_PUBLIC_TMDB_API_KEY = '';

    const res = await GET(new Request('http://localhost/api/movies/details?tmdb_id=1'));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Missing TMDB API key' });
  });

  it('returns 502 when ExternalFetchError occurs and strips prefix', async () => {
    cachedExternalFetchMock.mockRejectedValueOnce(new ExternalFetchError('[tmdb] upstream fail'));

    const res = await GET(
      new Request('http://localhost/api/movies/details?tmdb_id=10&category=tv'),
    );

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({ error: 'upstream fail' });
    expect(cachedExternalFetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        apiName: 'tmdb-details-tv',
        endpoint: expect.stringContaining('/tv/10'),
        ttlSeconds: 321,
      }),
    );
  });

  it('returns fallback 502 message when ExternalFetchError has empty message', async () => {
    cachedExternalFetchMock.mockRejectedValueOnce(new ExternalFetchError('[tmdb]   '));

    const res = await GET(new Request('http://localhost/api/movies/details?tmdb_id=10'));

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({ error: 'TMDB fetch failed' });
  });

  it('returns 500 on unexpected fetch errors', async () => {
    cachedExternalFetchMock.mockRejectedValueOnce(new Error('boom'));

    const res = await GET(new Request('http://localhost/api/movies/details?tmdb_id=10'));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Internal server error' });
  });

  it('returns normalized movie details payload', async () => {
    cachedExternalFetchMock.mockResolvedValueOnce({
      runtime: 143,
      number_of_seasons: 9,
      number_of_episodes: 99,
      genres: [
        { id: 1, name: 'Drama' },
        { id: 2, name: 'Thriller' },
      ],
      poster_path: '/poster.jpg',
      backdrop_path: '/banner.jpg',
    });

    const res = await GET(
      new Request('http://localhost/api/movies/details?tmdb_id=550&category=movies'),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      runtime: 143,
      number_of_seasons: 9,
      number_of_episodes: 99,
      genres: ['Drama', 'Thriller'],
      cover_image_large: 'https://image.tmdb.org/t/p/w780/poster.jpg',
      cover_image_medium: 'https://image.tmdb.org/t/p/w342/poster.jpg',
      banner_image: 'https://image.tmdb.org/t/p/w1280/banner.jpg',
    });
    expect(cachedExternalFetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        apiName: 'tmdb-details-movies',
        endpoint: expect.stringContaining('/movie/550'),
      }),
    );
  });

  it('uses first episode runtime for tv and handles nullish values/fallbacks', async () => {
    cachedExternalFetchMock.mockResolvedValueOnce({
      runtime: 200,
      episode_run_time: [47, 50],
      number_of_seasons: null,
      number_of_episodes: undefined,
      genres: null,
      poster_path: null,
      backdrop_path: null,
    });

    const res = await GET(new Request('http://localhost/api/movies/details?tmdb_id=1&category=tv'));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      runtime: 47,
      number_of_seasons: null,
      number_of_episodes: null,
      genres: [],
      cover_image_large: null,
      cover_image_medium: null,
      banner_image: null,
    });
  });

  it('returns null runtime for tv when episode_run_time is empty or not an array', async () => {
    cachedExternalFetchMock.mockResolvedValueOnce({
      episode_run_time: [],
      genres: [],
      poster_path: null,
      backdrop_path: null,
    });
    const res1 = await GET(
      new Request('http://localhost/api/movies/details?tmdb_id=2&category=tv'),
    );
    expect(res1.status).toBe(200);
    await expect(res1.json()).resolves.toEqual(
      expect.objectContaining({
        runtime: null,
      }),
    );

    cachedExternalFetchMock.mockResolvedValueOnce({
      episode_run_time: null,
      genres: [],
      poster_path: null,
      backdrop_path: null,
    });
    const res2 = await GET(
      new Request('http://localhost/api/movies/details?tmdb_id=3&category=tv'),
    );
    expect(res2.status).toBe(200);
    await expect(res2.json()).resolves.toEqual(
      expect.objectContaining({
        runtime: null,
      }),
    );
  });

  it('falls back to null runtime for missing movie runtime and undefined first tv episode runtime', async () => {
    cachedExternalFetchMock.mockResolvedValueOnce({
      runtime: undefined,
      genres: [],
      poster_path: null,
      backdrop_path: null,
    });
    const movieRes = await GET(
      new Request('http://localhost/api/movies/details?tmdb_id=4&category=movies'),
    );
    expect(movieRes.status).toBe(200);
    await expect(movieRes.json()).resolves.toEqual(
      expect.objectContaining({
        runtime: null,
      }),
    );

    cachedExternalFetchMock.mockResolvedValueOnce({
      episode_run_time: [undefined],
      genres: [],
      poster_path: null,
      backdrop_path: null,
    });
    const tvRes = await GET(
      new Request('http://localhost/api/movies/details?tmdb_id=5&category=tv'),
    );
    expect(tvRes.status).toBe(200);
    await expect(tvRes.json()).resolves.toEqual(
      expect.objectContaining({
        runtime: null,
      }),
    );
  });
});
