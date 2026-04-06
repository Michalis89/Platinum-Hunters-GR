/**
 * @jest-environment node
 */

import 'whatwg-fetch';

const createRouteHandlerClientMock = jest.fn();
const requireAuthMock = jest.fn();
const randomUUIDMock = jest.fn();
const fetchSteamOwnedGamesMock = jest.fn();
const fetchSteamAchievementsMock = jest.fn();
const getSteamApiKeyMock = jest.fn();
const resolveSteamId64Mock = jest.fn();

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

jest.mock('@/lib/api/auth', () => ({
  __esModule: true,
  requireAuth: (...args: unknown[]) => requireAuthMock(...args),
  UnauthorizedError: class UnauthorizedError extends Error {},
}));

jest.mock('crypto', () => ({
  __esModule: true,
  randomUUID: (...args: unknown[]) => randomUUIDMock(...args),
}));

jest.mock('@/lib/integrations/steam', () => ({
  __esModule: true,
  fetchSteamOwnedGames: (...args: unknown[]) => fetchSteamOwnedGamesMock(...args),
  fetchSteamAchievements: (...args: unknown[]) => fetchSteamAchievementsMock(...args),
  getSteamApiKey: (...args: unknown[]) => getSteamApiKeyMock(...args),
  resolveSteamId64: (...args: unknown[]) => resolveSteamId64Mock(...args),
}));

import { POST } from '@/app/api/integrations/steam/sync/start/route';
import { UnauthorizedError } from '@/lib/api/auth';
import type { SteamOwnedGame } from '@/lib/integrations/steam';

type QueryError = { message?: string; code?: string } | null;

type SupabaseConfig = {
  categoryData?: unknown;
  categoryError?: QueryError;
  insertError?: QueryError;
};

