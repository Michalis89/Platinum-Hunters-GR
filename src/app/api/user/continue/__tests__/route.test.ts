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

const createRouteHandlerClientMock = jest.fn();
jest.mock('@/lib/supabase-route-handler', () => ({
  __esModule: true,
  createRouteHandlerClient: (...args: unknown[]) => createRouteHandlerClientMock(...args),
}));

const requireAuthMock = jest.fn();
jest.mock('@/lib/api/auth', () => ({
  __esModule: true,
  requireAuth: (...args: unknown[]) => requireAuthMock(...args),
  UnauthorizedError: class UnauthorizedError extends Error {},
}));

const failMock = jest.fn((body: unknown, status: number) => ({
  status,
  json: async () => body,
}));
jest.mock('@/lib/api/response', () => ({
  __esModule: true,
  fail: (...args: unknown[]) => failMock(...args),
}));

import { GET } from '@/app/api/user/continue/route';
import { API_ERRORS } from '@/lib/api/errors';
import { UnauthorizedError } from '@/lib/api/auth';

type SetupParams = {
  categoryProfile?: { profiles?: Record<string, unknown> } | null;
  currentEntries?: unknown[] | null;
  currentError?: unknown;
  countEntries?: unknown[] | null;
  countError?: unknown;
};

function makeSupabase(params: SetupParams = {}) {
  const categoryProfile = params.categoryProfile ?? null;
  const currentEntries = params.currentEntries ?? [];
  const currentError = params.currentError ?? null;
  const countEntries = params.countEntries ?? [];
  const countError = params.countError ?? null;

  const profileMaybeSingle = jest.fn().mockResolvedValue({ data: categoryProfile, error: null });
  const profileEq = jest.fn().mockReturnValue({ maybeSingle: profileMaybeSingle });
  const profileSelect = jest.fn().mockReturnValue({ eq: profileEq });

  const currentOrder3 = jest.fn().mockResolvedValue({ data: currentEntries, error: currentError });
  const currentOrder2 = jest.fn().mockReturnValue({ order: currentOrder3 });
  const currentOrder1 = jest.fn().mockReturnValue({ order: currentOrder2 });
  const currentIn = jest.fn().mockReturnValue({ order: currentOrder1 });
  const currentGt = jest.fn().mockReturnValue({ in: currentIn });
  const currentEq2 = jest.fn().mockReturnValue({ gt: currentGt });
  const currentEq1 = jest.fn().mockReturnValue({ eq: currentEq2 });
  const currentSelect = jest.fn().mockReturnValue({ eq: currentEq1 });

  const countIn = jest.fn().mockResolvedValue({ data: countEntries, error: countError });
  const countEq = jest.fn().mockReturnValue({ in: countIn });
  const countSelect = jest.fn().mockReturnValue({ eq: countEq });

  const from = jest.fn((table: string) => {
    if (table === 'user_category_profiles') {
      return { select: profileSelect };
    }
    if (table === 'user_media_entries') {
      return {
        select: (selection: string) =>
          selection.includes('id,') ? currentSelect() : countSelect(),
      };
    }
    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    from,
    spies: {
      currentSelect,
      countSelect,
      currentOrder3,
      countIn,
      profileMaybeSingle,
    },
  };
}

describe('app/api/user/continue/route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireAuthMock.mockResolvedValue({ user: { id: 'user-1' } });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns unauthorized fail response when auth fails', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabase());
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError('nope'));

    const res = await GET();

    expect(res.status).toBe(API_ERRORS.UNAUTHORIZED.status);
    await expect(res.json()).resolves.toEqual(API_ERRORS.UNAUTHORIZED);
  });

  it('returns empty payload when no enabled dashboard categories are present', async () => {
    const supabase = makeSupabase({
      categoryProfile: { profiles: { invalid: {}, unknown: {} } },
    });
    createRouteHandlerClientMock.mockResolvedValue(supabase);

    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      enabledCategories: [],
      slides: [],
      countsByCategory: {},
    });
    expect(supabase.spies.currentSelect).not.toHaveBeenCalled();
    expect(supabase.spies.countSelect).not.toHaveBeenCalled();
  });

  it('skips slide query when enabled categories have no slide-compatible types', async () => {
    const supabase = makeSupabase({
      categoryProfile: { profiles: { movies: {} } },
      countEntries: [
        { status: 'planned', media_items: { category: 'movies' } },
        { status: 'paused', media_items: { category: 'movies' } },
        { status: null, media_items: { category: 'movies' } },
      ],
    });
    createRouteHandlerClientMock.mockResolvedValue(supabase);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.enabledCategories).toEqual(['movies']);
    expect(body.slides).toEqual([]);
    expect(body.countsByCategory.movies).toEqual({
      total: 2,
      planned: 1,
      current: 0,
      completed: 0,
      dropped: 0,
    });
    expect(supabase.spies.currentSelect).not.toHaveBeenCalled();
    expect(supabase.spies.countSelect).toHaveBeenCalled();
  });

  it('builds slides with title/cover normalization, deduplicates by category, and sorts by activity', async () => {
    const supabase = makeSupabase({
      categoryProfile: {
        profiles: { games: {}, anime: {}, tv: {}, books: {}, manga: {}, invalid: {} },
      },
      currentEntries: [
        {
          id: 10,
          media_id: 100,
          status: 'current',
          progress: 55,
          score: 9.5,
          updated_at: '2026-01-10T10:00:00.000Z',
          created_at: '2026-01-01T10:00:00.000Z',
          media_items: {
            category: 'games',
            source: 'steam',
            steam_app_id: 1000,
            title: null,
            title_english: 'Game English',
            title_romaji: null,
            title_native: null,
            original_title: null,
            season_year: 2026,
            release_date: '2026-01-01',
            cover_image_large: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1000/header.jpg',
            cover_image_medium:
              'https://cdn.cloudflare.steamstatic.com/steam/apps/1000/capsule_184x69.jpg',
          },
        },
        {
          id: 11,
          media_id: 101,
          status: 'current',
          progress: 20,
          score: null,
          updated_at: '2026-01-10T10:00:00.000Z',
          created_at: '2026-01-02T10:00:00.000Z',
          media_items: {
            category: 'games',
            source: 'steam',
            steam_app_id: 1001,
            title: 'Newer Game',
            title_english: null,
            title_romaji: null,
            title_native: null,
            original_title: null,
            season_year: null,
            release_date: null,
            cover_image_large: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1001/header.jpg',
            cover_image_medium: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1001/header.jpg',
          },
        },
        {
          id: 20,
          media_id: 200,
          status: 'current',
          progress: 30,
          score: 7,
          updated_at: '2026-01-09T10:00:00.000Z',
          created_at: '2026-01-07T10:00:00.000Z',
          media_items: {
            category: 'anime',
            source: 'anilist',
            steam_app_id: null,
            title: null,
            title_english: null,
            title_romaji: 'Romaji Title',
            title_native: null,
            original_title: null,
            season_year: 2025,
            release_date: '2025-03-01',
            cover_image_large: 'https://cdn.example.com/a.jpg',
            cover_image_medium: null,
          },
        },
        {
          id: 30,
          media_id: 300,
          status: 'current',
          progress: 10,
          score: 8,
          updated_at: '2026-01-09T10:00:00.000Z',
          created_at: '2026-01-08T10:00:00.000Z',
          media_items: {
            category: 'tv',
            source: 'tmdb',
            steam_app_id: null,
            title: null,
            title_english: null,
            title_romaji: null,
            title_native: null,
            original_title: 'Original TV',
            season_year: null,
            release_date: null,
            cover_image_large: null,
            cover_image_medium: null,
          },
        },
        {
          id: 40,
          media_id: 400,
          status: 'current',
          progress: null,
          score: undefined,
          updated_at: null,
          created_at: null,
          media_items: {
            category: 'books',
            source: 'steam',
            steam_app_id: 2222,
            title: null,
            title_english: null,
            title_romaji: null,
            title_native: null,
            original_title: null,
            season_year: null,
            release_date: null,
            cover_image_large:
              'https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/2222/header.jpg',
            cover_image_medium:
              'https://cdn.cloudflare.steamstatic.com/steam/apps/2222/capsule_184x69.jpg',
          },
        },
        {
          id: 50,
          media_id: 500,
          status: 'current',
          progress: 5,
          score: 6,
          updated_at: null,
          created_at: null,
          media_items: {
            category: 'manga',
            source: 'steam',
            steam_app_id: 3333,
            title: 'Steam Null Cover',
            title_english: null,
            title_romaji: null,
            title_native: null,
            original_title: null,
            season_year: null,
            release_date: null,
            cover_image_large: null,
            cover_image_medium: null,
          },
        },
        {
          id: 99,
          media_id: 999,
          status: 'current',
          progress: 1,
          score: 1,
          updated_at: '2026-01-11T10:00:00.000Z',
          created_at: '2026-01-11T10:00:00.000Z',
          media_items: null,
        },
      ],
      countEntries: [
        { status: 'current', media_items: { category: 'games' } },
        { status: 'completed', media_items: { category: 'anime' } },
        { status: 'dropped', media_items: { category: 'anime' } },
        { status: 'planned', media_items: { category: 'tv' } },
        { status: 'current', media_items: { category: 'books' } },
        { status: 'current', media_items: { category: 'manga' } },
        { status: 'ignored-status', media_items: { category: 'games' } },
        { status: 'current', media_items: { category: 'unknown' } },
      ],
    });
    createRouteHandlerClientMock.mockResolvedValue(supabase);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.enabledCategories).toEqual(['games', 'anime', 'tv', 'books', 'manga']);
    expect(body.slides).toHaveLength(5);
    expect(body.slides[0].category).toBe('games');
    expect(body.slides[0].entry_id).toBe(11);
    expect(body.slides[0].title).toBe('Newer Game');
    expect(body.slides[0].score).toBe(null);
    expect(body.slides[0].cover_image_large).toBe(null);
    expect(body.slides[0].cover_image_medium).toBe(null);
    expect(body.slides[1].category).toBe('tv');
    expect(body.slides[1].title).toBe('Original TV');
    expect(body.slides[2].category).toBe('anime');
    expect(body.slides[2].title).toBe('Romaji Title');
    const booksSlide = body.slides.find(
      (slide: { category: string }) => slide.category === 'books',
    );
    const mangaSlide = body.slides.find(
      (slide: { category: string }) => slide.category === 'manga',
    );
    expect(booksSlide).toBeTruthy();
    expect(mangaSlide).toBeTruthy();
    expect(booksSlide.title).toBe(null);
    expect(booksSlide.updated_at).toBe('');
    expect(booksSlide.created_at).toBe('');
    expect(booksSlide.cover_image_large).toContain('/steamcommunity/public/images/apps/');
    expect(booksSlide.cover_image_medium).toContain('/steamcommunity/public/images/apps/');
    expect(mangaSlide.cover_image_large).toBe(null);
    expect(mangaSlide.cover_image_medium).toBe(null);

    expect(body.countsByCategory.games).toEqual({
      total: 2,
      planned: 0,
      current: 1,
      completed: 0,
      dropped: 0,
    });
    expect(body.countsByCategory.anime).toEqual({
      total: 2,
      planned: 0,
      current: 0,
      completed: 1,
      dropped: 1,
    });
    expect(body.countsByCategory.tv).toEqual({
      total: 1,
      planned: 1,
      current: 0,
      completed: 0,
      dropped: 0,
    });
    expect(body.countsByCategory.books).toEqual({
      total: 1,
      planned: 0,
      current: 1,
      completed: 0,
      dropped: 0,
    });
    expect(body.countsByCategory.manga).toEqual({
      total: 1,
      planned: 0,
      current: 1,
      completed: 0,
      dropped: 0,
    });
  });

  it('returns internal fail when current entries query fails', async () => {
    const supabase = makeSupabase({
      categoryProfile: { profiles: { games: {} } },
      currentError: { message: 'current failed' },
    });
    createRouteHandlerClientMock.mockResolvedValue(supabase);

    const res = await GET();
    expect(res.status).toBe(API_ERRORS.INTERNAL.status);
    await expect(res.json()).resolves.toEqual(API_ERRORS.INTERNAL);
  });

  it('returns internal fail when count query fails', async () => {
    const supabase = makeSupabase({
      categoryProfile: { profiles: { anime: {} } },
      countError: { message: 'count failed' },
    });
    createRouteHandlerClientMock.mockResolvedValue(supabase);

    const res = await GET();
    expect(res.status).toBe(API_ERRORS.INTERNAL.status);
    await expect(res.json()).resolves.toEqual(API_ERRORS.INTERNAL);
  });
});
