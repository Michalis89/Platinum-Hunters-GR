/**
 * @jest-environment node
 */

const mockCreateRouteHandlerClient = jest.fn();
const mockRandomUUID = jest.fn(() => 'test-uuid-1234');

jest.mock('@/lib/supabase-route-handler', () => ({
  createRouteHandlerClient: (...args: unknown[]) => mockCreateRouteHandlerClient(...args),
}));

jest.mock('crypto', () => ({
  randomUUID: () => mockRandomUUID(),
}));

// We need SyncAlreadyRunningError from helpers - not mocked
jest.mock('../helpers', () => {
  const actual = jest.requireActual('../helpers');
  return actual;
});

import { getUserSteamInput, createSyncJob, getRunningSyncJob, updateSyncJob } from '../jobs';
import { SyncAlreadyRunningError } from '../helpers';

// ─── Supabase builder helpers ─────────────────────────────────────────────

function makeSupabase(tables: Record<string, unknown> = {}) {
  const fromImpl = jest.fn((table: string) => {
    if (table in tables) {
      return tables[table];
    }
    throw new Error(`Unexpected table in test: ${table}`);
  });
  return { from: fromImpl };
}

function makeSteamSyncJobsTable({
  selectResult = { data: null, error: null } as { data: unknown; error: unknown },
  insertResult = { error: null } as { error: unknown },
  updateResult = { error: null } as { error: unknown },
} = {}) {
  const eqStatus = jest.fn(() => ({ maybeSingle: jest.fn().mockResolvedValue(selectResult) }));
  const eqUser = jest.fn(() => ({ eq: eqStatus }));
  const selectBuilder = { eq: eqUser };

  const updateEq = jest.fn().mockResolvedValue(updateResult);
  const updateBuilder = jest.fn(() => ({ eq: updateEq }));

  return {
    select: jest.fn(() => selectBuilder),
    insert: jest.fn().mockResolvedValue(insertResult),
    update: (...args: unknown[]) => updateBuilder(...args),
    _updateEq: updateEq,
    _updateBuilder: updateBuilder,
  };
}

function makeUserCategoryProfilesTable({
  result = { data: null, error: null } as { data: unknown; error: unknown },
} = {}) {
  const maybeSingle = jest.fn().mockResolvedValue(result);
  const eqUser = jest.fn(() => ({ maybeSingle }));
  const selectBuilder = { eq: eqUser };
  return {
    select: jest.fn(() => selectBuilder),
    _maybeSingle: maybeSingle,
  };
}

// ─── getUserSteamInput ────────────────────────────────────────────────────

describe('getUserSteamInput', () => {
  it('returns null when no category data', async () => {
    const profilesTable = makeUserCategoryProfilesTable({ result: { data: null, error: null } });
    const supabase = makeSupabase({ user_category_profiles: profilesTable });

    const result = await getUserSteamInput(supabase as never, 'user-1');
    expect(result).toBeNull();
  });

  it('returns steam_id from nested profiles.games.steam_id', async () => {
    const profilesTable = makeUserCategoryProfilesTable({
      result: {
        data: { profiles: { games: { steam_id: '76561197000000001' } } },
        error: null,
      },
    });
    const supabase = makeSupabase({ user_category_profiles: profilesTable });

    const result = await getUserSteamInput(supabase as never, 'user-1');
    expect(result).toBe('76561197000000001');
  });

  it('trims whitespace from steam_id', async () => {
    const profilesTable = makeUserCategoryProfilesTable({
      result: {
        data: { profiles: { games: { steam_id: '  mysteamid  ' } } },
        error: null,
      },
    });
    const supabase = makeSupabase({ user_category_profiles: profilesTable });

    const result = await getUserSteamInput(supabase as never, 'user-1');
    expect(result).toBe('mysteamid');
  });

  it('returns null when steam_id is empty string', async () => {
    const profilesTable = makeUserCategoryProfilesTable({
      result: {
        data: { profiles: { games: { steam_id: '' } } },
        error: null,
      },
    });
    const supabase = makeSupabase({ user_category_profiles: profilesTable });

    const result = await getUserSteamInput(supabase as never, 'user-1');
    expect(result).toBeNull();
  });

  it('returns null when games key is missing', async () => {
    const profilesTable = makeUserCategoryProfilesTable({
      result: { data: { profiles: {} }, error: null },
    });
    const supabase = makeSupabase({ user_category_profiles: profilesTable });

    const result = await getUserSteamInput(supabase as never, 'user-1');
    expect(result).toBeNull();
  });

  it('returns null when steam_id is not a string', async () => {
    const profilesTable = makeUserCategoryProfilesTable({
      result: {
        data: { profiles: { games: { steam_id: 12345 } } },
        error: null,
      },
    });
    const supabase = makeSupabase({ user_category_profiles: profilesTable });

    const result = await getUserSteamInput(supabase as never, 'user-1');
    expect(result).toBeNull();
  });

  it('throws when categoryError is present', async () => {
    const profilesTable = makeUserCategoryProfilesTable({
      result: { data: null, error: { message: 'db error' } },
    });
    const supabase = makeSupabase({ user_category_profiles: profilesTable });

    await expect(getUserSteamInput(supabase as never, 'user-1')).rejects.toThrow('db error');
  });

  it('throws generic message when error has no message', async () => {
    const profilesTable = makeUserCategoryProfilesTable({
      result: { data: null, error: { code: 500 } },
    });
    const supabase = makeSupabase({ user_category_profiles: profilesTable });

    await expect(getUserSteamInput(supabase as never, 'user-1')).rejects.toThrow(
      'Failed to fetch category profile',
    );
  });
});

