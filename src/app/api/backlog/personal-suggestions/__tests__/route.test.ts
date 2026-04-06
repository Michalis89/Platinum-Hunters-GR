/**
 * @jest-environment node
 */

import 'whatwg-fetch';

const createRouteHandlerClientMock = jest.fn();
const requireAuthMock = jest.fn();
const generateGameRecommendationsMock = jest.fn();
const generateGenericRecommendationsMock = jest.fn();

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

jest.mock('@/lib/supabase-route-handler', () => ({
  __esModule: true,
  createRouteHandlerClient: (...args: unknown[]) => createRouteHandlerClientMock(...args),
}));

jest.mock('@/lib/api/auth', () => ({
  __esModule: true,
  requireAuth: (...args: unknown[]) => requireAuthMock(...args),
  UnauthorizedError: class UnauthorizedError extends Error {},
}));

jest.mock('@/lib/api/response', () => ({
  __esModule: true,
  fail: jest.fn((body: unknown, status: number, init?: ResponseInit) => ({
    status,
    headers: new Headers((init as { headers?: HeadersInit } | undefined)?.headers),
    json: async () => body,
  })),
}));

jest.mock('@/lib/recommendations/v2/games/games-recommender', () => ({
  __esModule: true,
  generateGameRecommendationsV2WithLimits: (...args: unknown[]) =>
    generateGameRecommendationsMock(...args),
}));

jest.mock('@/lib/recommendations/v2/generic/generic-recommender', () => ({
  __esModule: true,
  generateGenericRecommendationsWithLimits: (...args: unknown[]) =>
    generateGenericRecommendationsMock(...args),
}));

import { GET } from '@/app/api/backlog/personal-suggestions/route';
import { API_ERRORS } from '@/lib/api/errors';
import { DEFAULT_COVER } from '@/lib/constants/messages';
import { UnauthorizedError } from '@/lib/api/auth';

describe('app/api/backlog/personal-suggestions/route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createRouteHandlerClientMock.mockResolvedValue({});
    requireAuthMock.mockResolvedValue({ user: { id: 'user-1' } });
    generateGameRecommendationsMock.mockResolvedValue([]);
    generateGenericRecommendationsMock.mockResolvedValue([]);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses games recommender for default/invalid category and maps items', async () => {
    generateGameRecommendationsMock.mockResolvedValueOnce([
      {
        source: 'database',
        mediaId: 10,
        title: 'Elden Ring',
        reason: 'Popular in your backlog cluster',
        confidence: 0.91,
        genres: ['RPG'],
        cover: '',
      },
      {
        source: 'backlog',
        mediaId: 11,
        title: 'Should be filtered',
        reason: 'ignore',
        confidence: 0.2,
      },
      {
        source: 'database',
        mediaId: 12,
        title: 'Hades',
        reason: 'Strong match',
        confidence: 0.87,
        tags: ['Roguelike'],
        cover: 'https://img/hades.jpg',
      },
    ]);

    const res = await GET(
      new Request('http://localhost/api/backlog/personal-suggestions?category=INVALID'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(generateGameRecommendationsMock).toHaveBeenCalledWith(
      'user-1',
      { backlog: 0, database: 4, databaseFallback: 4, total: 4 },
      { platformFilterMode: 'owned-only' },
    );
    expect(generateGenericRecommendationsMock).not.toHaveBeenCalled();
    expect(body.items).toHaveLength(2);
    expect(body.items[0]).toEqual({
      source: 'local',
      id: 'personal-games-10',
      mediaId: 10,
      title: 'Elden Ring',
      subtitle: 'Popular in your backlog cluster',
      status: 'planned',
      score: '9.1',
      tags: ['RPG'],
      cover: DEFAULT_COVER,
      description: 'Popular in your backlog cluster',
    });
    expect(body.items[1].id).toBe('personal-games-12');
    expect(body.items[1].tags).toEqual(['Roguelike']);
  });

  it('uses generic recommender for non-games category and slices to max 4 items', async () => {
    generateGenericRecommendationsMock.mockResolvedValueOnce([
      { source: 'database', mediaId: 1, title: 'A', reason: 'r1', confidence: 0.1, tags: [] },
      { source: 'database', mediaId: 2, title: 'B', reason: 'r2', confidence: 0.2, tags: [] },
      { source: 'database', mediaId: 3, title: 'C', reason: 'r3', confidence: 0.3, tags: [] },
      { source: 'database', mediaId: 4, title: 'D', reason: 'r4', confidence: 0.4, tags: [] },
      { source: 'database', mediaId: 5, title: 'E', reason: 'r5', confidence: 0.5, tags: [] },
    ]);

    const res = await GET(
      new Request('http://localhost/api/backlog/personal-suggestions?category=movies'),
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(generateGenericRecommendationsMock).toHaveBeenCalledWith('user-1', 'movies', {
      backlog: 0,
      database: 4,
      databaseFallback: 4,
      total: 4,
    });
    expect(generateGameRecommendationsMock).not.toHaveBeenCalled();
    expect(body.items).toHaveLength(4);
    expect(body.items[0].id).toBe('personal-movies-1');
    expect(body.items[3].id).toBe('personal-movies-4');
  });

  it('falls back to games when category query is missing and defaults tags to empty array', async () => {
    generateGameRecommendationsMock.mockResolvedValueOnce([
      {
        source: 'database',
        mediaId: 77,
        title: 'No Tags Item',
        reason: 'Because of your profile',
        confidence: 0.66,
        cover: null,
      },
    ]);

    const res = await GET(new Request('http://localhost/api/backlog/personal-suggestions'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].id).toBe('personal-games-77');
    expect(body.items[0].tags).toEqual([]);
    expect(body.items[0].cover).toBe(DEFAULT_COVER);
  });

  it('returns unauthorized fail response when auth fails', async () => {
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError());

    const res = await GET(
      new Request('http://localhost/api/backlog/personal-suggestions?category=games'),
    );
    expect(res.status).toBe(API_ERRORS.UNAUTHORIZED.status);
    await expect(res.json()).resolves.toEqual(API_ERRORS.UNAUTHORIZED);
  });

  it('returns internal fail response on unexpected errors', async () => {
    createRouteHandlerClientMock.mockRejectedValueOnce(new Error('boom'));

    const res = await GET(
      new Request('http://localhost/api/backlog/personal-suggestions?category=games'),
    );
    expect(res.status).toBe(API_ERRORS.INTERNAL.status);
    await expect(res.json()).resolves.toEqual(API_ERRORS.INTERNAL);
    expect(console.error).toHaveBeenCalledWith(
      'Backlog personal suggestions error:',
      expect.any(Error),
    );
  });
});
