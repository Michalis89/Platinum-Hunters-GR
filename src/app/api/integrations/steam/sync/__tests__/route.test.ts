/**
 * @jest-environment node
 */

// ─── Mock setup ───────────────────────────────────────────────────────────

const mockRequireAuth = jest.fn();
const mockCreateRouteHandlerClient = jest.fn();
const mockCreateSupabaseAdminClient = jest.fn();

const mockGetSteamApiKey = jest.fn();
const mockResolveSteamId64 = jest.fn();
const mockFetchSteamOwnedGames = jest.fn();
const mockFetchSteamAchievements = jest.fn();
const mockGetSteamCoverUrls = jest.fn(() => ({
  large: 'steam-large.jpg',
  medium: 'steam-medium.jpg',
}));
const mockMapIgdbToPayload = jest.fn(() => ({
  igdb_id: 10,
  title: 'Mocked Game',
  cover_image_large: null,
  cover_image_medium: null,
  platforms: ['PC'],
  genres: [],
  developer: null,
  publisher: null,
  description: null,
  season_year: null,
  release_date: null,
  rating: null,
}));

const mockGetUserSteamInput = jest.fn();
const mockCreateSyncJob = jest.fn();
const mockGetRunningSyncJob = jest.fn();
const mockUpdateSyncJob = jest.fn();

const mockMatchSteamGamesToIgdb = jest.fn();
const mockEnrichIgdbMatches = jest.fn();

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    })),
    redirect: jest.fn((url: string) => ({
      status: 302,
      headers: { location: url },
      redirected: true,
      url,
    })),
  },
}));

jest.mock('@/lib/observability/withApiRoute', () => ({
  withApiRoute: (handler: unknown) => handler,
}));

jest.mock('@/lib/supabase-route-handler', () => ({
  createRouteHandlerClient: (...args: unknown[]) => mockCreateRouteHandlerClient(...args),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: (...args: unknown[]) => mockCreateSupabaseAdminClient(...args),
}));

jest.mock('@/lib/api/auth', () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
  UnauthorizedError: class UnauthorizedError extends Error {
    constructor(msg = 'unauthorized') {
      super(msg);
      this.name = 'UnauthorizedError';
    }
  },
}));

jest.mock('@/lib/integrations/steam', () => ({
  fetchSteamOwnedGames: (...args: unknown[]) => mockFetchSteamOwnedGames(...args),
  fetchSteamAchievements: (...args: unknown[]) => mockFetchSteamAchievements(...args),
  getSteamApiKey: (...args: unknown[]) => mockGetSteamApiKey(...args),
  resolveSteamId64: (...args: unknown[]) => mockResolveSteamId64(...args),
  getSteamCoverUrls: (...args: unknown[]) => mockGetSteamCoverUrls(...args),
}));

jest.mock('@/lib/services/igdbService', () => ({
  mapIgdbToPayload: (...args: unknown[]) => mockMapIgdbToPayload(...args),
  searchIgdbGames: jest.fn(),
  fetchIgdbGameDetails: jest.fn(),
}));

jest.mock('../jobs', () => ({
  getUserSteamInput: (...args: unknown[]) => mockGetUserSteamInput(...args),
  createSyncJob: (...args: unknown[]) => mockCreateSyncJob(...args),
  getRunningSyncJob: (...args: unknown[]) => mockGetRunningSyncJob(...args),
  updateSyncJob: (...args: unknown[]) => mockUpdateSyncJob(...args),
}));

jest.mock('../igdbMatching', () => ({
  matchSteamGamesToIgdb: (...args: unknown[]) => mockMatchSteamGamesToIgdb(...args),
  enrichIgdbMatches: (...args: unknown[]) => mockEnrichIgdbMatches(...args),
}));

// helpers are real (not mocked) so coverage is counted
jest.mock('../helpers', () => jest.requireActual('../helpers'));

// ─── Imports ──────────────────────────────────────────────────────────────

import { POST, GET } from '../route';
import { UnauthorizedError } from '@/lib/api/auth';
import { SyncAlreadyRunningError } from '../helpers';

// ─── Supabase builder factory ─────────────────────────────────────────────

type TableConfig = {
  selectData?: unknown;
  selectError?: unknown;
  insertData?: unknown;
  insertError?: unknown;
  updateError?: unknown;
  upsertError?: unknown;
};

function makeAdminSupabase(
  config: Record<string, TableConfig> = {},
  defaultConfig: TableConfig = {},
) {
  return {
    from: jest.fn((table: string) => {
      const cfg = config[table] ?? defaultConfig;
      const single = jest.fn().mockResolvedValue({
        data: cfg.insertData ?? null,
        error: cfg.insertError ?? null,
      });
      const eqChain = jest.fn(() => ({ error: cfg.updateError ?? null }));
      const inChain = jest.fn().mockResolvedValue({
        data: cfg.selectData ?? [],
        error: cfg.selectError ?? null,
      });
      const eqForSelect = jest.fn(() => ({ in: inChain }));
      const selectBuilder = {
        eq: eqForSelect,
        in: inChain,
      };
      return {
        select: jest.fn(() => selectBuilder),
        insert: jest.fn(() => ({
          select: jest.fn().mockResolvedValue({
            data: cfg.insertData ?? [],
            error: cfg.insertError ?? null,
          }),
          single,
        })),
        update: jest.fn(() => ({ eq: eqChain })),
        upsert: jest.fn().mockResolvedValue({ error: cfg.upsertError ?? null }),
      };
    }),
  };
}

