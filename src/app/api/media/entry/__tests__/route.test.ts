/**
 * @jest-environment node
 */

import 'whatwg-fetch';

const createRouteHandlerClientMock = jest.fn();
const createSupabaseAdminClientMock = jest.fn();
const requireAuthMock = jest.fn();
const hasAnyRoleMock = jest.fn();
const isMediaCategoryMock = jest.fn();
const fetchIgdbGameDetailsMock = jest.fn();
const findIgdbGameIdBySteamAppIdMock = jest.fn();
const mapIgdbToPayloadMock = jest.fn();
const searchIgdbGamesMock = jest.fn();
const searchIgdbGamesWithoutCategoryFilterMock = jest.fn();
const isAllowedIgdbGameCandidateMock = jest.fn();
const isAllowedIgdbCategoryMock = jest.fn();

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

jest.mock('@/lib/supabase-route-handler', () => ({
  __esModule: true,
  createRouteHandlerClient: (...args: unknown[]) => createRouteHandlerClientMock(...args),
}));

jest.mock('@/lib/supabase/admin', () => ({
  __esModule: true,
  createSupabaseAdminClient: (...args: unknown[]) => createSupabaseAdminClientMock(...args),
}));

jest.mock('@/lib/api/auth', () => ({
  __esModule: true,
  requireAuth: (...args: unknown[]) => requireAuthMock(...args),
  UnauthorizedError: class UnauthorizedError extends Error {},
}));

jest.mock('@/lib/roles', () => ({
  __esModule: true,
  hasAnyRole: (...args: unknown[]) => hasAnyRoleMock(...args),
}));

jest.mock('@/app/components/backlog/types', () => ({
  __esModule: true,
  isMediaCategory: (...args: unknown[]) => isMediaCategoryMock(...args),
}));

jest.mock('@/lib/services/igdbService', () => ({
  __esModule: true,
  fetchIgdbGameDetails: (...args: unknown[]) => fetchIgdbGameDetailsMock(...args),
  findIgdbGameIdBySteamAppId: (...args: unknown[]) => findIgdbGameIdBySteamAppIdMock(...args),
  mapIgdbToPayload: (...args: unknown[]) => mapIgdbToPayloadMock(...args),
  searchIgdbGames: (...args: unknown[]) => searchIgdbGamesMock(...args),
  searchIgdbGamesWithoutCategoryFilter: (...args: unknown[]) =>
    searchIgdbGamesWithoutCategoryFilterMock(...args),
}));

jest.mock('@/lib/igdb/categories', () => ({
  __esModule: true,
  isAllowedIgdbGameCandidate: (...args: unknown[]) => isAllowedIgdbGameCandidateMock(...args),
  isAllowedIgdbCategory: (...args: unknown[]) => isAllowedIgdbCategoryMock(...args),
}));

import { GET, PATCH, POST } from '@/app/api/media/entry/route';
import { UnauthorizedError } from '@/lib/api/auth';

type RouteClientConfig = {
  entryData?: unknown;
  entryError?: unknown;
  userRowData?: unknown;
  userRowError?: unknown;
};

function makeRouteClient(config: RouteClientConfig = {}) {
  const entryData = config.entryData ?? null;
  const entryError = config.entryError ?? null;
  const userRowData = Object.prototype.hasOwnProperty.call(config, 'userRowData')
    ? config.userRowData
    : { roles: ['admin'] };
  const userRowError = config.userRowError ?? null;

  const entryMaybeSingle = jest.fn().mockResolvedValue({ data: entryData, error: entryError });
  const entryEq3 = jest.fn().mockReturnValue({ maybeSingle: entryMaybeSingle });
  const entryEq2 = jest.fn().mockReturnValue({ eq: entryEq3 });
  const entryEq1 = jest.fn().mockReturnValue({ eq: entryEq2 });
  const entrySelect = jest.fn().mockReturnValue({ eq: entryEq1 });

  const userMaybeSingle = jest.fn().mockResolvedValue({ data: userRowData, error: userRowError });
  const userEq = jest.fn().mockReturnValue({ maybeSingle: userMaybeSingle });
  const userSelect = jest.fn().mockReturnValue({ eq: userEq });

  const from = jest.fn((table: string) => {
    if (table === 'user_media_entries') {
      return { select: entrySelect };
    }
    if (table === 'users') {
      return { select: userSelect };
    }
    throw new Error(`Unexpected route table: ${table}`);
  });

  return {
    from,
    spies: {
      entryMaybeSingle,
      userMaybeSingle,
    },
  };
}