// ─── createSyncJob ────────────────────────────────────────────────────────

describe('createSyncJob', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates a job and returns the jobId', async () => {
    const jobsTable = makeSteamSyncJobsTable({ insertResult: { error: null } });
    mockCreateRouteHandlerClient.mockResolvedValue(makeSupabase({ steam_sync_jobs: jobsTable }));

    const id = await createSyncJob('user-1');
    expect(id).toBe('test-uuid-1234');
    expect(jobsTable.insert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'test-uuid-1234', user_id: 'user-1', status: 'running' }),
    );
  });

  it('throws SyncAlreadyRunningError on duplicate key (23505)', async () => {
    // Insert fails with duplicate
    const duplicateError = { code: '23505', message: 'duplicate key' };

    // For the getRunningSyncJob call inside createSyncJob: returns existing job
    const runningJobData = { id: 'existing-job', status: 'running' };
    const selectEqStatus = jest.fn().mockReturnValue({
      maybeSingle: jest.fn().mockResolvedValue({ data: runningJobData, error: null }),
    });
    const selectEqUser = jest.fn().mockReturnValue({ eq: selectEqStatus });
    const selectBuilder = { eq: selectEqUser };

    const jobsTable = {
      select: jest.fn().mockReturnValue(selectBuilder),
      insert: jest.fn().mockResolvedValue({ error: duplicateError }),
      update: jest.fn(),
    };

    mockCreateRouteHandlerClient.mockResolvedValue(makeSupabase({ steam_sync_jobs: jobsTable }));

    const err = await createSyncJob('user-1').catch(e => e);
    expect(err).toBeInstanceOf(SyncAlreadyRunningError);
    expect((err as SyncAlreadyRunningError).jobId).toBe('existing-job');
  });

  it('throws SyncAlreadyRunningError with null jobId when getRunningSyncJob fails', async () => {
    const duplicateError = { code: '23505', message: 'duplicate key' };

    // getRunningSyncJob will throw (error in select)
    const selectEqStatus = jest.fn().mockReturnValue({
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }),
    });
    const selectEqUser = jest.fn().mockReturnValue({ eq: selectEqStatus });
    const selectBuilder = { eq: selectEqUser };

    const jobsTable = {
      select: jest.fn().mockReturnValue(selectBuilder),
      insert: jest.fn().mockResolvedValue({ error: duplicateError }),
      update: jest.fn(),
    };

    mockCreateRouteHandlerClient.mockResolvedValue(makeSupabase({ steam_sync_jobs: jobsTable }));

    const err = await createSyncJob('user-1').catch(e => e);
    expect(err).toBeInstanceOf(SyncAlreadyRunningError);
    expect((err as SyncAlreadyRunningError).jobId).toBeNull();
  });

  it('throws generic error for non-duplicate errors', async () => {
    const jobsTable = makeSteamSyncJobsTable({
      insertResult: { error: { code: '99999', message: 'unexpected' } },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(makeSupabase({ steam_sync_jobs: jobsTable }));

    await expect(createSyncJob('user-1')).rejects.toThrow('Failed to create sync job');
  });
});