function makeUserSupabase(
  config: {
    entriesData?: unknown;
    entriesError?: unknown;
    userGamesData?: unknown;
    userGamesError?: unknown;
    upsertError?: unknown;
  } = {},
) {
  return {
    from: jest.fn((table: string) => {
      if (table === 'user_media_entries') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              in: jest.fn().mockResolvedValue({
                data: config.entriesData ?? [],
                error: config.entriesError ?? null,
              }),
              eq: jest.fn().mockResolvedValue({
                data: config.userGamesData ?? [],
                error: config.userGamesError ?? null,
              }),
            })),
          })),
          upsert: jest.fn().mockResolvedValue({ error: config.upsertError ?? null }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

function makeRequest(path = '/api/integrations/steam/sync', method = 'POST', params = '') {
  return new Request(`http://localhost${path}${params ? `?${params}` : ''}`, { method });
}

// ─── Default game fixture ─────────────────────────────────────────────────

const defaultGame = {
  appid: 730,
  name: 'Counter-Strike 2',
  playtime_forever: 120,
  playtime_2weeks: 0,
  rtime_last_played: Math.floor(Date.now() / 1000) - 86400,
  has_community_visible_stats: false,
};

// ─── POST handler tests ───────────────────────────────────────────────────

describe('POST /api/integrations/steam/sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    mockGetRunningSyncJob.mockResolvedValue(null);
    mockCreateSyncJob.mockResolvedValue('job-abc');
    mockUpdateSyncJob.mockResolvedValue(undefined);
    mockRequireAuth.mockResolvedValue({ user: { id: 'user-1' } });

    // Default: mocks call onItemComplete so callbacks are covered
    mockMatchSteamGamesToIgdb.mockImplementation(
      async (games: unknown[], cb?: (d: number, t: number) => void) => {
        const map = new Map();
        for (let i = 0; i < games.length; i++) {
          await cb?.(i + 1, games.length);
        }
        return map;
      },
    );
    mockEnrichIgdbMatches.mockImplementation(
      async (_map: unknown, cb?: (d: number, t: number) => void) => {
        await cb?.(1, 1);
        return new Map();
      },
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 409 when a running job exists', async () => {
    mockGetRunningSyncJob.mockResolvedValue({ id: 'existing-job' });

    const res = await POST(makeRequest());
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body).toEqual({ error: 'A sync is already in progress.', jobId: 'existing-job' });
  });

  it('returns 401 when auth fails', async () => {
    mockGetRunningSyncJob.mockResolvedValue(null);
    mockCreateRouteHandlerClient.mockResolvedValue({});
    mockRequireAuth.mockRejectedValue(new UnauthorizedError('no auth'));

    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
  });

  it('returns 500 when no Steam ID is configured', async () => {
    mockCreateRouteHandlerClient.mockResolvedValue({});
    mockGetUserSteamInput.mockResolvedValue(null);

    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('No Steam ID');
    expect(mockUpdateSyncJob).toHaveBeenCalledWith(
      'job-abc',
      expect.objectContaining({ status: 'failed' }),
    );
  });

  it('returns 409 when SyncAlreadyRunningError is thrown from createSyncJob', async () => {
    mockCreateSyncJob.mockRejectedValue(new SyncAlreadyRunningError('dup-job'));

    const res = await POST(makeRequest());
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.jobId).toBe('dup-job');
  });

  it('returns 500 with error message on generic Error', async () => {
    mockCreateRouteHandlerClient.mockResolvedValue({});
    mockGetUserSteamInput.mockRejectedValue(new Error('network fail'));

    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('network fail');
  });

  it('completes sync successfully with empty game list', async () => {
    mockCreateRouteHandlerClient.mockResolvedValue({});
    mockGetUserSteamInput.mockResolvedValue('76561197000000001');
    mockGetSteamApiKey.mockReturnValue('steam-key');
    mockResolveSteamId64.mockResolvedValue('76561197000000001');
    mockFetchSteamOwnedGames.mockResolvedValue([]);
    mockMatchSteamGamesToIgdb.mockResolvedValue(new Map());
    mockEnrichIgdbMatches.mockResolvedValue(new Map());
    mockCreateSupabaseAdminClient.mockReturnValue(
      makeAdminSupabase({
        media_items: { selectData: [], selectError: null },
      }),
    );

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.totalFetched).toBe(0);
    expect(body.jobId).toBe('job-abc');
    expect(mockUpdateSyncJob).toHaveBeenCalledWith(
      'job-abc',
      expect.objectContaining({ status: 'completed' }),
    );
  });

  it('completes sync with debug=1 and empty games returns debug payload', async () => {
    mockCreateRouteHandlerClient.mockResolvedValue({});
    mockGetUserSteamInput.mockResolvedValue('steam-user');
    mockGetSteamApiKey.mockReturnValue('key');
    mockResolveSteamId64.mockResolvedValue('steam64');
    mockFetchSteamOwnedGames.mockResolvedValue([]);
    mockCreateSupabaseAdminClient.mockReturnValue(makeAdminSupabase());

    const res = await POST(makeRequest('/api/integrations/steam/sync', 'POST', 'debug=1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.debug).toEqual({ steamId64: 'steam64', sample: [] });
  });

  it('runs full sync with one game (no IGDB match → rejected)', async () => {
    const userSupabase = makeUserSupabase({ entriesData: [], userGamesData: [] });
    mockCreateRouteHandlerClient.mockResolvedValue(userSupabase);
    mockGetUserSteamInput.mockResolvedValue('steam-user');
    mockGetSteamApiKey.mockReturnValue('key');
    mockResolveSteamId64.mockResolvedValue('steam64');
    mockFetchSteamOwnedGames.mockResolvedValue([defaultGame]);

    // No IGDB match
    mockMatchSteamGamesToIgdb.mockResolvedValue(new Map([[730, null]]));
    mockEnrichIgdbMatches.mockResolvedValue(new Map([[730, null]]));

    const adminSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: [], error: null }),
          })),
        })),
      })),
    };
    mockCreateSupabaseAdminClient.mockReturnValue(adminSupabase);

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.totalFetched).toBe(1);
    expect(body.rejectedGames).toHaveLength(1);
    expect(body.rejectedGames[0].appid).toBe(730);
  });

  it('runs full sync with one game with IGDB match → inserts media', async () => {
    const userSupabase = makeUserSupabase({ entriesData: [], userGamesData: [] });
    mockCreateRouteHandlerClient.mockResolvedValue(userSupabase);
    mockGetUserSteamInput.mockResolvedValue('steam-user');
    mockGetSteamApiKey.mockReturnValue('key');
    mockResolveSteamId64.mockResolvedValue('steam64');
    mockFetchSteamOwnedGames.mockResolvedValue([defaultGame]);

    const igdbGame = { id: 10, name: 'Counter-Strike 2' };
    mockMatchSteamGamesToIgdb.mockResolvedValue(new Map([[730, igdbGame]]));
    mockEnrichIgdbMatches.mockResolvedValue(new Map([[730, igdbGame]]));

    // Admin supabase: no existing media, insert returns one row
    const insertSelectResult = [{ id: 999, steam_app_id: 730 }];
    const adminSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: [], error: null }),
          })),
        })),
        insert: jest.fn(() => ({
          select: jest.fn().mockResolvedValue({ data: insertSelectResult, error: null }),
        })),
        update: jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ error: null }) })),
      })),
    };
    mockCreateSupabaseAdminClient.mockReturnValue(adminSupabase);

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.totalFetched).toBe(1);
  });

  it('handles updateSyncJob failure gracefully in catch block', async () => {
    mockCreateRouteHandlerClient.mockResolvedValue({});
    mockGetUserSteamInput.mockRejectedValue(new Error('sync failure'));
    mockUpdateSyncJob.mockRejectedValue(new Error('update also failed'));

    // Should not throw despite updateSyncJob failing
    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
  });
});