function makeSupabase(config: SupabaseConfig = {}) {
  const categoryData = config.categoryData ?? { profiles: { games: { steam_id: 'my-steam' } } };
  const categoryError = config.categoryError ?? null;
  const insertError = config.insertError ?? null;

  const categoryMaybeSingle = jest
    .fn()
    .mockResolvedValue({ data: categoryData, error: categoryError });
  const categoryEq = jest.fn().mockReturnValue({ maybeSingle: categoryMaybeSingle });
  const categorySelect = jest.fn().mockReturnValue({ eq: categoryEq });

  const jobsInsert = jest.fn().mockResolvedValue({ error: insertError });

  const from = jest.fn((table: string) => {
    if (table === 'user_category_profiles') {
      return { select: categorySelect };
    }
    if (table === 'steam_sync_jobs') {
      return { insert: jobsInsert };
    }
    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    from,
    spies: {
      categoryMaybeSingle,
      jobsInsert,
    },
  };
}

function makeGame(overrides?: Partial<SteamOwnedGame>): SteamOwnedGame {
  return {
    appid: 10,
    name: 'Game 10',
    has_community_visible_stats: false,
    playtime_forever: 120,
    rtime_last_played: 1700000000,
    ...overrides,
  };
}

describe('app/api/integrations/steam/sync/start/route', () => {
  beforeEach(() => {
    createRouteHandlerClientMock.mockReset();
    requireAuthMock.mockReset();
    randomUUIDMock.mockReset();
    fetchSteamOwnedGamesMock.mockReset();
    fetchSteamAchievementsMock.mockReset();
    getSteamApiKeyMock.mockReset();
    resolveSteamId64Mock.mockReset();

    requireAuthMock.mockResolvedValue({ user: { id: 'user-1' } });
    randomUUIDMock.mockReturnValue('job-uuid-1');
    getSteamApiKeyMock.mockReturnValue('steam-key');
    resolveSteamId64Mock.mockResolvedValue('7656119');
    fetchSteamOwnedGamesMock.mockResolvedValue([]);
    fetchSteamAchievementsMock.mockResolvedValue({ percent: 0 });
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 401 when auth fails with UnauthorizedError', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabase());
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError('unauthorized'));

    const res = await POST();
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns category profile query error message', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({ categoryError: { message: 'profile query failed' } }),
    );

    const res = await POST();
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'profile query failed' });
  });

  it('uses fallback category profile error message when message is missing', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({ categoryError: { code: 'PGRST' } }),
    );

    const res = await POST();
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Failed to fetch category profile' });
  });

  it('returns error when steam id is not configured', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({ categoryData: { profiles: { games: { steam_id: '   ' } } } }),
    );

    const res = await POST();
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      error: 'You have not set a Steam ID in your profile. Go to settings to add it.',
    });
  });

  it('handles non-string steam_id values from profile as missing input', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({ categoryData: { profiles: { games: { steam_id: 12345 } } } }),
    );

    const res = await POST();
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      error: 'You have not set a Steam ID in your profile. Go to settings to add it.',
    });
  });

  it('returns empty result when no valid unique games are found', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabase());
    fetchSteamOwnedGamesMock.mockResolvedValueOnce([
      makeGame({ appid: 0, name: 'Nope' }),
      makeGame({ appid: 12, name: '' }),
      makeGame({ appid: 12, name: '' }),
    ]);

    const res = await POST();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      jobId: null,
      totalGames: 0,
      message: 'No games were found in the Steam library.',
    });
  });

  it('creates job for small libraries (batch 25) and enriches achievements', async () => {
    const supabase = makeSupabase();
    createRouteHandlerClientMock.mockResolvedValue(supabase);
    fetchSteamOwnedGamesMock.mockResolvedValueOnce([
      makeGame({ appid: 1, name: 'Alpha', has_community_visible_stats: true }),
      makeGame({ appid: 1, name: 'Alpha duplicate', has_community_visible_stats: true }),
      makeGame({ appid: 2, name: 'Beta', has_community_visible_stats: true }),
      makeGame({ appid: 3, name: 'Gamma', has_community_visible_stats: false }),
    ]);
    fetchSteamAchievementsMock.mockImplementation(async ({ appid }: { appid: number }) => {
      if (appid === 1) {
        return { percent: 10 };
      }
      return { percent: 0 };
    });

    const res = await POST();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      jobId: 'job-uuid-1',
      totalGames: 3,
      batchSize: 25,
      estimatedBatches: 1,
      message: '3 games found. Ready for processing.',
    });

    const insertPayload = supabase.spies.jobsInsert.mock.calls[0][0];
    expect(insertPayload.batch_size).toBe(25);
    expect(insertPayload.total_steps).toBe(3);
    expect(insertPayload.steam_games).toHaveLength(3);
    expect(insertPayload.steam_games[0]).toEqual(
      expect.objectContaining({
        appid: 1,
        achievementsPercent: 10,
      }),
    );
    expect(insertPayload.steam_games[1]).toEqual(
      expect.objectContaining({
        appid: 2,
        achievementsPercent: undefined,
      }),
    );
    expect(fetchSteamAchievementsMock).toHaveBeenCalledTimes(2);
  });

  it('creates job for medium libraries (batch 40)', async () => {
    const supabase = makeSupabase();
    createRouteHandlerClientMock.mockResolvedValue(supabase);
    fetchSteamOwnedGamesMock.mockResolvedValueOnce(
      Array.from({ length: 120 }, (_, i) => makeGame({ appid: i + 1, name: `Game ${i + 1}` })),
    );

    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.batchSize).toBe(40);
    expect(body.estimatedBatches).toBe(3);
    expect(supabase.spies.jobsInsert.mock.calls[0][0].batch_size).toBe(40);
  });

  it('creates job for large libraries (batch 50)', async () => {
    const supabase = makeSupabase();
    createRouteHandlerClientMock.mockResolvedValue(supabase);
    fetchSteamOwnedGamesMock.mockResolvedValueOnce(
      Array.from({ length: 500 }, (_, i) => makeGame({ appid: i + 1, name: `Game ${i + 1}` })),
    );

    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.batchSize).toBe(50);
    expect(body.estimatedBatches).toBe(10);
    expect(supabase.spies.jobsInsert.mock.calls[0][0].batch_size).toBe(50);
  });

  it('returns 500 when job insert fails', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({ insertError: { message: 'insert failed' } }),
    );
    fetchSteamOwnedGamesMock.mockResolvedValueOnce([makeGame({ appid: 999, name: 'One' })]);

    const res = await POST();
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Failed to create sync job' });
  });

  it('extracts error message from non-Error objects with message', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabase());
    resolveSteamId64Mock.mockRejectedValueOnce({ message: 'custom object error' });

    const res = await POST();
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'custom object error' });
  });

  it('uses default error message for unknown thrown values', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabase());
    resolveSteamId64Mock.mockRejectedValueOnce({ bad: 'shape' });

    const res = await POST();
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Failed to start Steam sync' });
  });
});
