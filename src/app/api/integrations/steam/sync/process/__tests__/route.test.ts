/**
 * @jest-environment node
 */

import 'whatwg-fetch';

const createRouteHandlerClientMock = jest.fn();
const createSupabaseAdminClientMock = jest.fn();
const requireAuthMock = jest.fn();
const matchSteamGamesToIgdbMock = jest.fn();
const enrichIgdbMatchesMock = jest.fn();
const buildGameMetadataPatchMock = jest.fn();
const deriveStatusFromSteamDataMock = jest.fn();
const normalizeTitleMock = jest.fn();
const getSteamHoursMock = jest.fn();
const mapWithConcurrencyMock = jest.fn();
const refreshGenreAffinityMock = jest.fn();

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

jest.mock('@/lib/integrations/steam-sync-helpers', () => ({
  __esModule: true,
  matchSteamGamesToIgdb: (...args: unknown[]) => matchSteamGamesToIgdbMock(...args),
  enrichIgdbMatches: (...args: unknown[]) => enrichIgdbMatchesMock(...args),
  buildGameMetadataPatch: (...args: unknown[]) => buildGameMetadataPatchMock(...args),
  deriveStatusFromSteamData: (...args: unknown[]) => deriveStatusFromSteamDataMock(...args),
  normalizeTitle: (...args: unknown[]) => normalizeTitleMock(...args),
  getSteamHours: (...args: unknown[]) => getSteamHoursMock(...args),
  mapWithConcurrency: (...args: unknown[]) => mapWithConcurrencyMock(...args),
}));

jest.mock('@/lib/profile/genre-affinity', () => ({
  __esModule: true,
  refreshGenreAffinity: (...args: unknown[]) => refreshGenreAffinityMock(...args),
}));

import { POST } from '@/app/api/integrations/steam/sync/process/route';
import { UnauthorizedError } from '@/lib/api/auth';
import type { SteamGameWithAchievements } from '@/lib/integrations/steam-sync-helpers';
import type { IgdbGame } from '@/lib/services/igdbService';

type QueryError = { message?: string } | null;

type RouteClientConfig = {
  jobData?: unknown;
  jobError?: QueryError;
  existingEntryRows?: unknown[] | null;
  userGameRows?: unknown[] | null;
};

function makeRouteClient(config: RouteClientConfig = {}) {
  const jobData = config.jobData ?? null;
  const jobError = config.jobError ?? null;
  const existingEntryRows = config.existingEntryRows === undefined ? [] : config.existingEntryRows;
  const userGameRows = config.userGameRows === undefined ? [] : config.userGameRows;

  const jobMaybeSingle = jest.fn().mockResolvedValue({ data: jobData, error: jobError });
  const jobEqUser = jest.fn().mockReturnValue({ maybeSingle: jobMaybeSingle });
  const jobEqId = jest.fn().mockReturnValue({ eq: jobEqUser });
  const jobSelect = jest.fn().mockReturnValue({ eq: jobEqId });
  const jobUpdateEq = jest.fn().mockResolvedValue({ error: null });
  const jobUpdate = jest.fn().mockReturnValue({ eq: jobUpdateEq });

  const userEntriesIn = jest.fn().mockResolvedValue({ data: existingEntryRows, error: null });
  const userEntriesEqForIn = jest.fn().mockReturnValue({ in: userEntriesIn });
  const userEntriesEqSecond = jest.fn().mockResolvedValue({ data: userGameRows, error: null });
  const userEntriesEqFirst = jest.fn().mockReturnValue({ eq: userEntriesEqSecond });
  const userEntriesSelect = jest.fn((columns: string) => {
    if (columns.includes('media_items!inner')) {
      return { eq: userEntriesEqFirst };
    }
    return { eq: userEntriesEqForIn };
  });
  const userEntriesUpsert = jest.fn().mockResolvedValue({ error: null });

  const from = jest.fn((table: string) => {
    if (table === 'steam_sync_jobs') {
      return { select: jobSelect, update: jobUpdate };
    }
    if (table === 'user_media_entries') {
      return { select: userEntriesSelect, upsert: userEntriesUpsert };
    }
    throw new Error(`Unexpected route table: ${table}`);
  });

  return {
    from,
    spies: {
      jobMaybeSingle,
      jobUpdate,
      jobUpdateEq,
      userEntriesUpsert,
    },
  };
}