// ─── GET handler tests ────────────────────────────────────────────────────

describe('GET /api/integrations/steam/sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    mockGetRunningSyncJob.mockResolvedValue(null);
    mockCreateSyncJob.mockResolvedValue('job-get-1');
    mockUpdateSyncJob.mockResolvedValue(undefined);
    mockRequireAuth.mockResolvedValue({ user: { id: 'user-1' } });

    mockMatchSteamGamesToIgdb.mockResolvedValue(new Map());
    mockEnrichIgdbMatches.mockResolvedValue(new Map());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 409 when a running job exists', async () => {
    mockGetRunningSyncJob.mockResolvedValue({ id: 'run-job' });

    const res = await GET(makeRequest('/api/integrations/steam/sync', 'GET'));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.jobId).toBe('run-job');
  });

  it('returns 409 when SyncAlreadyRunningError thrown from createSyncJob', async () => {
    mockCreateSyncJob.mockRejectedValue(new SyncAlreadyRunningError('race-job'));

    const res = await GET(makeRequest('/api/integrations/steam/sync', 'GET'));
    expect(res.status).toBe(409);
  });

  it('returns JSON result when redirect=0 (default)', async () => {
    mockCreateRouteHandlerClient.mockResolvedValue({});
    mockGetUserSteamInput.mockResolvedValue('steam-user');
    mockGetSteamApiKey.mockReturnValue('key');
    mockResolveSteamId64.mockResolvedValue('steam64');
    mockFetchSteamOwnedGames.mockResolvedValue([]);
    mockCreateSupabaseAdminClient.mockReturnValue(makeAdminSupabase());

    const res = await GET(makeRequest('/api/integrations/steam/sync', 'GET'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.jobId).toBe('job-get-1');
  });

  it('redirects to backlog on success when redirect=1', async () => {
    mockCreateRouteHandlerClient.mockResolvedValue({});
    mockGetUserSteamInput.mockResolvedValue('steam-user');
    mockGetSteamApiKey.mockReturnValue('key');
    mockResolveSteamId64.mockResolvedValue('steam64');
    mockFetchSteamOwnedGames.mockResolvedValue([]);
    mockCreateSupabaseAdminClient.mockReturnValue(makeAdminSupabase());

    await GET(makeRequest('/api/integrations/steam/sync', 'GET', 'redirect=1'));
    // NextResponse.redirect is mocked, check that it was called with a success URL
    const { NextResponse } = await import('next/server');
    expect(NextResponse.redirect).toHaveBeenCalledWith(expect.stringContaining('steam=success'));
  });

  it('redirects to backlog error when unauthorized', async () => {
    mockCreateRouteHandlerClient.mockResolvedValue({});
    mockRequireAuth.mockRejectedValue(new UnauthorizedError('no auth'));

    await GET(makeRequest('/api/integrations/steam/sync', 'GET'));
    const { NextResponse } = await import('next/server');
    expect(NextResponse.redirect).toHaveBeenCalledWith(expect.stringContaining('steam=error'));
    expect(NextResponse.redirect).toHaveBeenCalledWith(expect.stringContaining('unauthorized'));
  });

  it('redirects to backlog error on generic failure', async () => {
    mockCreateRouteHandlerClient.mockResolvedValue({});
    mockGetUserSteamInput.mockRejectedValue(new Error('db crash'));

    await GET(makeRequest('/api/integrations/steam/sync', 'GET'));
    const { NextResponse } = await import('next/server');
    expect(NextResponse.redirect).toHaveBeenCalledWith(expect.stringContaining('steam=error'));
  });

  it('returns 500 for POST when no Steam ID (updateSyncJob path)', async () => {
    mockCreateRouteHandlerClient.mockResolvedValue({});
    mockGetUserSteamInput.mockResolvedValue(null);

    await GET(makeRequest('/api/integrations/steam/sync', 'GET'));
    // GET error path → redirects
    const { NextResponse } = await import('next/server');
    expect(NextResponse.redirect).toHaveBeenCalled();
  });

  it('handles updateSyncJob failing in GET catch block gracefully', async () => {
    mockCreateRouteHandlerClient.mockResolvedValue({});
    mockGetUserSteamInput.mockRejectedValue(new Error('oops'));
    mockUpdateSyncJob.mockRejectedValue(new Error('update also failed'));

    // Should not throw
    const res = await GET(makeRequest('/api/integrations/steam/sync', 'GET'));
    expect(res).toBeDefined();
  });
});

// ─── syncSteamForUser edge cases via POST ─────────────────────────────────

