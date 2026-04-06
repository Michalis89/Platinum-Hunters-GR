jest.mock('@/lib/observability/withApiRoute', () => ({
  __esModule: true,
  withApiRoute: (handler: unknown) => handler,
}));

const createRouteHandlerClientMock = jest.fn();
jest.mock('@/lib/supabase-route-handler', () => ({
  __esModule: true,
  createRouteHandlerClient: (...args: unknown[]) => createRouteHandlerClientMock(...args),
}));

const requireAuthMock = jest.fn();
jest.mock('@/lib/api/auth', () => ({
  UnauthorizedError: class UnauthorizedError extends Error {},
  __esModule: true,
  requireAuth: (...args: unknown[]) => requireAuthMock(...args),
}));

const okMock = jest.fn((body: unknown) => ({
  status: 200,
  json: async () => ({ data: body }),
}));
const failMock = jest.fn((body: unknown, status: number) => ({
  status,
  json: async () => body,
}));
jest.mock('@/lib/api/response', () => ({
  __esModule: true,
  ok: (...args: unknown[]) => okMock(...args),
  fail: (...args: unknown[]) => failMock(...args),
}));

import { GET } from '@/app/api/dashboard/suggestions/route';
import { API_ERRORS } from '@/lib/api/errors';
import { UnauthorizedError } from '@/lib/api/auth';

type EntryRowLike = {
  status: string;
  score: string | number | null;
  progress: number | null;
  priority: number | null;
  selected_platform: string | null;
  is_favorite: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  media_items: {
    category: string | null;
    genres: string[] | null;
    tags: string[] | null;
  } | null;
};

function makeSupabase(entries: unknown, error: unknown = null) {
  const eq = jest.fn().mockResolvedValue({ data: entries, error });
  const select = jest.fn().mockReturnValue({ eq });
  const from = jest.fn().mockReturnValue({ select });

  return { from, select, eq };
}

function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