type AdminClientConfig = {
  existingMediaRows?: unknown[] | null;
  igdbRows?: unknown[] | null;
  allGamesRows?: unknown[] | null;
  bulkInsertRows?: unknown[] | null;
  bulkInsertError?: QueryError;
};

function makeAdminClient(config: AdminClientConfig = {}) {
  const existingMediaRows = config.existingMediaRows === undefined ? [] : config.existingMediaRows;
  const igdbRows = config.igdbRows === undefined ? [] : config.igdbRows;
  const allGamesRows = config.allGamesRows === undefined ? [] : config.allGamesRows;
  const bulkInsertRows = config.bulkInsertRows === undefined ? [] : config.bulkInsertRows;
  const bulkInsertError = config.bulkInsertError ?? null;

  const selectExistingMediaIn = jest
    .fn()
    .mockResolvedValue({ data: existingMediaRows, error: null });
  const selectExistingMediaEq = jest.fn().mockReturnValue({ in: selectExistingMediaIn });

  const selectIgdbIn = jest.fn().mockResolvedValue({ data: igdbRows, error: null });
  const selectIgdbEq = jest.fn().mockReturnValue({ in: selectIgdbIn });

  const selectAllGamesEq = jest.fn().mockResolvedValue({ data: allGamesRows, error: null });

  const mediaSelect = jest.fn((columns: string) => {
    if (columns === 'id,steam_app_id,rawg_id,source') {
      return { eq: selectExistingMediaEq };
    }
    if (columns === 'id,rawg_id') {
      return { eq: selectIgdbEq };
    }
    if (columns === 'id,title,title_english,steam_app_id,rawg_id,source') {
      return { eq: selectAllGamesEq };
    }
    throw new Error(`Unexpected media select columns: ${columns}`);
  });

  const bulkInsertSelect = jest
    .fn()
    .mockResolvedValue({ data: bulkInsertRows, error: bulkInsertError });
  const singleInsertSingle = jest.fn().mockResolvedValue({ data: { id: 9999, steam_app_id: 0 } });
  const singleInsertSelect = jest.fn().mockReturnValue({ single: singleInsertSingle });
  const mediaInsert = jest.fn((payload: unknown) => {
    if (Array.isArray(payload)) {
      return { select: bulkInsertSelect };
    }
    return { select: singleInsertSelect };
  });

  const mediaUpdateEq = jest.fn().mockResolvedValue({ error: null });
  const mediaUpdate = jest.fn().mockReturnValue({ eq: mediaUpdateEq });

  const from = jest.fn((table: string) => {
    if (table === 'media_items') {
      return { select: mediaSelect, insert: mediaInsert, update: mediaUpdate };
    }
    throw new Error(`Unexpected admin table: ${table}`);
  });

  return {
    from,
    spies: {
      mediaInsert,
      bulkInsertSelect,
      singleInsertSingle,
      mediaUpdate,
      mediaUpdateEq,
    },
  };
}

function game(overrides?: Partial<SteamGameWithAchievements>): SteamGameWithAchievements {
  return {
    appid: 101,
    name: 'Test Game',
    playtime_forever: 120,
    rtime_last_played: 1700000000,
    achievementsPercent: 50,
    ...overrides,
  };
}