// ─── getRunningSyncJob ────────────────────────────────────────────────────

describe('getRunningSyncJob', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns null when no running job', async () => {
    const jobsTable = makeSteamSyncJobsTable({ selectResult: { data: null, error: null } });
    mockCreateRouteHandlerClient.mockResolvedValue(makeSupabase({ steam_sync_jobs: jobsTable }));

    const result = await getRunningSyncJob('user-1');
    expect(result).toBeNull();
  });

  it('returns job id when running job exists', async () => {
    const jobsTable = makeSteamSyncJobsTable({
      selectResult: { data: { id: 'running-job', status: 'running' }, error: null },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(makeSupabase({ steam_sync_jobs: jobsTable }));

    const result = await getRunningSyncJob('user-1');
    expect(result).toEqual({ id: 'running-job' });
  });

  it('throws when query error occurs', async () => {
    const jobsTable = makeSteamSyncJobsTable({
      selectResult: { data: null, error: { message: 'query failed' } },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(makeSupabase({ steam_sync_jobs: jobsTable }));

    await expect(getRunningSyncJob('user-1')).rejects.toThrow('Failed to check running sync job');
  });
});

// ─── updateSyncJob ────────────────────────────────────────────────────────

describe('updateSyncJob', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('updates job with all fields', async () => {
    const jobsTable = makeSteamSyncJobsTable({ updateResult: { error: null } });
    mockCreateRouteHandlerClient.mockResolvedValue(makeSupabase({ steam_sync_jobs: jobsTable }));

    await updateSyncJob('job-1', {
      status: 'completed',
      message: 'done',
      percent: 100,
      completedSteps: 5,
      totalSteps: 5,
      error: null,
      result: { foo: 'bar' },
      finishedAt: '2024-01-01T00:00:00Z',
    });

    expect(jobsTable._updateBuilder).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        message: 'done',
        percent: 100,
        completed_steps: 5,
        total_steps: 5,
        error: null,
        finished_at: '2024-01-01T00:00:00Z',
      }),
    );
    expect(jobsTable._updateEq).toHaveBeenCalledWith('id', 'job-1');
  });

  it('only includes defined fields in update', async () => {
    const jobsTable = makeSteamSyncJobsTable({ updateResult: { error: null } });
    mockCreateRouteHandlerClient.mockResolvedValue(makeSupabase({ steam_sync_jobs: jobsTable }));

    await updateSyncJob('job-1', { message: 'in progress' });

    const updateArg = jobsTable._updateBuilder.mock.calls[0][0] as Record<string, unknown>;
    expect(updateArg).toHaveProperty('message', 'in progress');
    expect(updateArg).not.toHaveProperty('status');
    expect(updateArg).not.toHaveProperty('percent');
  });

  it('warns but does not throw on update error', async () => {
    const jobsTable = makeSteamSyncJobsTable({
      updateResult: { error: { message: 'update failed' } },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(makeSupabase({ steam_sync_jobs: jobsTable }));

    await expect(updateSyncJob('job-1', { status: 'failed' })).resolves.toBeUndefined();
    expect(console.warn).toHaveBeenCalledWith('Failed to update sync job:', expect.anything());
  });

  it('includes percent=0 in update (number branch)', async () => {
    const jobsTable = makeSteamSyncJobsTable({ updateResult: { error: null } });
    mockCreateRouteHandlerClient.mockResolvedValue(makeSupabase({ steam_sync_jobs: jobsTable }));

    await updateSyncJob('job-1', { percent: 0, completedSteps: 0, totalSteps: 10 });

    const updateArg = jobsTable._updateBuilder.mock.calls[0][0] as Record<string, unknown>;
    expect(updateArg).toHaveProperty('percent', 0);
    expect(updateArg).toHaveProperty('completed_steps', 0);
    expect(updateArg).toHaveProperty('total_steps', 10);
  });
});