describe('app/api/dashboard/suggestions/route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireAuthMock.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('returns unauthorized error when auth fails', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabase([]));
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError('nope'));

    const response = await GET();

    expect(response.status).toBe(API_ERRORS.UNAUTHORIZED.status);
    await expect(response.json()).resolves.toEqual(API_ERRORS.UNAUTHORIZED);
  });

  it('returns internal error when entry query throws', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabase([], { message: 'db-fail' }));

    const response = await GET();

    expect(response.status).toBe(API_ERRORS.INTERNAL.status);
    await expect(response.json()).resolves.toEqual(API_ERRORS.INTERNAL);
  });

  it('builds platform-format, genre-taste and drop-balance suggestions', async () => {
    const entries: EntryRowLike[] = [];

    for (let i = 0; i < 12; i += 1) {
      entries.push({
        status: 'completed',
        score: i % 2 === 0 ? 9 : '8.5',
        progress: null,
        priority: null,
        selected_platform: 'PC',
        is_favorite: null,
        created_at: isoDaysAgo(20),
        updated_at: i < 6 ? isoDaysAgo(5) : isoDaysAgo(80),
        media_items: { category: 'games', genres: ['RPG', '', '   '], tags: null },
      });
    }

    for (let i = 0; i < 10; i += 1) {
      entries.push({
        status: 'dropped',
        score: i % 2 === 0 ? '' : 'abc',
        progress: null,
        priority: null,
        selected_platform: 'Console',
        is_favorite: null,
        created_at: isoDaysAgo(10),
        updated_at: isoDaysAgo(3),
        media_items: { category: 'games', genres: null, tags: null },
      });
    }

    entries.push(
      {
        status: 'current',
        score: Infinity,
        progress: null,
        priority: null,
        selected_platform: '   ',
        is_favorite: null,
        created_at: isoDaysAgo(1),
        updated_at: null,
        media_items: { category: 'games', genres: ['Action'], tags: null },
      },
      {
        status: 'current',
        score: null,
        progress: null,
        priority: null,
        selected_platform: null,
        is_favorite: null,
        created_at: isoDaysAgo(2),
        updated_at: null,
        media_items: { category: 'games', genres: null, tags: null },
      },
      {
        status: 'current',
        score: '7',
        progress: null,
        priority: null,
        selected_platform: null,
        is_favorite: null,
        created_at: isoDaysAgo(2),
        updated_at: null,
        media_items: null,
      },
    );

    createRouteHandlerClientMock.mockResolvedValue(makeSupabase(entries));

    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    const suggestions = body.data.suggestions as Array<{ id: string; title: string; stat: string }>;
    expect(suggestions).toHaveLength(4);
    expect(suggestions[0].id).toBe('personal-momentum');
    expect(suggestions[1].id).toBe('personal-format-platform');
    expect(suggestions[2].id).toBe('personal-taste-genre');
    expect(suggestions[3].id).toBe('personal-balance-drop');
    expect(suggestions[1].stat).toContain('Worst: Console');
  });

  it('builds category-format, category-taste and planned-balance suggestions', async () => {
    const entries: EntryRowLike[] = [];
    for (let i = 0; i < 4; i += 1) {
      entries.push({
        status: 'completed',
        score: 9,
        progress: null,
        priority: null,
        selected_platform: null,
        is_favorite: null,
        created_at: isoDaysAgo(100 + i),
        updated_at: isoDaysAgo(90 + i),
        media_items: { category: 'books', genres: null, tags: null },
      });
    }
    for (let i = 0; i < 3; i += 1) {
      entries.push({
        status: 'completed',
        score: 9,
        progress: null,
        priority: null,
        selected_platform: null,
        is_favorite: null,
        created_at: isoDaysAgo(120 + i),
        updated_at: isoDaysAgo(110 + i),
        media_items: { category: 'anime', genres: null, tags: null },
      });
    }
    for (let i = 0; i < 3; i += 1) {
      entries.push({
        status: 'completed',
        score: 7,
        progress: null,
        priority: null,
        selected_platform: null,
        is_favorite: null,
        created_at: isoDaysAgo(140 + i),
        updated_at: isoDaysAgo(130 + i),
        media_items: { category: 'manga', genres: null, tags: null },
      });
    }
    entries.push(
      {
        status: 'dropped',
        score: null,
        progress: null,
        priority: null,
        selected_platform: null,
        is_favorite: null,
        created_at: isoDaysAgo(99),
        updated_at: isoDaysAgo(89),
        media_items: { category: 'movies', genres: null, tags: null },
      },
      {
        status: 'dropped',
        score: null,
        progress: null,
        priority: null,
        selected_platform: null,
        is_favorite: null,
        created_at: isoDaysAgo(98),
        updated_at: isoDaysAgo(88),
        media_items: { category: 'movies', genres: null, tags: null },
      },
      {
        status: 'current',
        score: null,
        progress: null,
        priority: null,
        selected_platform: null,
        is_favorite: null,
        created_at: isoDaysAgo(10),
        updated_at: isoDaysAgo(9),
        media_items: { category: 'books', genres: null, tags: null },
      },
    );
    for (let i = 0; i < 25; i += 1) {
      entries.push({
        status: 'planned',
        score: null,
        progress: null,
        priority: null,
        selected_platform: null,
        is_favorite: null,
        created_at: isoDaysAgo(1),
        updated_at: isoDaysAgo(1),
        media_items: { category: 'books', genres: null, tags: null },
      });
    }

    createRouteHandlerClientMock.mockResolvedValue(makeSupabase(entries));

    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    const suggestions = body.data.suggestions as Array<{ id: string }>;

    expect(suggestions[1].id).toBe('personal-format-category');
    expect(suggestions[2].id).toBe('personal-taste-category');
    expect(suggestions[3].id).toBe('personal-balance-planned');
  });

  it('uses fallback empty suggestions when there is no signal data', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabase(null));

    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    const suggestions = body.data.suggestions as Array<{ id: string; stat: string }>;

    expect(suggestions[0].id).toBe('personal-momentum');
    expect(suggestions[0].stat).toContain('History still forming');
    expect(suggestions[1].id).toBe('personal-format-none');
    expect(suggestions[2].id).toBe('personal-taste-empty');
    expect(suggestions[3].id).toBe('personal-balance-current');
  });

  it('uses momentum unknown text when current load exists without completion history', async () => {
    const entries: EntryRowLike[] = [
      {
        status: 'current',
        score: null,
        progress: null,
        priority: null,
        selected_platform: null,
        is_favorite: null,
        created_at: null,
        updated_at: null,
        media_items: { category: 'podcasts', genres: null, tags: null },
      },
      {
        status: 'current',
        score: null,
        progress: null,
        priority: null,
        selected_platform: null,
        is_favorite: null,
        created_at: null,
        updated_at: null,
        media_items: { category: 'podcasts', genres: null, tags: null },
      },
      {
        status: 'current',
        score: null,
        progress: null,
        priority: null,
        selected_platform: null,
        is_favorite: null,
        created_at: null,
        updated_at: null,
        media_items: null,
      },
    ];
    createRouteHandlerClientMock.mockResolvedValue(makeSupabase(entries));

    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    const suggestions = body.data.suggestions as Array<{ explanation: string }>;
    expect(suggestions[0].explanation).toContain('unknown');
  });

  it('handles zero-score genre/category stats with non-completed categories', async () => {
    const entries: EntryRowLike[] = [
      {
        status: 'completed',
        score: null,
        progress: null,
        priority: null,
        selected_platform: null,
        is_favorite: null,
        created_at: isoDaysAgo(4),
        updated_at: isoDaysAgo(3),
        media_items: { category: 'games', genres: ['Mystery'], tags: null },
      },
      {
        status: 'planned',
        score: null,
        progress: null,
        priority: null,
        selected_platform: null,
        is_favorite: null,
        created_at: isoDaysAgo(2),
        updated_at: isoDaysAgo(2),
        media_items: { category: 'books', genres: null, tags: null },
      },
      {
        status: 'current',
        score: null,
        progress: null,
        priority: null,
        selected_platform: null,
        is_favorite: null,
        created_at: isoDaysAgo(1),
        updated_at: isoDaysAgo(1),
        media_items: { category: 'books', genres: null, tags: null },
      },
    ];
    createRouteHandlerClientMock.mockResolvedValue(makeSupabase(entries));

    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    const suggestions = body.data.suggestions as Array<{ id: string; stat: string }>;
    expect(suggestions[2].id).toBe('personal-taste-genre');
    expect(suggestions[2].stat).toContain('0.0 avg');
  });
});
