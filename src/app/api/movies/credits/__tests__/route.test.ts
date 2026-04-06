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

import { GET } from '@/app/api/movies/credits/route';
import { ExternalFetchError } from '@/lib/api-cache/external';

describe('app/api/movies/credits/route', () => {
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

  it('returns 400 when tmdb_id is missing or invalid', async () => {
    const res = await GET(new Request('http://localhost/api/movies/credits'));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Missing tmdb_id' });
    expect(cachedExternalFetchMock).not.toHaveBeenCalled();
  });

  it('returns 400 for unsupported category', async () => {
    const res = await GET(
      new Request('http://localhost/api/movies/credits?tmdb_id=1&category=anime'),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Unsupported category' });
    expect(cachedExternalFetchMock).not.toHaveBeenCalled();
  });

  it('returns 500 when no TMDB API key is configured', async () => {
    process.env.TMDB_API_KEY = '';
    process.env.NEXT_PUBLIC_TMDB_API_KEY = '';

    const res = await GET(new Request('http://localhost/api/movies/credits?tmdb_id=1'));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Missing TMDB API key' });
    expect(cachedExternalFetchMock).not.toHaveBeenCalled();
  });

  it('returns 502 when cachedExternalFetch throws ExternalFetchError and strips prefix', async () => {
    cachedExternalFetchMock.mockRejectedValueOnce(
      new ExternalFetchError('[tmdb] upstream exploded'),
    );

    const res = await GET(
      new Request('http://localhost/api/movies/credits?tmdb_id=42&category=tv'),
    );

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({ error: 'upstream exploded' });
    expect(cachedExternalFetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        apiName: 'tmdb-credits-tv',
        endpoint: expect.stringContaining('/tv/42/credits'),
        ttlSeconds: 321,
      }),
    );
  });

  it('returns fallback 502 message when ExternalFetchError has empty upstream message', async () => {
    cachedExternalFetchMock.mockRejectedValueOnce(new ExternalFetchError('[tmdb]   '));

    const res = await GET(
      new Request('http://localhost/api/movies/credits?tmdb_id=42&category=tv'),
    );

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({ error: 'TMDB fetch failed' });
  });

  it('returns 500 on unexpected fetch errors', async () => {
    cachedExternalFetchMock.mockRejectedValueOnce(new Error('boom'));

    const res = await GET(new Request('http://localhost/api/movies/credits?tmdb_id=42'));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Internal server error' });
  });

  it('returns normalized directors and actors in deterministic order', async () => {
    cachedExternalFetchMock.mockResolvedValueOnce({
      crew: [
        { name: '  Denis Villeneuve  ', department: 'Directing', job: 'Director' },
        { name: 'Denis Villeneuve', department: 'Directing', job: 'Director' },
        { name: 'Roger Deakins', department: 'Camera', job: 'Cinematographer' },
        { name: 'Nolan', department: 'Production', job: 'Director' },
        { name: ' ', department: 'directing', job: 'assistant director' },
      ],
      cast: [
        { name: 'Actor C', order: 2 },
        { name: '  Actor A ', order: 0 },
        { name: 'Actor B', order: 1 },
        { name: 'Actor A', order: 3 },
        { name: null, order: 4 },
      ],
    });

    const res = await GET(
      new Request('http://localhost/api/movies/credits?tmdb_id=999&category=movies'),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      directors: ['Denis Villeneuve', 'Nolan'],
      actors: ['Actor A', 'Actor B', 'Actor C'],
    });
    expect(cachedExternalFetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        apiName: 'tmdb-credits-movies',
        endpoint: expect.stringContaining('/movie/999/credits'),
      }),
    );
  });

  it('handles non-array cast/crew by returning empty lists', async () => {
    cachedExternalFetchMock.mockResolvedValueOnce({
      cast: null,
      crew: null,
    });

    const res = await GET(new Request('http://localhost/api/movies/credits?tmdb_id=123'));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ directors: [], actors: [] });
  });

  it('handles nullish crew members and nullish cast order values', async () => {
    cachedExternalFetchMock.mockResolvedValueOnce({
      crew: [
        null,
        { name: 'Director One', department: 'Directing', job: null },
        { name: 'Ignored Crew', department: undefined, job: undefined },
      ],
      cast: [
        { name: 'No Order', order: undefined },
        { name: 'Null Order', order: null },
        { name: 'Ordered', order: 0 },
      ],
    });

    const res = await GET(new Request('http://localhost/api/movies/credits?tmdb_id=321'));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      directors: ['Director One'],
      actors: ['Ordered', 'No Order', 'Null Order'],
    });
  });
});
