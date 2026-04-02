/**
 * @jest-environment node
 */

let runningJobId: string | null = null;
const mockRequireAuth = jest.fn();
const mockCreateRouteHandlerClient = jest.fn();
const mockCreateSupabaseAdminClient = jest.fn();

const mockSteamSyncJobsInsert = jest.fn();
const mockSteamSyncJobsMaybeSingle = jest.fn();
const mockSteamSyncJobsUpdateEq = jest.fn();
const mockSteamSyncJobsUpdate = jest.fn(() => ({ eq: mockSteamSyncJobsUpdateEq }));

const mockCategoryProfilesMaybeSingle = jest.fn();

const mockFrom = jest.fn((table: string) => {
  if (table === 'steam_sync_jobs') {
    const selectBuilder = {
      eq: jest.fn(() => selectBuilder),
      maybeSingle: (...args: unknown[]) => mockSteamSyncJobsMaybeSingle(...args),
    };

    return {
      select: jest.fn(() => selectBuilder),
      insert: (...args: unknown[]) => mockSteamSyncJobsInsert(...args),
      update: (...args: unknown[]) => mockSteamSyncJobsUpdate(...args),
    };
  }

  if (table === 'user_category_profiles') {
    return {
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: (...args: unknown[]) => mockCategoryProfilesMaybeSingle(...args),
        })),
      })),
    };
  }

  throw new Error(`Unexpected table: ${table}`);
});

const mockSupabase = {
  from: (...args: unknown[]) => mockFrom(...args),
};

jest.mock('@/lib/supabase-route-handler', () => ({
  createRouteHandlerClient: (...args: unknown[]) => mockCreateRouteHandlerClient(...args),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: (...args: unknown[]) => mockCreateSupabaseAdminClient(...args),
}));

jest.mock('@/lib/api/auth', () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
  UnauthorizedError: class UnauthorizedError extends Error {},
}));

jest.mock('@/lib/observability/withApiRoute', () => ({
  withApiRoute: (handler: (...args: unknown[]) => unknown) => handler,
}));

jest.mock('@/lib/services/igdbService', () => ({
  searchIgdbGames: jest.fn(),
  fetchIgdbGameDetails: jest.fn(),
  mapIgdbToPayload: jest.fn(),
}));

jest.mock('@/lib/integrations/steam', () => ({
  fetchSteamOwnedGames: jest.fn(),
  fetchSteamAchievements: jest.fn(),
  getSteamApiKey: jest.fn(),
  getSteamCoverUrls: jest.fn(),
  resolveSteamId64: jest.fn(),
}));

function makeRequest() {
  return new Request('http://localhost/api/integrations/steam/sync', { method: 'POST' });
}

describe('POST /api/integrations/steam/sync RC-015', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    runningJobId = null;

    // Suppress expected console noise from syncSteamForUser when the sync
    // proceeds past the guard and fails due to missing Steam ID in the fixture.
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    mockCreateRouteHandlerClient.mockResolvedValue(mockSupabase);
    mockCreateSupabaseAdminClient.mockReturnValue({});
    mockRequireAuth.mockResolvedValue({ user: { id: 'user-1' } });

    mockSteamSyncJobsMaybeSingle.mockImplementation(() =>
      Promise.resolve({
        data: runningJobId ? { id: runningJobId, status: 'running' } : null,
        error: null,
      }),
    );

    mockSteamSyncJobsInsert.mockImplementation((payload: { id: string }) => {
      runningJobId = payload.id;
      return Promise.resolve({ error: null });
    });

    mockSteamSyncJobsUpdateEq.mockResolvedValue({ error: null });
    mockCategoryProfilesMaybeSingle.mockResolvedValue({ data: { profiles: {} }, error: null });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 409 and existing jobId when a running job already exists', async () => {
    runningJobId = 'running-job-1';

    const { POST } = await import('@/app/api/integrations/steam/sync/route');
    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body).toEqual({
      error: 'A sync is already in progress.',
      jobId: 'running-job-1',
    });
    expect(mockSteamSyncJobsInsert).not.toHaveBeenCalled();
  });

  it('proceeds to create a sync job when no running job exists', async () => {
    const { POST } = await import('@/app/api/integrations/steam/sync/route');
    const res = await POST(makeRequest());

    expect(mockSteamSyncJobsInsert).toHaveBeenCalledTimes(1);
    // Sync fails later because no steam_id is configured in this test fixture.
    expect(res.status).toBe(500);
  });

  it('with concurrent requests creates at most one running job', async () => {
    let insertCallCount = 0;
    let successfulJobCreates = 0;
    let resolveFirstInsert: (() => void) | null = null;

    mockSteamSyncJobsInsert.mockImplementation((payload: { id: string }) => {
      insertCallCount += 1;

      if (insertCallCount === 1) {
        return new Promise(resolve => {
          resolveFirstInsert = () => {
            runningJobId = payload.id;
            successfulJobCreates += 1;
            resolve({ error: null });
          };
        });
      }

      return Promise.resolve({
        error: { code: '23505', message: 'duplicate key value violates unique constraint' },
      });
    });

    const { POST } = await import('@/app/api/integrations/steam/sync/route');

    const first = POST(makeRequest());
    const second = POST(makeRequest());

    while (insertCallCount < 2) {
      await Promise.resolve();
    }

    resolveFirstInsert?.();

    const [firstRes, secondRes] = await Promise.all([first, second]);
    const statuses = [firstRes.status, secondRes.status].sort();

    expect(successfulJobCreates).toBe(1);
    expect(statuses).toEqual([409, 500]);
  });
});