type AdminClientConfig = {
  resolveMediaData?: unknown;
  resolveMediaError?: unknown;
  updateDescriptionData?: unknown;
  updateDescriptionError?: unknown;
  saveData?: unknown;
  saveError?: unknown;
};

function makeAdminClient(config: AdminClientConfig = {}) {
  const resolveMediaData = Object.prototype.hasOwnProperty.call(config, 'resolveMediaData')
    ? config.resolveMediaData
    : {
        id: 88,
        title: 'My Game',
        title_english: 'My Game',
        igdb_id: 42,
        igdb_category: 0,
        igdb_slug: 'my-game',
        steam_app_id: null,
        source: 'igdb',
        category: 'games',
      };
  const resolveMediaError = config.resolveMediaError ?? null;
  const updateDescriptionData = Object.prototype.hasOwnProperty.call(
    config,
    'updateDescriptionData',
  )
    ? config.updateDescriptionData
    : { id: 88, description: 'new desc' };
  const updateDescriptionError = config.updateDescriptionError ?? null;
  const saveData = config.saveData ?? { id: 88, igdb_id: 42, description: 'saved desc' };
  const saveError = config.saveError ?? null;

  const resolveMaybeSingle = jest
    .fn()
    .mockResolvedValue({ data: resolveMediaData, error: resolveMediaError });
  const resolveEq2 = jest.fn().mockReturnValue({ maybeSingle: resolveMaybeSingle });
  const resolveEq1 = jest.fn().mockReturnValue({ eq: resolveEq2 });

  const updateDescriptionMaybeSingle = jest
    .fn()
    .mockResolvedValue({ data: updateDescriptionData, error: updateDescriptionError });
  const updateSaveSingle = jest.fn().mockResolvedValue({ data: saveData, error: saveError });
  const updateSelect = jest.fn((columns: string) => {
    if (columns === 'id,description') {
      return { maybeSingle: updateDescriptionMaybeSingle };
    }
    return { single: updateSaveSingle };
  });
  const updateEq2 = jest.fn().mockReturnValue({ select: updateSelect });
  const updateEq1 = jest.fn().mockReturnValue({ eq: updateEq2 });
  const update = jest.fn().mockReturnValue({ eq: updateEq1 });

  const select = jest.fn((columns: string) => {
    if (
      columns ===
      'id,title,title_english,igdb_id,igdb_category,igdb_slug,steam_app_id,source,category'
    ) {
      return { eq: resolveEq1 };
    }
    throw new Error(`Unexpected admin select columns: ${columns}`);
  });

  const from = jest.fn((table: string) => {
    if (table === 'media_items') {
      return { select, update };
    }
    throw new Error(`Unexpected admin table: ${table}`);
  });

  return {
    from,
    spies: {
      resolveMaybeSingle,
      updateDescriptionMaybeSingle,
      updateSaveSingle,
      update,
    },
  };
}