describe('app/api/integrations/steam/sync/process/route', () => {
  beforeEach(() => {
    createRouteHandlerClientMock.mockReset();
    createSupabaseAdminClientMock.mockReset();
    requireAuthMock.mockReset();
    matchSteamGamesToIgdbMock.mockReset();
    enrichIgdbMatchesMock.mockReset();
    buildGameMetadataPatchMock.mockReset();
    deriveStatusFromSteamDataMock.mockReset();
    normalizeTitleMock.mockReset();
    getSteamHoursMock.mockReset();
    mapWithConcurrencyMock.mockReset();
    refreshGenreAffinityMock.mockReset();

    requireAuthMock.mockResolvedValue({ user: { id: 'user-1' } });
    normalizeTitleMock.mockImplementation((value: string | null | undefined) =>
      typeof value === 'string' ? value.trim().toLowerCase() : '',
    );
    getSteamHoursMock.mockImplementation((g: { playtime_forever?: number }) =>
      typeof g?.playtime_forever === 'number'
        ? Math.round((g.playtime_forever / 60) * 100) / 100
        : null,
    );
    deriveStatusFromSteamDataMock.mockReturnValue('in_progress');
    buildGameMetadataPatchMock.mockImplementation((g: SteamGameWithAchievements, igdb: IgdbGame) => ({
      steam_app_id: g.appid,
      rawg_id: igdb?.id ?? null,
      source: 'igdb',
      title: igdb?.name ?? g.name,
    }));
    mapWithConcurrencyMock.mockImplementation(
      async (items: unknown[], _limit: number, fn: (item: unknown) => Promise<unknown>) => {
        const results: unknown[] = [];
        for (const item of items) {
          results.push(await fn(item));
        }
        return results;
      },
    );
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 400 when jobId is missing', async () => {
    const res = await POST(
      new Request('http://localhost/api/integrations/steam/sync/process', { method: 'POST' }),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Missing jobId parameter' });
  });

  it('returns 401 when auth fails with UnauthorizedError', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeRouteClient());
    createSupabaseAdminClientMock.mockReturnValue(makeAdminClient());
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError('unauthorized'));

    const res = await POST(
      new Request('http://localhost/api/integrations/steam/sync/process?jobId=job-1', {
        method: 'POST',
      }),
    );
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 404 when job is missing or query fails', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeRouteClient({ jobData: null }));
    createSupabaseAdminClientMock.mockReturnValue(makeAdminClient());
    let res = await POST(
      new Request('http://localhost/api/integrations/steam/sync/process?jobId=job-1', {
        method: 'POST',
      }),
    );
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'Job not found' });

    createRouteHandlerClientMock.mockResolvedValue(
      makeRouteClient({ jobData: null, jobError: { message: 'db fail' } }),
    );
    createSupabaseAdminClientMock.mockReturnValue(makeAdminClient());
    res = await POST(
      new Request('http://localhost/api/integrations/steam/sync/process?jobId=job-2', {
        method: 'POST',
      }),
    );
    expect(res.status).toBe(404);
  });

  it('returns immediately for completed and failed jobs', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeRouteClient({
        jobData: { status: 'completed', processed_count: 10, total_steps: 10, user_id: 'user-1' },
      }),
    );
    createSupabaseAdminClientMock.mockReturnValue(makeAdminClient());
    let res = await POST(
      new Request('http://localhost/api/integrations/steam/sync/process?jobId=done', {
        method: 'POST',
      }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      processed: 10,
      totalGames: 10,
      isComplete: true,
      percent: 100,
      message: 'Steam sync is already completed',
    });

    createRouteHandlerClientMock.mockResolvedValue(
      makeRouteClient({
        jobData: { status: 'failed', error: null, user_id: 'user-1' },
      }),
    );
    createSupabaseAdminClientMock.mockReturnValue(makeAdminClient());
    res = await POST(
      new Request('http://localhost/api/integrations/steam/sync/process?jobId=failed', {
        method: 'POST',
      }),
    );
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Job failed' });
  });

  it('marks job completed when no batch items are left', async () => {
    const routeClient = makeRouteClient({
      jobData: {
        id: 'job-empty',
        user_id: 'user-1',
        status: 'running',
        steam_games: [game({ appid: 1 })],
        processed_count: 1,
        batch_size: 25,
      },
    });
    createRouteHandlerClientMock.mockResolvedValue(routeClient);
    createSupabaseAdminClientMock.mockReturnValue(makeAdminClient());

    const res = await POST(
      new Request('http://localhost/api/integrations/steam/sync/process?jobId=job-empty', {
        method: 'POST',
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      processed: 1,
      totalGames: 1,
      isComplete: true,
      percent: 100,
      message: 'Steam sync completed successfully',
    });
    expect(routeClient.spies.jobUpdate).toHaveBeenCalled();
  });

  it('processes a batch, inserts media/entries, completes job and returns rejected games', async () => {
    const games = [
      game({ appid: 101, name: 'Alpha', playtime_forever: 180 }),
      game({ appid: 202, name: 'No Match Game', playtime_forever: 0, achievementsPercent: 0 }),
    ];
    const routeClient = makeRouteClient({
      jobData: {
        id: 'job-run',
        user_id: 'user-1',
        status: 'running',
        steam_games: games,
        processed_count: 0,
        batch_size: 25,
        total_steps: 2,
      },
      existingEntryRows: [],
      userGameRows: [],
    });
    const adminClient = makeAdminClient({
      existingMediaRows: [],
      igdbRows: [],
      allGamesRows: [],
      bulkInsertRows: [{ id: 1111, steam_app_id: 101 }],
    });
    createRouteHandlerClientMock.mockResolvedValue(routeClient);
    createSupabaseAdminClientMock.mockReturnValue(adminClient);

    const matchMap = new Map<number, IgdbGame | null>([
      [101, { id: 9001, name: 'Alpha IGDB' }],
      [202, null],
    ]);
    const enrichedMap = new Map<number, IgdbGame | null>([
      [101, { id: 9001, name: 'Alpha IGDB Enriched' }],
      [202, null],
    ]);
    matchSteamGamesToIgdbMock.mockResolvedValue(matchMap);
    enrichIgdbMatchesMock.mockResolvedValue(enrichedMap);

    const res = await POST(
      new Request('http://localhost/api/integrations/steam/sync/process?jobId=job-run', {
        method: 'POST',
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      processed: 2,
      totalGames: 2,
      isComplete: true,
      percent: 100,
      message: 'Steam sync completed successfully',
      rejectedGames: [{ appid: 202, name: 'No Match Game', reason: 'Not found in IGDB database' }],
    });
    expect(adminClient.spies.mediaInsert).toHaveBeenCalled();
    expect(routeClient.spies.userEntriesUpsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          user_id: 'user-1',
          media_id: 1111,
          import_source: 'steam',
          selected_platform: 'PC',
        }),
      ]),
      { onConflict: 'user_id,media_id' },
    );
    expect(refreshGenreAffinityMock).toHaveBeenCalledWith(routeClient, 'user-1');
  });

  it('uses fallback insert path and updates existing steam-import entries', async () => {
    const games = [game({ appid: 555, name: 'Fallback Game', playtime_forever: 300 })];
    const routeClient = makeRouteClient({
      jobData: {
        id: 'job-fallback',
        user_id: 'user-1',
        status: 'running',
        steam_games: games,
        processed_count: 0,
        batch_size: 25,
      },
      existingEntryRows: [
        { media_id: 9999, import_source: 'steam', status: 'planned', updated_at: null },
      ],
      userGameRows: [],
    });
    const adminClient = makeAdminClient({
      existingMediaRows: [],
      allGamesRows: [],
      bulkInsertRows: [],
      bulkInsertError: { message: 'bulk fail' },
    });
    createRouteHandlerClientMock.mockResolvedValue(routeClient);
    createSupabaseAdminClientMock.mockReturnValue(adminClient);

    matchSteamGamesToIgdbMock.mockResolvedValue(
      new Map([[555, { id: 42, name: 'Fallback IGDB' }]]),
    );
    enrichIgdbMatchesMock.mockResolvedValue(new Map([[555, { id: 42, name: 'Fallback IGDB' }]]));
    adminClient.spies.singleInsertSingle.mockResolvedValueOnce({
      data: { id: 9999, steam_app_id: 555 },
    });

    const res = await POST(
      new Request('http://localhost/api/integrations/steam/sync/process?jobId=job-fallback', {
        method: 'POST',
      }),
    );

    expect(res.status).toBe(200);
    expect(mapWithConcurrencyMock).toHaveBeenCalled();
    expect(routeClient.spies.userEntriesUpsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          user_id: 'user-1',
          media_id: 9999,
          import_source: 'steam',
          selected_platform: 'PC',
        }),
      ]),
      { onConflict: 'user_id,media_id' },
    );
  });

  it('skips new entry creation when title already exists in user library', async () => {
    const games = [game({ appid: 707, name: 'Already Owned Title' })];
    const routeClient = makeRouteClient({
      jobData: {
        id: 'job-title',
        user_id: 'user-1',
        status: 'running',
        steam_games: games,
        processed_count: 0,
        batch_size: 25,
      },
      existingEntryRows: [],
      userGameRows: [
        { media_items: { title: 'already owned title', title_english: null, category: 'games' } },
      ],
    });
    const adminClient = makeAdminClient({
      existingMediaRows: [{ id: 7070, steam_app_id: 707, rawg_id: null, source: null }],
      allGamesRows: [],
    });
    createRouteHandlerClientMock.mockResolvedValue(routeClient);
    createSupabaseAdminClientMock.mockReturnValue(adminClient);

    matchSteamGamesToIgdbMock.mockResolvedValue(new Map([[707, null]]));
    enrichIgdbMatchesMock.mockResolvedValue(new Map([[707, null]]));

    const res = await POST(
      new Request('http://localhost/api/integrations/steam/sync/process?jobId=job-title', {
        method: 'POST',
      }),
    );

    expect(res.status).toBe(200);
    expect(routeClient.spies.userEntriesUpsert).not.toHaveBeenCalled();
  });

  it('handles already-enriched media, existing IGDB media, duplicate-by-title path, and partial progress', async () => {
    const games = [
      game({ appid: 1, name: 'Game One' }),
      game({ appid: 2, name: 'Game Two' }),
      game({ appid: 3, name: 'Duplicate Name' }),
    ];
    const routeClient = makeRouteClient({
      jobData: {
        id: 'job-complex',
        user_id: 'user-1',
        status: 'running',
        steam_games: [...games, game({ appid: 99 }), game({ appid: 100 })],
        processed_count: 0,
        batch_size: 3,
      },
      existingEntryRows: [
        { media_id: 1001, import_source: 'manual', status: 'done', updated_at: null },
      ],
      userGameRows: [
        { media_items: { title: null, title_english: 'English Only', category: 'games' } },
      ],
    });
    const adminClient = makeAdminClient({
      existingMediaRows: [{ id: 1001, steam_app_id: 1, rawg_id: 500, source: 'igdb' }],
      igdbRows: [{ id: 2600, rawg_id: 600 }],
      allGamesRows: [
        {
          id: 3333,
          title: 'Duplicate Name',
          title_english: 'Duplicate Name EN',
          steam_app_id: null,
          rawg_id: null,
          source: null,
        },
      ],
      bulkInsertRows: [],
    });
    createRouteHandlerClientMock.mockResolvedValue(routeClient);
    createSupabaseAdminClientMock.mockReturnValue(adminClient);

    matchSteamGamesToIgdbMock.mockResolvedValue(
      new Map([
        [1, { id: 500, name: 'IGDB One' }],
        [2, { id: 600, name: 'IGDB Two' }],
        [3, { id: 700, name: 'IGDB Three' }],
      ]),
    );
    enrichIgdbMatchesMock.mockResolvedValue(
      new Map([
        [2, { id: 600, name: 'IGDB Two Enriched' }],
        [3, { id: 700, name: 'IGDB Three Enriched' }],
      ]),
    );

    const res = await POST(
      new Request('http://localhost/api/integrations/steam/sync/process?jobId=job-complex', {
        method: 'POST',
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      processed: 3,
      totalGames: 5,
      isComplete: false,
      percent: 60,
      message: 'Processed 3 of 5 games',
      rejectedGames: undefined,
    });
    expect(adminClient.spies.mediaInsert).not.toHaveBeenCalled();
    expect(mapWithConcurrencyMock).toHaveBeenCalled();
    expect(routeClient.spies.userEntriesUpsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ media_id: 2600 }),
        expect.objectContaining({ media_id: 3333 }),
      ]),
      { onConflict: 'user_id,media_id' },
    );
    expect(refreshGenreAffinityMock).not.toHaveBeenCalled();
  });

  it('uses fallback Steam App name for rejected games and handles empty normalized title', async () => {
    const games = [game({ appid: 404, name: null }), game({ appid: 505, name: null })];
    const routeClient = makeRouteClient({
      jobData: {
        id: 'job-null-title',
        user_id: 'user-1',
        status: 'running',
        steam_games: games,
        processed_count: 0,
        batch_size: 25,
      },
      existingEntryRows: [],
      userGameRows: [],
    });
    const adminClient = makeAdminClient({
      existingMediaRows: [],
      allGamesRows: [],
      bulkInsertRows: [{ id: 5505, steam_app_id: 505 }],
    });
    createRouteHandlerClientMock.mockResolvedValue(routeClient);
    createSupabaseAdminClientMock.mockReturnValue(adminClient);

    matchSteamGamesToIgdbMock.mockResolvedValue(
      new Map([
        [404, null],
        [505, { id: 5050, name: null }],
      ]),
    );
    enrichIgdbMatchesMock.mockResolvedValue(
      new Map([
        [404, null],
        [505, { id: 5050, name: null }],
      ]),
    );

    const res = await POST(
      new Request('http://localhost/api/integrations/steam/sync/process?jobId=job-null-title', {
        method: 'POST',
      }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      processed: 2,
      totalGames: 2,
      isComplete: true,
      percent: 100,
      message: 'Steam sync completed successfully',
      rejectedGames: [{ appid: 404, name: 'Steam App 404', reason: 'Not found in IGDB database' }],
    });
  });

  it('returns default error message when a non-Error is thrown', async () => {
    createRouteHandlerClientMock.mockRejectedValueOnce('non-error-throw');

    const res = await POST(
      new Request('http://localhost/api/integrations/steam/sync/process?jobId=job-crash', {
        method: 'POST',
      }),
    );

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Failed to process batch' });
  });

  it('covers nullish DB payload fallbacks and existing-by-app matched IGDB metadata update', async () => {
    const routeClient = makeRouteClient({
      jobData: {
        id: 'job-nullish',
        user_id: 'user-1',
        status: 'running',
        steam_games: [game({ appid: 808, name: 'Nullish Branches' })],
        processed_count: 0,
      },
      existingEntryRows: null,
      userGameRows: null,
    });
    const adminClient = makeAdminClient({
      existingMediaRows: [{ id: 8080, steam_app_id: 808, rawg_id: 1, source: null }],
      igdbRows: null,
      allGamesRows: null,
      bulkInsertRows: null,
    });
    createRouteHandlerClientMock.mockResolvedValue(routeClient);
    createSupabaseAdminClientMock.mockReturnValue(adminClient);
    getSteamHoursMock.mockReturnValue(null);

    matchSteamGamesToIgdbMock.mockResolvedValue(
      new Map([[808, { id: 9090, name: 'Matched IGDB' }]]),
    );
    enrichIgdbMatchesMock.mockResolvedValue(new Map([[808, { id: 9090, name: 'Matched IGDB' }]]));

    const res = await POST(
      new Request('http://localhost/api/integrations/steam/sync/process?jobId=job-nullish', {
        method: 'POST',
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      processed: 1,
      totalGames: 1,
      isComplete: true,
      percent: 100,
      message: 'Steam sync completed successfully',
      rejectedGames: undefined,
    });
    expect(buildGameMetadataPatchMock).toHaveBeenCalled();
    expect(routeClient.spies.userEntriesUpsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          media_id: 8080,
          progress: 0,
          import_source: 'steam',
        }),
      ]),
      { onConflict: 'user_id,media_id' },
    );
  });

  it('covers default fallbacks for completed and running job fields, plus Error-message catch path', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeRouteClient({
        jobData: { status: 'completed', processed_count: 0, total_steps: 0, user_id: 'user-1' },
      }),
    );
    createSupabaseAdminClientMock.mockReturnValue(makeAdminClient());
    let res = await POST(
      new Request(
        'http://localhost/api/integrations/steam/sync/process?jobId=job-completed-fallbacks',
        {
          method: 'POST',
        },
      ),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      processed: 0,
      totalGames: 0,
      isComplete: true,
      percent: 100,
      message: 'Steam sync is already completed',
    });

    const runningClient = makeRouteClient({
      jobData: {
        id: 'job-running-fallbacks',
        user_id: 'user-1',
        status: 'running',
        steam_games: undefined,
        processed_count: 0,
        batch_size: undefined,
      },
    });
    createRouteHandlerClientMock.mockResolvedValue(runningClient);
    createSupabaseAdminClientMock.mockReturnValue(makeAdminClient());
    res = await POST(
      new Request(
        'http://localhost/api/integrations/steam/sync/process?jobId=job-running-fallbacks',
        {
          method: 'POST',
        },
      ),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      processed: 0,
      totalGames: 0,
      isComplete: true,
      percent: 100,
      message: 'Steam sync completed successfully',
    });

    matchSteamGamesToIgdbMock.mockRejectedValueOnce(new Error('explicit boom'));
    createRouteHandlerClientMock.mockResolvedValue(
      makeRouteClient({
        jobData: {
          id: 'job-error-path',
          user_id: 'user-1',
          status: 'running',
          steam_games: [game({ appid: 1001 })],
          processed_count: 0,
          batch_size: 25,
        },
      }),
    );
    createSupabaseAdminClientMock.mockReturnValue(makeAdminClient());
    res = await POST(
      new Request('http://localhost/api/integrations/steam/sync/process?jobId=job-error-path', {
        method: 'POST',
      }),
    );
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'explicit boom' });
  });
});