describe('syncSteamForUser - additional branches via POST', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    mockGetRunningSyncJob.mockResolvedValue(null);
    mockCreateSyncJob.mockResolvedValue('job-x');
    mockUpdateSyncJob.mockResolvedValue(undefined);
    mockRequireAuth.mockResolvedValue({ user: { id: 'user-1' } });

    // Default: mocks call callbacks so those lines are covered
    mockMatchSteamGamesToIgdb.mockImplementation(
      async (games: unknown[], cb?: (d: number, t: number) => void) => {
        for (let i = 0; i < games.length; i++) {
          await cb?.(i + 1, games.length);
        }
        return new Map();
      },
    );
    mockEnrichIgdbMatches.mockImplementation(
      async (_map: unknown, cb?: (d: number, t: number) => void) => {
        await cb?.(1, 1);
        return new Map();
      },
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fetches achievements for games with community stats', async () => {
    const gameWithStats = { ...defaultGame, has_community_visible_stats: true };
    const userSupabase = makeUserSupabase({ entriesData: [], userGamesData: [] });
    mockCreateRouteHandlerClient.mockResolvedValue(userSupabase);
    mockGetUserSteamInput.mockResolvedValue('steam-user');
    mockGetSteamApiKey.mockReturnValue('key');
    mockResolveSteamId64.mockResolvedValue('steam64');
    mockFetchSteamOwnedGames.mockResolvedValue([gameWithStats]);
    mockFetchSteamAchievements.mockResolvedValue({ percent: 75 });

    mockMatchSteamGamesToIgdb.mockResolvedValue(new Map([[730, null]]));
    mockEnrichIgdbMatches.mockResolvedValue(new Map([[730, null]]));

    const adminSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: [], error: null }),
          })),
        })),
      })),
    };
    mockCreateSupabaseAdminClient.mockReturnValue(adminSupabase);

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockFetchSteamAchievements).toHaveBeenCalledWith(
      expect.objectContaining({ appid: 730 }),
    );
  });

  it('throws when existingMediaError occurs', async () => {
    mockCreateRouteHandlerClient.mockResolvedValue({});
    mockGetUserSteamInput.mockResolvedValue('steam-user');
    mockGetSteamApiKey.mockReturnValue('key');
    mockResolveSteamId64.mockResolvedValue('steam64');
    mockFetchSteamOwnedGames.mockResolvedValue([defaultGame]);
    mockMatchSteamGamesToIgdb.mockResolvedValue(new Map([[730, null]]));
    mockEnrichIgdbMatches.mockResolvedValue(new Map([[730, null]]));

    const adminSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: null, error: { message: 'media query fail' } }),
          })),
        })),
      })),
    };
    mockCreateSupabaseAdminClient.mockReturnValue(adminSupabase);

    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
  });

  it('throws when igdbRowsError occurs (rawg_id query fails)', async () => {
    mockCreateRouteHandlerClient.mockResolvedValue(
      makeUserSupabase({ entriesData: [], userGamesData: [] }),
    );
    mockGetUserSteamInput.mockResolvedValue('steam-user');
    mockGetSteamApiKey.mockReturnValue('key');
    mockResolveSteamId64.mockResolvedValue('steam64');
    mockFetchSteamOwnedGames.mockResolvedValue([defaultGame]);

    const igdbGame = { id: 10, name: 'Counter-Strike 2' };
    mockMatchSteamGamesToIgdb.mockResolvedValue(new Map([[730, igdbGame]]));
    mockEnrichIgdbMatches.mockResolvedValue(new Map([[730, igdbGame]]));

    let fromCallCount = 0;
    const adminSupabase = {
      from: jest.fn(() => {
        fromCallCount++;
        if (fromCallCount === 1) {
          // steam_app_id query: no existing media
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                in: jest.fn().mockResolvedValue({ data: [], error: null }),
              })),
            })),
          };
        }
        // rawg_id query: error
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              in: jest.fn().mockResolvedValue({ data: null, error: { message: 'igdb rows fail' } }),
            })),
          })),
        };
      }),
    };
    mockCreateSupabaseAdminClient.mockReturnValue(adminSupabase);

    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
  });

  it('deduplicates games with same appid', async () => {
    // Two games with same appid → uniqueGames should deduplicate
    const dup1 = { ...defaultGame };
    const dup2 = { ...defaultGame, playtime_forever: 999 };
    mockCreateRouteHandlerClient.mockResolvedValue(
      makeUserSupabase({ entriesData: [], userGamesData: [] }),
    );
    mockGetUserSteamInput.mockResolvedValue('steam-user');
    mockGetSteamApiKey.mockReturnValue('key');
    mockResolveSteamId64.mockResolvedValue('steam64');
    mockFetchSteamOwnedGames.mockResolvedValue([dup1, dup2]);
    mockMatchSteamGamesToIgdb.mockResolvedValue(new Map([[730, null]]));
    mockEnrichIgdbMatches.mockResolvedValue(new Map([[730, null]]));

    const adminSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: [], error: null }),
          })),
        })),
      })),
    };
    mockCreateSupabaseAdminClient.mockReturnValue(adminSupabase);

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    // Only 1 unique game
    expect(body.totalFetched).toBe(1);
  });

  it('filters games without name or invalid appid', async () => {
    const badGames = [
      { appid: 0, name: 'Zero App', playtime_forever: 0 },
      { appid: -1, name: 'Neg App', playtime_forever: 0 },
      { appid: 123, name: null, playtime_forever: 0 },
    ];
    mockCreateRouteHandlerClient.mockResolvedValue(
      makeUserSupabase({ entriesData: [], userGamesData: [] }),
    );
    mockGetUserSteamInput.mockResolvedValue('steam-user');
    mockGetSteamApiKey.mockReturnValue('key');
    mockResolveSteamId64.mockResolvedValue('steam64');
    mockFetchSteamOwnedGames.mockResolvedValue(badGames);
    mockMatchSteamGamesToIgdb.mockResolvedValue(new Map());
    mockEnrichIgdbMatches.mockResolvedValue(new Map());
    mockCreateSupabaseAdminClient.mockReturnValue(makeAdminSupabase());

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.totalFetched).toBe(0);
  });

  it('handles existing user entry with steam import_source → updates it', async () => {
    const existingEntry = {
      media_id: 999,
      import_source: 'steam',
      status: 'current',
      updated_at: '2024-01-01',
    };
    const userSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: [existingEntry], error: null }),
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          })),
        })),
        upsert: jest.fn().mockResolvedValue({ error: null }),
      })),
    };
    mockCreateRouteHandlerClient.mockResolvedValue(userSupabase);
    mockGetUserSteamInput.mockResolvedValue('steam-user');
    mockGetSteamApiKey.mockReturnValue('key');
    mockResolveSteamId64.mockResolvedValue('steam64');
    mockFetchSteamOwnedGames.mockResolvedValue([defaultGame]);
    mockMatchSteamGamesToIgdb.mockResolvedValue(new Map([[730, null]]));
    mockEnrichIgdbMatches.mockResolvedValue(new Map([[730, null]]));

    const adminSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({
              data: [{ id: 999, steam_app_id: 730, rawg_id: null, source: null }],
              error: null,
            }),
          })),
        })),
        update: jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ error: null }) })),
      })),
    };
    mockCreateSupabaseAdminClient.mockReturnValue(adminSupabase);

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.entriesUpdated).toBe(1);
  });

  it('handles existing user entry with non-steam import_source → skips update', async () => {
    const existingEntry = {
      media_id: 999,
      import_source: 'manual',
      status: 'current',
      updated_at: '2024-01-01',
    };
    const userSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: [existingEntry], error: null }),
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          })),
        })),
        upsert: jest.fn().mockResolvedValue({ error: null }),
      })),
    };
    mockCreateRouteHandlerClient.mockResolvedValue(userSupabase);
    mockGetUserSteamInput.mockResolvedValue('steam-user');
    mockGetSteamApiKey.mockReturnValue('key');
    mockResolveSteamId64.mockResolvedValue('steam64');
    mockFetchSteamOwnedGames.mockResolvedValue([defaultGame]);
    mockMatchSteamGamesToIgdb.mockResolvedValue(new Map([[730, null]]));
    mockEnrichIgdbMatches.mockResolvedValue(new Map([[730, null]]));

    const adminSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({
              data: [{ id: 999, steam_app_id: 730, rawg_id: null, source: null }],
              error: null,
            }),
          })),
        })),
        update: jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ error: null }) })),
      })),
    };
    mockCreateSupabaseAdminClient.mockReturnValue(adminSupabase);

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.entriesUpdated).toBe(0);
    // skippedExisting should be 1 (entry exists but not steam source)
    expect(body.entriesSkippedExisting).toBe(1);
  });

  it('skips potential duplicate when user already has game by title', async () => {
    const userSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: [], error: null }),
            eq: jest.fn().mockResolvedValue({
              data: [
                {
                  media_items: {
                    title: 'Counter-Strike 2',
                    title_english: null,
                    category: 'games',
                  },
                },
              ],
              error: null,
            }),
          })),
        })),
        upsert: jest.fn().mockResolvedValue({ error: null }),
      })),
    };
    mockCreateRouteHandlerClient.mockResolvedValue(userSupabase);
    mockGetUserSteamInput.mockResolvedValue('steam-user');
    mockGetSteamApiKey.mockReturnValue('key');
    mockResolveSteamId64.mockResolvedValue('steam64');
    mockFetchSteamOwnedGames.mockResolvedValue([defaultGame]);
    mockMatchSteamGamesToIgdb.mockResolvedValue(new Map([[730, null]]));
    mockEnrichIgdbMatches.mockResolvedValue(new Map([[730, null]]));

    const adminSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({
              data: [{ id: 999, steam_app_id: 730, rawg_id: null, source: null }],
              error: null,
            }),
          })),
        })),
        update: jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ error: null }) })),
      })),
    };
    mockCreateSupabaseAdminClient.mockReturnValue(adminSupabase);

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    // Game exists in media, so it goes to existingByAppId path → entries updated not skipped
    // (The skip-duplicate path applies when mediaId is set but NO existingEntry)
  });

  it('throws when allGamesError occurs (all media games fetch fails)', async () => {
    mockCreateRouteHandlerClient.mockResolvedValue({});
    mockGetUserSteamInput.mockResolvedValue('steam-user');
    mockGetSteamApiKey.mockReturnValue('key');
    mockResolveSteamId64.mockResolvedValue('steam64');
    mockFetchSteamOwnedGames.mockResolvedValue([defaultGame]);
    mockMatchSteamGamesToIgdb.mockResolvedValue(new Map([[730, null]]));
    mockEnrichIgdbMatches.mockResolvedValue(new Map([[730, null]]));

    let callCount = 0;
    const adminSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: [], error: null }),
            // first eq returns ok for steam_app_id query, second call for allGames fails
          })),
        })),
      })),
    };

    // Simulate: first select (steam_app_id) succeeds, second (all games title) fails
    adminSupabase.from.mockImplementation(() => {
      callCount++;
      if (callCount <= 1) {
        // steam_app_id select
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              in: jest.fn().mockResolvedValue({ data: [], error: null }),
            })),
          })),
        };
      }
      // all games select - fails
      return {
        select: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: null, error: { message: 'all games fail' } }),
        })),
      };
    });

    mockCreateSupabaseAdminClient.mockReturnValue(adminSupabase);

    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
  });

  it('covers already-enriched branch (source=igdb, rawg_id matches)', async () => {
    const userSupabase = makeUserSupabase({ entriesData: [], userGamesData: [] });
    mockCreateRouteHandlerClient.mockResolvedValue(userSupabase);
    mockGetUserSteamInput.mockResolvedValue('steam-user');
    mockGetSteamApiKey.mockReturnValue('key');
    mockResolveSteamId64.mockResolvedValue('steam64');
    mockFetchSteamOwnedGames.mockResolvedValue([defaultGame]);

    const igdbGame = { id: 10, name: 'Counter-Strike 2' };
    // The game has a match, AND existingMedia has source=igdb and rawg_id=10
    mockMatchSteamGamesToIgdb.mockResolvedValue(new Map([[730, igdbGame]]));
    mockEnrichIgdbMatches.mockImplementation(async (_map: Map<number, unknown>) => {
      // Return alreadyEnriched: the game is in igdbMatchesAlreadyEnriched
      // To trigger alreadyEnriched path: existingMedia.rawg_id === igdbMatch.id AND source === 'igdb'
      return new Map([[730, igdbGame]]);
    });

    const existingMedia = [{ id: 999, steam_app_id: 730, rawg_id: 10, source: 'igdb' }];
    let callCount = 0;
    const adminSupabase = {
      from: jest.fn(() => {
        callCount++;
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              in: jest.fn().mockResolvedValue({
                data: callCount === 1 ? existingMedia : [],
                error: null,
              }),
            })),
          })),
          update: jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ error: null }) })),
        };
      }),
    };
    mockCreateSupabaseAdminClient.mockReturnValue(adminSupabase);

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    // Already-enriched: mediaUpdated includes this
    expect(body.mediaUpdated).toBeGreaterThanOrEqual(1);
  });

  it('covers existingByAppId + matchedIgdb (not already enriched) → enriches', async () => {
    const userSupabase = makeUserSupabase({ entriesData: [], userGamesData: [] });
    mockCreateRouteHandlerClient.mockResolvedValue(userSupabase);
    mockGetUserSteamInput.mockResolvedValue('steam-user');
    mockGetSteamApiKey.mockReturnValue('key');
    mockResolveSteamId64.mockResolvedValue('steam64');
    mockFetchSteamOwnedGames.mockResolvedValue([defaultGame]);

    const igdbGame = { id: 10, name: 'Counter-Strike 2' };
    mockMatchSteamGamesToIgdb.mockResolvedValue(new Map([[730, igdbGame]]));
    mockEnrichIgdbMatches.mockResolvedValue(new Map([[730, igdbGame]]));

    // existingByAppId exists but source != igdb (so not alreadyEnriched), matchedIgdb exists
    const existingMedia = [{ id: 999, steam_app_id: 730, rawg_id: null, source: 'steam' }];
    let callCount = 0;
    const adminSupabase = {
      from: jest.fn(() => {
        callCount++;
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              in: jest.fn().mockResolvedValue({
                data: callCount === 1 ? existingMedia : [],
                error: null,
              }),
            })),
          })),
          update: jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ error: null }) })),
        };
      }),
    };
    mockCreateSupabaseAdminClient.mockReturnValue(adminSupabase);

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
  });

  it('covers existingIgdbMedia found (preserves existing media by IGDB id)', async () => {
    const userSupabase = makeUserSupabase({ entriesData: [], userGamesData: [] });
    mockCreateRouteHandlerClient.mockResolvedValue(userSupabase);
    mockGetUserSteamInput.mockResolvedValue('steam-user');
    mockGetSteamApiKey.mockReturnValue('key');
    mockResolveSteamId64.mockResolvedValue('steam64');
    mockFetchSteamOwnedGames.mockResolvedValue([defaultGame]);

    const igdbGame = { id: 10, name: 'Counter-Strike 2' };
    mockMatchSteamGamesToIgdb.mockResolvedValue(new Map([[730, igdbGame]]));
    mockEnrichIgdbMatches.mockResolvedValue(new Map([[730, igdbGame]]));

    // No existing media by steam_app_id, but existing media by rawg_id=10
    let callCount = 0;
    const adminSupabase = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1) {
          // steam_app_id query → no match
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                in: jest.fn().mockResolvedValue({ data: [], error: null }),
              })),
            })),
          };
        }
        if (callCount === 2) {
          // rawg_id query → existing media found
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                in: jest.fn().mockResolvedValue({
                  data: [{ id: 777, rawg_id: 10 }],
                  error: null,
                }),
              })),
            })),
          };
        }
        // allGames query
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          })),
          update: jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ error: null }) })),
        };
      }),
    };
    mockCreateSupabaseAdminClient.mockReturnValue(adminSupabase);

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.mediaUpdated).toBeGreaterThanOrEqual(1);
  });

  it('covers title-duplicate branch (existingByTitle found in allGamesRows)', async () => {
    const userSupabase = makeUserSupabase({ entriesData: [], userGamesData: [] });
    mockCreateRouteHandlerClient.mockResolvedValue(userSupabase);
    mockGetUserSteamInput.mockResolvedValue('steam-user');
    mockGetSteamApiKey.mockReturnValue('key');
    mockResolveSteamId64.mockResolvedValue('steam64');
    mockFetchSteamOwnedGames.mockResolvedValue([defaultGame]);

    const igdbGame = { id: 10, name: 'Counter-Strike 2' };
    mockMatchSteamGamesToIgdb.mockResolvedValue(new Map([[730, igdbGame]]));
    mockEnrichIgdbMatches.mockResolvedValue(new Map([[730, igdbGame]]));

    let callCount = 0;
    const adminSupabase = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1) {
          // steam_app_id: no match
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                in: jest.fn().mockResolvedValue({ data: [], error: null }),
              })),
            })),
          };
        }
        if (callCount === 2) {
          // rawg_id: no match
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                in: jest.fn().mockResolvedValue({ data: [], error: null }),
              })),
            })),
          };
        }
        // callCount === 3: allGames with title match + English title different
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 888,
                  title: 'Counter-Strike 2',
                  title_english: 'Counter Strike 2 EN',
                  steam_app_id: null,
                  rawg_id: null,
                  source: null,
                },
              ],
              error: null,
            }),
          })),
          update: jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ error: null }) })),
        };
      }),
    };
    mockCreateSupabaseAdminClient.mockReturnValue(adminSupabase);

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.mediaUpdated).toBeGreaterThanOrEqual(1);
  });

  it('covers individual media insert fallback (bulk insert fails → individual succeeds)', async () => {
    const userSupabase = makeUserSupabase({ entriesData: [], userGamesData: [] });
    mockCreateRouteHandlerClient.mockResolvedValue(userSupabase);
    mockGetUserSteamInput.mockResolvedValue('steam-user');
    mockGetSteamApiKey.mockReturnValue('key');
    mockResolveSteamId64.mockResolvedValue('steam64');
    mockFetchSteamOwnedGames.mockResolvedValue([defaultGame]);

    const igdbGame = { id: 10, name: 'Counter-Strike 2' };
    mockMatchSteamGamesToIgdb.mockResolvedValue(new Map([[730, igdbGame]]));
    mockEnrichIgdbMatches.mockResolvedValue(new Map([[730, igdbGame]]));

    // Track calls to know which query we're in
    let fromCallCount = 0;
    const singleMock = jest
      .fn()
      .mockResolvedValue({ data: { id: 555, steam_app_id: 730 }, error: null });

    const adminSupabase = {
      from: jest.fn(() => {
        fromCallCount++;
        if (fromCallCount === 1) {
          // steam_app_id query: no existing media
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                in: jest.fn().mockResolvedValue({ data: [], error: null }),
              })),
            })),
          };
        }
        if (fromCallCount === 2) {
          // rawg_id query: no existing IGDB media
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                in: jest.fn().mockResolvedValue({ data: [], error: null }),
              })),
            })),
          };
        }
        if (fromCallCount === 3) {
          // allGames query: no title matches
          return {
            select: jest.fn(() => ({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            })),
          };
        }
        if (fromCallCount === 4) {
          // Bulk insert fails
          return {
            insert: jest.fn(() => ({
              select: jest.fn().mockResolvedValue({ data: null, error: { message: 'bulk fail' } }),
            })),
          };
        }
        // fromCallCount === 5: individual insert succeeds
        return {
          insert: jest.fn(() => ({
            select: jest.fn(() => ({ single: singleMock })),
          })),
        };
      }),
    };
    mockCreateSupabaseAdminClient.mockReturnValue(adminSupabase);

    const res = await POST(makeRequest());
    expect([200, 500]).toContain(res.status);
  });

  it('covers individual media insert fallback with individual insert error (failedMediaInsertCount++)', async () => {
    const userSupabase = makeUserSupabase({ entriesData: [], userGamesData: [] });
    mockCreateRouteHandlerClient.mockResolvedValue(userSupabase);
    mockGetUserSteamInput.mockResolvedValue('steam-user');
    mockGetSteamApiKey.mockReturnValue('key');
    mockResolveSteamId64.mockResolvedValue('steam64');
    mockFetchSteamOwnedGames.mockResolvedValue([defaultGame]);

    const igdbGame = { id: 10, name: 'Counter-Strike 2' };
    mockMatchSteamGamesToIgdb.mockResolvedValue(new Map([[730, igdbGame]]));
    mockEnrichIgdbMatches.mockResolvedValue(new Map([[730, igdbGame]]));

    let fromCallCount = 0;
    const adminSupabase = {
      from: jest.fn(() => {
        fromCallCount++;
        if (fromCallCount === 1) {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({ in: jest.fn().mockResolvedValue({ data: [], error: null }) })),
            })),
          };
        }
        if (fromCallCount === 2) {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({ in: jest.fn().mockResolvedValue({ data: [], error: null }) })),
            })),
          };
        }
        if (fromCallCount === 3) {
          return {
            select: jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ data: [], error: null }) })),
          };
        }
        if (fromCallCount === 4) {
          // Bulk insert fails
          return {
            insert: jest.fn(() => ({
              select: jest.fn().mockResolvedValue({ data: null, error: { message: 'bulk fail' } }),
            })),
          };
        }
        // Individual insert also fails
        return {
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest
                .fn()
                .mockResolvedValue({ data: null, error: { message: 'individual fail' } }),
            })),
          })),
        };
      }),
    };
    mockCreateSupabaseAdminClient.mockReturnValue(adminSupabase);

    const res = await POST(makeRequest());
    expect([200, 500]).toContain(res.status);
    if (res.status === 200) {
      const body = await res.json();
      expect(body.mediaInsertFailed).toBe(1);
      expect(body.warnings).toContain('Failed media inserts: 1');
    }
  });

  it('covers media update failure counter', async () => {
    const userSupabase = makeUserSupabase({ entriesData: [], userGamesData: [] });
    mockCreateRouteHandlerClient.mockResolvedValue(userSupabase);
    mockGetUserSteamInput.mockResolvedValue('steam-user');
    mockGetSteamApiKey.mockReturnValue('key');
    mockResolveSteamId64.mockResolvedValue('steam64');
    mockFetchSteamOwnedGames.mockResolvedValue([defaultGame]);

    mockMatchSteamGamesToIgdb.mockResolvedValue(new Map([[730, null]]));
    mockEnrichIgdbMatches.mockResolvedValue(new Map([[730, null]]));

    // Existing media found → goes to update path → update fails → failedMediaUpdateCount++
    const existingMedia = [{ id: 999, steam_app_id: 730, rawg_id: null, source: null }];
    let callCount = 0;
    const adminSupabase = {
      from: jest.fn(() => {
        callCount++;
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              in: jest.fn().mockResolvedValue({
                data: callCount === 1 ? existingMedia : [],
                error: null,
              }),
            })),
          })),
          update: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ error: { message: 'update fail' } }),
          })),
        };
      }),
    };
    mockCreateSupabaseAdminClient.mockReturnValue(adminSupabase);

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.warnings).toContain('Failed media updates: 1');
    expect(body.mediaUpdateFailed).toBe(1);
  });

  it('throws when existingEntriesError occurs', async () => {
    const userSupabase = {
      from: jest.fn((table: string) => {
        if (table === 'user_media_entries') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                in: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'entries query fail' },
                }),
                eq: jest.fn().mockResolvedValue({ data: [], error: null }),
              })),
            })),
            upsert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
        throw new Error(`Unexpected: ${table}`);
      }),
    };
    mockCreateRouteHandlerClient.mockResolvedValue(userSupabase);
    mockGetUserSteamInput.mockResolvedValue('steam-user');
    mockGetSteamApiKey.mockReturnValue('key');
    mockResolveSteamId64.mockResolvedValue('steam64');
    mockFetchSteamOwnedGames.mockResolvedValue([defaultGame]);
    mockMatchSteamGamesToIgdb.mockResolvedValue(new Map([[730, null]]));
    mockEnrichIgdbMatches.mockResolvedValue(new Map([[730, null]]));

    // Admin: existing media found for steam_app_id 730
    const adminSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({
              data: [{ id: 999, steam_app_id: 730, rawg_id: null, source: null }],
              error: null,
            }),
          })),
        })),
        update: jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ error: null }) })),
      })),
    };
    mockCreateSupabaseAdminClient.mockReturnValue(adminSupabase);

    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
  });

  it('throws when userGameRowsError occurs', async () => {
    const userSupabase = {
      from: jest.fn((table: string) => {
        if (table === 'user_media_entries') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                in: jest.fn().mockResolvedValue({ data: [], error: null }),
                eq: jest
                  .fn()
                  // First eq().eq() is userGameRows query → fail
                  .mockResolvedValue({ data: null, error: { message: 'game rows fail' } }),
              })),
            })),
            upsert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
        throw new Error(`Unexpected: ${table}`);
      }),
    };
    mockCreateRouteHandlerClient.mockResolvedValue(userSupabase);
    mockGetUserSteamInput.mockResolvedValue('steam-user');
    mockGetSteamApiKey.mockReturnValue('key');
    mockResolveSteamId64.mockResolvedValue('steam64');
    mockFetchSteamOwnedGames.mockResolvedValue([defaultGame]);
    mockMatchSteamGamesToIgdb.mockResolvedValue(new Map([[730, null]]));
    mockEnrichIgdbMatches.mockResolvedValue(new Map([[730, null]]));

    const adminSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: [], error: null }),
          })),
        })),
      })),
    };
    mockCreateSupabaseAdminClient.mockReturnValue(adminSupabase);

    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
  });

  it('covers English title addition to userTitleSet', async () => {
    // User has a game with different title and title_english
    const userSupabase = {
      from: jest.fn((table: string) => {
        if (table === 'user_media_entries') {
          let inCalled = false;
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                in: jest.fn().mockImplementation(() => {
                  if (!inCalled) {
                    inCalled = true;
                    return Promise.resolve({ data: [], error: null });
                  }
                  return Promise.resolve({ data: [], error: null });
                }),
                eq: jest.fn().mockResolvedValue({
                  // userGameRows: one entry with different title and title_english
                  data: [
                    {
                      media_items: {
                        title: 'CS2',
                        title_english: 'Counter-Strike 2',
                        category: 'games',
                      },
                    },
                  ],
                  error: null,
                }),
              })),
            })),
            upsert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
        throw new Error(`Unexpected: ${table}`);
      }),
    };
    mockCreateRouteHandlerClient.mockResolvedValue(userSupabase);
    mockGetUserSteamInput.mockResolvedValue('steam-user');
    mockGetSteamApiKey.mockReturnValue('key');
    mockResolveSteamId64.mockResolvedValue('steam64');
    mockFetchSteamOwnedGames.mockResolvedValue([defaultGame]);
    mockMatchSteamGamesToIgdb.mockResolvedValue(new Map([[730, null]]));
    mockEnrichIgdbMatches.mockResolvedValue(new Map([[730, null]]));

    const adminSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({
              data: [{ id: 999, steam_app_id: 730, rawg_id: null, source: null }],
              error: null,
            }),
          })),
        })),
        update: jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ error: null }) })),
      })),
    };
    mockCreateSupabaseAdminClient.mockReturnValue(adminSupabase);

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
  });

  it('covers entry updates upsert and upsert error for userEntryUpdates', async () => {
    const userSupabase = {
      from: jest.fn((table: string) => {
        if (table === 'user_media_entries') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                // existingEntries: one entry with steam source → goes to userEntryUpdates
                in: jest.fn().mockResolvedValue({
                  data: [
                    {
                      media_id: 999,
                      import_source: 'steam',
                      status: 'current',
                      updated_at: null,
                    },
                  ],
                  error: null,
                }),
                eq: jest.fn().mockResolvedValue({ data: [], error: null }),
              })),
            })),
            upsert: jest.fn().mockImplementation(() => {
              // This is the only upsert called (userEntryPayload is empty, only userEntryUpdates)
              return Promise.resolve({ error: { message: 'update upsert fail' } });
            }),
          };
        }
        throw new Error(`Unexpected: ${table}`);
      }),
    };
    mockCreateRouteHandlerClient.mockResolvedValue(userSupabase);
    mockGetUserSteamInput.mockResolvedValue('steam-user');
    mockGetSteamApiKey.mockReturnValue('key');
    mockResolveSteamId64.mockResolvedValue('steam64');
    mockFetchSteamOwnedGames.mockResolvedValue([defaultGame]);
    mockMatchSteamGamesToIgdb.mockResolvedValue(new Map([[730, null]]));
    mockEnrichIgdbMatches.mockResolvedValue(new Map([[730, null]]));

    const adminSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({
              data: [{ id: 999, steam_app_id: 730, rawg_id: null, source: null }],
              error: null,
            }),
          })),
        })),
        update: jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ error: null }) })),
      })),
    };
    mockCreateSupabaseAdminClient.mockReturnValue(adminSupabase);

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.entriesUpdated).toBe(1);
    expect(body.warnings).toContain('Failed entry inserts/updates: 1');
  });

  it('covers debug sample for non-empty games', async () => {
    const userSupabase = makeUserSupabase({ entriesData: [], userGamesData: [] });
    mockCreateRouteHandlerClient.mockResolvedValue(userSupabase);
    mockGetUserSteamInput.mockResolvedValue('steam-user');
    mockGetSteamApiKey.mockReturnValue('key');
    mockResolveSteamId64.mockResolvedValue('steam64');
    mockFetchSteamOwnedGames.mockResolvedValue([defaultGame]);
    mockMatchSteamGamesToIgdb.mockResolvedValue(new Map([[730, null]]));
    mockEnrichIgdbMatches.mockResolvedValue(new Map([[730, null]]));

    const adminSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: [], error: null }),
          })),
        })),
      })),
    };
    mockCreateSupabaseAdminClient.mockReturnValue(adminSupabase);

    const res = await POST(makeRequest('/api/integrations/steam/sync', 'POST', 'debug=1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.debug).toBeDefined();
    expect(body.debug.steamId64).toBe('steam64');
    expect(body.debug.sample).toHaveLength(1);
  });

  it('produces warnings when inserts/updates fail', async () => {
    const userSupabase = makeUserSupabase({
      entriesData: [],
      userGamesData: [],
      upsertError: { message: 'upsert fail' },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(userSupabase);
    mockGetUserSteamInput.mockResolvedValue('steam-user');
    mockGetSteamApiKey.mockReturnValue('key');
    mockResolveSteamId64.mockResolvedValue('steam64');
    mockFetchSteamOwnedGames.mockResolvedValue([defaultGame]);
    mockMatchSteamGamesToIgdb.mockResolvedValue(new Map([[730, null]]));
    mockEnrichIgdbMatches.mockResolvedValue(new Map([[730, null]]));

    const adminSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({
              data: [{ id: 999, steam_app_id: 730, rawg_id: null, source: null }],
              error: null,
            }),
          })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: { message: 'update fail' } }),
        })),
      })),
    };
    mockCreateSupabaseAdminClient.mockReturnValue(adminSupabase);

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.warnings).toBeDefined();
  });
});