describe('app/api/media/entry/route', () => {
  beforeEach(() => {
    createRouteHandlerClientMock.mockReset();
    createSupabaseAdminClientMock.mockReset();
    requireAuthMock.mockReset();
    hasAnyRoleMock.mockReset();
    isMediaCategoryMock.mockReset();
    fetchIgdbGameDetailsMock.mockReset();
    findIgdbGameIdBySteamAppIdMock.mockReset();
    mapIgdbToPayloadMock.mockReset();
    searchIgdbGamesMock.mockReset();
    searchIgdbGamesWithoutCategoryFilterMock.mockReset();
    isAllowedIgdbGameCandidateMock.mockReset();
    isAllowedIgdbCategoryMock.mockReset();

    requireAuthMock.mockResolvedValue({ user: { id: 'user-1' } });
    hasAnyRoleMock.mockReturnValue(true);
    isMediaCategoryMock.mockImplementation((category: string) =>
      ['games', 'movies', 'tv', 'anime', 'books', 'manga', 'coding', 'pet', 'vape'].includes(
        category,
      ),
    );
    isAllowedIgdbCategoryMock.mockReturnValue(true);
    isAllowedIgdbGameCandidateMock.mockReturnValue(true);
    searchIgdbGamesMock.mockResolvedValue([]);
    searchIgdbGamesWithoutCategoryFilterMock.mockResolvedValue([]);
    fetchIgdbGameDetailsMock.mockResolvedValue({
      id: 42,
      name: 'Resolved Game',
      category: 0,
      slug: 'resolved-game',
    });
    mapIgdbToPayloadMock.mockReturnValue({
      igdb_id: 42,
      description: 'IGDB description',
      platforms: ['Switch'],
      igdb_updated_at: '2026-01-01T00:00:00.000Z',
    });
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('GET returns 400 for invalid category/mediaId and invalid numeric mediaId', async () => {
    let res = await GET(new Request('http://localhost/api/media/entry?category=invalid&mediaId=1'));
    expect(res.status).toBe(400);

    res = await GET(new Request('http://localhost/api/media/entry?category=games&mediaId=abc'));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Invalid mediaId' });
  });

  it('GET maps UnauthorizedError to 401 and unexpected errors to 500', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeRouteClient());
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError('unauthorized'));
    let res = await GET(new Request('http://localhost/api/media/entry?category=games&mediaId=1'));
    expect(res.status).toBe(401);

    requireAuthMock.mockResolvedValue({ user: { id: 'user-1' } });
    createRouteHandlerClientMock.mockResolvedValue(
      makeRouteClient({ entryError: { message: 'db fail' }, entryData: null }),
    );
    res = await GET(new Request('http://localhost/api/media/entry?category=games&mediaId=1'));
    expect(res.status).toBe(500);
  });

  it('GET returns null entry when not found and maps entry payload when found', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeRouteClient({ entryData: null }));
    let res = await GET(new Request('http://localhost/api/media/entry?category=games&mediaId=1'));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ entry: null });

    createRouteHandlerClientMock.mockResolvedValue(
      makeRouteClient({
        entryData: {
          id: 5,
          media_id: 1,
          status: null,
          is_favorite: null,
          score: null,
          progress: null,
          notes: null,
          selected_platform: null,
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-02T00:00:00.000Z',
        },
      }),
    );
    res = await GET(new Request('http://localhost/api/media/entry?category=games&mediaId=1'));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      entry: {
        entryId: 5,
        mediaId: 1,
        status: 'planned',
        updatedAt: '2026-01-02T00:00:00.000Z',
        favorite: false,
        rating: null,
        progress: null,
        notes: null,
        selectedPlatform: null,
        startedAt: '2026-01-01T00:00:00.000Z',
        completedAt: '2026-01-02T00:00:00.000Z',
      },
    });
  });

  it('PATCH/POST map Unauthorized and Forbidden errors', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeRouteClient());
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError('unauthorized'));
    let res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'update_description',
          category: 'games',
          mediaId: 1,
          description: 'x',
        }),
      }),
    );
    expect(res.status).toBe(401);

    requireAuthMock.mockResolvedValue({ user: { id: 'user-1' } });
    createRouteHandlerClientMock.mockResolvedValue(
      makeRouteClient({ userRowData: { roles: ['user'] } }),
    );
    hasAnyRoleMock.mockReturnValue(false);
    createSupabaseAdminClientMock.mockReturnValue(makeAdminClient());
    res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'update_description',
          category: 'games',
          mediaId: 1,
          description: 'x',
        }),
      }),
    );
    expect(res.status).toBe(403);

    // POST is alias to PATCH
    createRouteHandlerClientMock.mockResolvedValue(
      makeRouteClient({ userRowData: { roles: ['user'] } }),
    );
    hasAnyRoleMock.mockReturnValue(false);
    res = await POST(
      new Request('http://localhost/api/media/entry', {
        method: 'POST',
        body: JSON.stringify({
          action: 'update_description',
          category: 'games',
          mediaId: 1,
          description: 'x',
        }),
      }),
    );
    expect(res.status).toBe(403);
  });

  it('PATCH validates payload/category/mediaId/action and games-only guard', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeRouteClient());
    createSupabaseAdminClientMock.mockReturnValue(makeAdminClient());

    let res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify(null),
      }),
    );
    expect(res.status).toBe(400);

    res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'update_description',
          category: 'invalid',
          mediaId: 1,
          description: 'x',
        }),
      }),
    );
    expect(res.status).toBe(400);

    res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'update_description', category: 'games' }),
      }),
    );
    expect(res.status).toBe(400);

    res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'update_description',
          category: 'games',
          mediaId: 0,
          description: 'x',
        }),
      }),
    );
    expect(res.status).toBe(400);

    res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'unknown_action', category: 'games', mediaId: 1 }),
      }),
    );
    expect(res.status).toBe(400);

    res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'preview_igdb_metadata', category: 'movies', mediaId: 1 }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('PATCH update_description handles success/not-found/error', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeRouteClient());
    createSupabaseAdminClientMock.mockReturnValue(
      makeAdminClient({
        updateDescriptionData: { id: 1, description: null },
        updateDescriptionError: null,
      }),
    );
    let res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'update_description',
          category: 'games',
          mediaId: 1,
          description: '   ',
        }),
      }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true, mediaId: 1, description: '' });

    createSupabaseAdminClientMock.mockReturnValue(
      makeAdminClient({ updateDescriptionData: null, updateDescriptionError: null }),
    );
    res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'update_description',
          category: 'games',
          mediaId: 1,
          description: 'x',
        }),
      }),
    );
    expect(res.status).toBe(404);

    createSupabaseAdminClientMock.mockReturnValue(
      makeAdminClient({
        updateDescriptionData: null,
        updateDescriptionError: { message: 'update fail' },
      }),
    );
    res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'update_description',
          category: 'games',
          mediaId: 1,
          description: 'x',
        }),
      }),
    );
    expect(res.status).toBe(500);
  });

  it('PATCH resolves IGDB errors and maps them to expected status codes', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeRouteClient());

    // GAME_NOT_FOUND
    createSupabaseAdminClientMock.mockReturnValue(makeAdminClient({ resolveMediaData: null }));
    let res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'preview_igdb_metadata', category: 'games', mediaId: 10 }),
      }),
    );
    expect(res.status).toBe(404);

    // IGDB_ID_NOT_RESOLVED
    createSupabaseAdminClientMock.mockReturnValue(
      makeAdminClient({
        resolveMediaData: {
          id: 10,
          title: '',
          title_english: '',
          igdb_id: null,
          igdb_category: 0,
          igdb_slug: null,
          steam_app_id: null,
          source: null,
          category: 'games',
        },
      }),
    );
    res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'preview_igdb_metadata', category: 'games', mediaId: 10 }),
      }),
    );
    expect(res.status).toBe(404);

    // IGDB_MATCH_NOT_FOUND
    createSupabaseAdminClientMock.mockReturnValue(
      makeAdminClient({
        resolveMediaData: {
          id: 10,
          title: 'Unknown Game',
          title_english: null,
          igdb_id: null,
          igdb_category: 0,
          igdb_slug: null,
          steam_app_id: null,
          source: null,
          category: 'games',
        },
      }),
    );
    searchIgdbGamesMock.mockResolvedValueOnce([]);
    searchIgdbGamesWithoutCategoryFilterMock.mockResolvedValueOnce([]);
    res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'preview_igdb_metadata', category: 'games', mediaId: 10 }),
      }),
    );
    expect(res.status).toBe(404);

    // IGDB_DETAILS_FAILED
    createSupabaseAdminClientMock.mockReturnValue(makeAdminClient());
    fetchIgdbGameDetailsMock.mockResolvedValueOnce(null);
    res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'preview_igdb_metadata', category: 'games', mediaId: 10 }),
      }),
    );
    expect(res.status).toBe(502);

    // IGDB_UNSUPPORTED_CATEGORY from media
    createSupabaseAdminClientMock.mockReturnValue(
      makeAdminClient({
        resolveMediaData: {
          id: 10,
          title: 'Unsupported',
          title_english: null,
          igdb_id: 1,
          igdb_category: 99,
          igdb_slug: 'unsupported',
          steam_app_id: null,
          source: null,
          category: 'games',
        },
      }),
    );
    isAllowedIgdbCategoryMock.mockReturnValueOnce(false);
    res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'preview_igdb_metadata', category: 'games', mediaId: 10 }),
      }),
    );
    expect(res.status).toBe(422);
  });

  it('PATCH preview and apply IGDB patch successfully (including steam app ID resolution)', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeRouteClient());
    createSupabaseAdminClientMock.mockReturnValue(
      makeAdminClient({
        resolveMediaData: {
          id: 88,
          title: 'Steam Game',
          title_english: null,
          igdb_id: null,
          igdb_category: 0,
          igdb_slug: null,
          steam_app_id: 123,
          source: 'steam',
          category: 'games',
        },
      }),
    );
    findIgdbGameIdBySteamAppIdMock.mockResolvedValue(42);
    mapIgdbToPayloadMock.mockReturnValue({
      igdb_id: 42,
      description: 'from igdb',
      platforms: ['Switch'],
      igdb_updated_at: null,
    });

    let res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'preview_igdb_metadata', category: 'games', mediaId: 88 }),
      }),
    );
    expect(res.status).toBe(200);
    const preview = await res.json();
    expect(preview.success).toBe(true);
    expect(preview.patch.platforms).toEqual(expect.arrayContaining(['PC', 'Switch']));
    expect(preview.igdbId).toBe(42);

    res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'sync_igdb_metadata', category: 'games', mediaId: 88 }),
      }),
    );
    expect(res.status).toBe(200);
    const saved = await res.json();
    expect(saved.success).toBe(true);
    expect(saved.mediaId).toBe(88);
    expect(saved.igdbId).toBe(42);
    expect(Array.isArray(saved.applied)).toBe(true);
  });

  it('PATCH returns 500 when save fails or when resolve throws unexpected error', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeRouteClient());
    createSupabaseAdminClientMock.mockReturnValue(
      makeAdminClient({ saveError: { message: 'save fail' } }),
    );
    let res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'apply_igdb_metadata_patch',
          category: 'games',
          mediaId: 88,
        }),
      }),
    );
    expect(res.status).toBe(500);

    createSupabaseAdminClientMock.mockReturnValue(makeAdminClient());
    mapIgdbToPayloadMock.mockImplementationOnce(() => {
      throw new Error('unexpected');
    });
    res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'preview_igdb_metadata', category: 'games', mediaId: 88 }),
      }),
    );
    expect(res.status).toBe(500);
  });

  it('PATCH returns 500 when privileged-user lookup query fails', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeRouteClient({ userRowError: { message: 'roles query failed' } }),
    );
    createSupabaseAdminClientMock.mockReturnValue(makeAdminClient());

    const res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'update_description',
          category: 'games',
          mediaId: 1,
          description: 'x',
        }),
      }),
    );
    expect(res.status).toBe(500);
  });

  it('PATCH resolves IGDB via search and selects best candidate by token overlap', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeRouteClient());
    createSupabaseAdminClientMock.mockReturnValue(
      makeAdminClient({
        resolveMediaData: {
          id: 77,
          title: 'Halo: Combat Evolved (2001)',
          title_english: null,
          igdb_id: null,
          igdb_category: 0,
          igdb_slug: null,
          steam_app_id: null,
          source: null,
          category: 'games',
        },
      }),
    );
    searchIgdbGamesMock.mockResolvedValueOnce([]).mockResolvedValueOnce([
      { id: 1, name: 'Halo Wars', category: 0, slug: 'halo-wars' },
      { id: 2, name: 'Halo Combat Evolved', category: 0, slug: 'halo-combat-evolved' },
    ]);
    fetchIgdbGameDetailsMock.mockImplementation(async (id: number) => ({
      id,
      name: id === 2 ? 'Halo Combat Evolved' : 'Other',
      category: 0,
      slug: 'halo-combat-evolved',
    }));
    mapIgdbToPayloadMock.mockReturnValue({
      igdb_id: 2,
      description: 'halo from igdb',
      platforms: ['Xbox'],
    });

    const res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'preview_igdb_metadata', category: 'games', mediaId: 77 }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.igdbId).toBe(2);
    expect(searchIgdbGamesMock).toHaveBeenCalled();
  });

  it('PATCH uses fallback search without category filter when strict search has no matches', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeRouteClient());
    createSupabaseAdminClientMock.mockReturnValue(
      makeAdminClient({
        resolveMediaData: {
          id: 79,
          title: 'Fallback Search Title',
          title_english: null,
          igdb_id: null,
          igdb_category: 0,
          igdb_slug: null,
          steam_app_id: null,
          source: null,
          category: 'games',
        },
      }),
    );
    searchIgdbGamesMock.mockResolvedValue([]);
    searchIgdbGamesWithoutCategoryFilterMock.mockResolvedValueOnce([
      { id: 9, name: 'Fallback Search Title', category: 0, slug: 'fallback-search-title' },
    ]);
    fetchIgdbGameDetailsMock.mockResolvedValue({
      id: 9,
      name: 'Fallback Search Title',
      category: 0,
      slug: 'fallback-search-title',
    });
    mapIgdbToPayloadMock.mockReturnValue({
      igdb_id: 9,
      description: 'fallback matched',
      platforms: [],
    });

    const res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'preview_igdb_metadata', category: 'games', mediaId: 79 }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.igdbId).toBe(9);
    expect(searchIgdbGamesWithoutCategoryFilterMock).toHaveBeenCalled();
  });

  it('PATCH selectBestCandidate chooses exact normalized match', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeRouteClient());
    createSupabaseAdminClientMock.mockReturnValue(
      makeAdminClient({
        resolveMediaData: {
          id: 81,
          title: 'Foo-Bar',
          title_english: null,
          igdb_id: null,
          igdb_category: 0,
          igdb_slug: null,
          steam_app_id: null,
          source: null,
          category: 'games',
        },
      }),
    );
    searchIgdbGamesMock.mockResolvedValueOnce([
      { id: 11, name: 'foo bar', category: 0, slug: 'foo-bar' },
      { id: 12, name: 'Foo Something Else', category: 0, slug: 'foo-something' },
    ]);
    fetchIgdbGameDetailsMock.mockResolvedValue({
      id: 11,
      name: 'foo bar',
      category: 0,
      slug: 'foo-bar',
    });
    mapIgdbToPayloadMock.mockReturnValue({ igdb_id: 11, description: 'exact', platforms: [] });

    const res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'preview_igdb_metadata', category: 'games', mediaId: 81 }),
      }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({
        igdbId: 11,
      }),
    );
  });

  it('PATCH selectBestCandidate handles empty query tokens and candidate token-skip branches', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeRouteClient());
    createSupabaseAdminClientMock.mockReturnValue(
      makeAdminClient({
        resolveMediaData: {
          id: 82,
          title: '!!!',
          title_english: null,
          igdb_id: null,
          igdb_category: 0,
          igdb_slug: null,
          steam_app_id: null,
          source: null,
          category: 'games',
        },
      }),
    );
    searchIgdbGamesMock.mockResolvedValueOnce([
      { id: 21, name: '###', category: 0, slug: 'empty-tokens' },
      { id: 22, name: 'Different Tokens', category: 0, slug: 'different-tokens' },
      { id: 23, name: 'Primary Choice', category: 0, slug: 'primary-choice' },
    ]);
    fetchIgdbGameDetailsMock.mockResolvedValue({
      id: 21,
      name: '###',
      category: 0,
      slug: 'empty-tokens',
    });
    mapIgdbToPayloadMock.mockReturnValue({
      igdb_id: 21,
      description: 'empty tokens',
      platforms: [],
    });

    const res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'preview_igdb_metadata', category: 'games', mediaId: 82 }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.igdbId).toBe(21);
  });

  it('PATCH selectBestCandidate falls back to first candidate when query tokenization is empty and no exact match exists', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeRouteClient());
    createSupabaseAdminClientMock.mockReturnValue(
      makeAdminClient({
        resolveMediaData: {
          id: 83,
          title: '!!!',
          title_english: null,
          igdb_id: null,
          igdb_category: 0,
          igdb_slug: null,
          steam_app_id: null,
          source: null,
          category: 'games',
        },
      }),
    );
    searchIgdbGamesMock.mockResolvedValueOnce([
      { id: 31, name: 'First Candidate', category: 0, slug: 'first-candidate' },
      { id: 32, name: 'Second Candidate', category: 0, slug: 'second-candidate' },
    ]);
    fetchIgdbGameDetailsMock.mockResolvedValue({
      id: 31,
      name: 'First Candidate',
      category: 0,
      slug: 'first-candidate',
    });
    mapIgdbToPayloadMock.mockReturnValue({
      igdb_id: 31,
      description: 'first fallback',
      platforms: [],
    });

    const res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'preview_igdb_metadata', category: 'games', mediaId: 83 }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.igdbId).toBe(31);
  });

  it('PATCH selectBestCandidate scoring skips empty-token and zero-overlap candidates', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeRouteClient());
    createSupabaseAdminClientMock.mockReturnValue(
      makeAdminClient({
        resolveMediaData: {
          id: 84,
          title: 'Alpha Beta',
          title_english: null,
          igdb_id: null,
          igdb_category: 0,
          igdb_slug: null,
          steam_app_id: null,
          source: null,
          category: 'games',
        },
      }),
    );
    searchIgdbGamesMock.mockResolvedValueOnce([
      { id: 41, name: '!!!', category: 0, slug: 'empty' },
      { id: 42, name: 'Gamma Delta', category: 0, slug: 'no-overlap' },
      { id: 43, name: 'Alpha', category: 0, slug: 'overlap' },
    ]);
    fetchIgdbGameDetailsMock.mockResolvedValue({
      id: 43,
      name: 'Alpha',
      category: 0,
      slug: 'overlap',
    });
    mapIgdbToPayloadMock.mockReturnValue({
      igdb_id: 43,
      description: 'overlap winner',
      platforms: [],
    });

    const res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'preview_igdb_metadata', category: 'games', mediaId: 84 }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.igdbId).toBe(43);
  });

  it('PATCH returns 422 when fetched IGDB game is unsupported and 500 when resolve media query fails', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeRouteClient());
    createSupabaseAdminClientMock.mockReturnValue(
      makeAdminClient({
        resolveMediaData: {
          id: 99,
          title: 'Supported Seed',
          title_english: null,
          igdb_id: 5,
          igdb_category: 0,
          igdb_slug: 'supported-seed',
          steam_app_id: null,
          source: null,
          category: 'games',
        },
      }),
    );
    isAllowedIgdbGameCandidateMock.mockReset();
    isAllowedIgdbGameCandidateMock.mockReturnValueOnce(true).mockReturnValueOnce(false);

    let res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'preview_igdb_metadata', category: 'games', mediaId: 99 }),
      }),
    );
    expect(res.status).toBe(422);

    isAllowedIgdbGameCandidateMock.mockReturnValue(true);
    createSupabaseAdminClientMock.mockReturnValue(
      makeAdminClient({
        resolveMediaData: null,
        resolveMediaError: { message: 'resolve db fail' },
      }),
    );
    res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'preview_igdb_metadata', category: 'games', mediaId: 99 }),
      }),
    );
    expect(res.status).toBe(500);
  });

  it('GET maps nullable fallback fields when created/updated timestamps are missing', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeRouteClient({
        entryData: {
          id: 9,
          media_id: 7,
          status: 'completed',
          is_favorite: true,
          score: 9,
          progress: 100,
          notes: 'done',
          selected_platform: 'PC',
          created_at: undefined,
          updated_at: undefined,
        },
      }),
    );

    const res = await GET(new Request('http://localhost/api/media/entry?category=games&mediaId=7'));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      entry: {
        entryId: 9,
        mediaId: 7,
        status: 'completed',
        updatedAt: null,
        favorite: true,
        rating: 9,
        progress: 100,
        notes: 'done',
        selectedPlatform: 'PC',
        startedAt: null,
        completedAt: null,
      },
    });
  });

  it('PATCH update_description handles missing description field via empty-string fallback', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeRouteClient());
    const admin = makeAdminClient({ updateDescriptionData: { id: 15, description: null } });
    createSupabaseAdminClientMock.mockReturnValue(admin);

    const res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'update_description', category: 'games', mediaId: 15 }),
      }),
    );
    expect(res.status).toBe(200);
    expect(admin.spies.update).toHaveBeenCalledWith({ description: null });
  });

  it('PATCH preview and apply fall back when patch/saved description and igdb_id are missing', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeRouteClient());
    createSupabaseAdminClientMock.mockReturnValue(
      makeAdminClient({
        resolveMediaData: {
          id: 91,
          title: 'No Optional Fields',
          title_english: null,
          igdb_id: 91,
          igdb_category: 0,
          igdb_slug: null,
          steam_app_id: null,
          source: null,
          category: 'games',
        },
        saveData: { id: 91, igdb_id: undefined, description: undefined },
      }),
    );
    fetchIgdbGameDetailsMock.mockResolvedValue({
      id: 91,
      name: 'No Optional Fields',
      category: 0,
      slug: undefined,
    });
    mapIgdbToPayloadMock.mockReturnValue({ igdb_id: 91, description: undefined, platforms: [] });

    let res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'preview_igdb_metadata', category: 'games', mediaId: 91 }),
      }),
    );
    expect(res.status).toBe(200);
    let body = await res.json();
    expect(body.description).toBe('');

    res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'sync_igdb_metadata', category: 'games', mediaId: 91 }),
      }),
    );
    expect(res.status).toBe(200);
    body = await res.json();
    expect(body.igdbId).toBeNull();
    expect(body.description).toBe('');
  });

  it('PATCH supports user rows without roles array and candidate/game entries without slug or name', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeRouteClient({
        userRowData: null,
      }),
    );
    hasAnyRoleMock.mockReturnValue(false);
    createSupabaseAdminClientMock.mockReturnValue(makeAdminClient());
    let res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'update_description',
          category: 'games',
          mediaId: 99,
          description: 'x',
        }),
      }),
    );
    expect(res.status).toBe(403);

    hasAnyRoleMock.mockReturnValue(true);
    createRouteHandlerClientMock.mockResolvedValue(makeRouteClient());
    createSupabaseAdminClientMock.mockReturnValue(
      makeAdminClient({
        resolveMediaData: {
          id: 92,
          title: 'Token Query',
          title_english: null,
          igdb_id: null,
          igdb_category: 0,
          igdb_slug: null,
          steam_app_id: null,
          source: null,
          category: 'games',
        },
      }),
    );
    searchIgdbGamesMock.mockResolvedValueOnce([
      { id: 51, name: undefined, category: 0, slug: undefined },
      { id: 52, name: 'Token Query', category: 0, slug: undefined },
    ]);
    fetchIgdbGameDetailsMock.mockResolvedValue({
      id: 52,
      name: 'Token Query',
      category: 0,
      slug: undefined,
    });
    mapIgdbToPayloadMock.mockReturnValue({ igdb_id: 52, description: 'ok', platforms: [] });

    res = await PATCH(
      new Request('http://localhost/api/media/entry', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'preview_igdb_metadata', category: 'games', mediaId: 92 }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.igdbId).toBe(52);
  });
});
