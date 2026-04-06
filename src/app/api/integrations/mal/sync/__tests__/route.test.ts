/**
 * @jest-environment node
 */

import 'whatwg-fetch';

const createRouteHandlerClientMock = jest.fn();
const createSupabaseAdminClientMock = jest.fn();
const requireAuthMock = jest.fn();
const fetchMalListMock = jest.fn();
const getMalOAuthConfigMock = jest.fn();
const mapMalStatusToBacklogStatusMock = jest.fn();
const refreshMalAccessTokenMock = jest.fn();
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

jest.mock('@/lib/integrations/mal', () => ({
  __esModule: true,
  fetchMalList: (...args: unknown[]) => fetchMalListMock(...args),
  getMalOAuthConfig: (...args: unknown[]) => getMalOAuthConfigMock(...args),
  mapMalStatusToBacklogStatus: (...args: unknown[]) => mapMalStatusToBacklogStatusMock(...args),
  refreshMalAccessToken: (...args: unknown[]) => refreshMalAccessTokenMock(...args),
}));

jest.mock('@/lib/profile/genre-affinity', () => ({
  __esModule: true,
  refreshGenreAffinity: (...args: unknown[]) => refreshGenreAffinityMock(...args),
}));

import { POST } from '@/app/api/integrations/mal/sync/route';
import { UnauthorizedError } from '@/lib/api/auth';

type UserClientConfig = {
  integrationData?: unknown;
  integrationError?: unknown;
  refreshStoreError?: unknown;
  existingEntryRows?: unknown[] | null;
  existingEntriesError?: unknown;
  entryInsertError?: unknown;
};

function makeUserClient(config: UserClientConfig = {}) {
  const integrationData = config.integrationData ?? null;
  const integrationError = config.integrationError ?? null;
  const existingEntryRows = config.existingEntryRows === undefined ? [] : config.existingEntryRows;
  const existingEntriesError = config.existingEntriesError ?? null;
  const entryInsertError = config.entryInsertError ?? null;

  const integrationMaybeSingle = jest
    .fn()
    .mockResolvedValue({ data: integrationData, error: integrationError });
  const integrationEq2 = jest.fn().mockReturnValue({ maybeSingle: integrationMaybeSingle });
  const integrationEq1 = jest.fn().mockReturnValue({ eq: integrationEq2 });
  const integrationSelect = jest.fn().mockReturnValue({ eq: integrationEq1 });

  const refreshEq2 = jest.fn().mockResolvedValue({ error: config.refreshStoreError ?? null });
  const refreshEq1 = jest.fn().mockReturnValue({ eq: refreshEq2 });
  const refreshUpdate = jest.fn().mockReturnValue({ eq: refreshEq1 });

  const entryIn = jest
    .fn()
    .mockResolvedValue({ data: existingEntryRows, error: existingEntriesError });
  const entryEq = jest.fn().mockReturnValue({ in: entryIn });
  const entrySelect = jest.fn().mockReturnValue({ eq: entryEq });
  const entryInsert = jest.fn().mockResolvedValue({ error: entryInsertError });

  const from = jest.fn((table: string) => {
    if (table === 'user_integrations') {
      return { select: integrationSelect, update: refreshUpdate };
    }
    if (table === 'user_media_entries') {
      return { select: entrySelect, insert: entryInsert };
    }
    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    from,
    spies: {
      integrationMaybeSingle,
      refreshUpdate,
      refreshEq2,
      entryInsert,
      entryIn,
    },
  };
}

type AdminClientConfig = {
  existingMediaRows?: unknown[];
  existingMediaError?: unknown;
  mediaRows?: unknown[];
  mediaUpsertError?: unknown;
};

type MalTestItem = {
  node: {
    id: number;
    title: string;
    alternative_titles: {
      en: string;
      ja: string;
      synonyms: string[];
    };
    synopsis: string;
    media_type: string;
    status: string;
    start_date: string | null;
    main_picture: {
      large: string;
      medium: string;
    };
    genres: Array<{ name: string }>;
    num_episodes?: number;
  };
  list_status: {
    status: string;
    score: number | null;
    num_episodes_watched: number;
    num_chapters_read: number;
  };
};

function makeAdminClient(config: AdminClientConfig = {}) {
  const existingMediaRows = config.existingMediaRows ?? [];
  const existingMediaError = config.existingMediaError ?? null;
  const mediaRows = config.mediaRows ?? [];
  const mediaUpsertError = config.mediaUpsertError ?? null;

  const mediaIn = jest
    .fn()
    .mockResolvedValue({ data: existingMediaRows, error: existingMediaError });
  const mediaEq2 = jest.fn().mockReturnValue({ in: mediaIn });
  const mediaEq1 = jest.fn().mockReturnValue({ eq: mediaEq2 });
  const mediaSelect = jest.fn().mockReturnValue({ eq: mediaEq1 });

  const mediaUpsertSelect = jest
    .fn()
    .mockResolvedValue({ data: mediaRows, error: mediaUpsertError });
  const mediaUpsert = jest.fn().mockReturnValue({ select: mediaUpsertSelect });

  const from = jest.fn((table: string) => {
    if (table === 'media_items') {
      return { select: mediaSelect, upsert: mediaUpsert };
    }
    throw new Error(`Unexpected table: ${table}`);
  });

  return { from, spies: { mediaIn, mediaUpsert, mediaUpsertSelect } };
}

function makeMalItem(id: number, overrides?: Partial<MalTestItem>) {
  const {
    node: nodeOverrides,
    list_status: listStatusOverrides,
    ...restOverrides
  } = overrides ?? {};
  return {
    node: {
      id,
      title: `Title ${id}`,
      alternative_titles: { en: `EN ${id}`, ja: `JA ${id}`, synonyms: ['syn'] },
      synopsis: 'desc',
      media_type: 'tv',
      status: 'finished_airing',
      start_date: '2020-01-01',
      main_picture: { large: `https://img/${id}-l.jpg`, medium: `https://img/${id}-m.jpg` },
      genres: [{ name: 'Action' }],
      ...(nodeOverrides ?? {}),
    },
    list_status: {
      status: 'completed',
      score: 8,
      num_episodes_watched: 10,
      num_chapters_read: 99,
      ...(listStatusOverrides ?? {}),
    },
    ...restOverrides,
  };
}

describe('app/api/integrations/mal/sync/route', () => {
  const baseIntegration = {
    user_id: 'user-1',
    provider: 'mal',
    access_token: 'token-old',
    refresh_token: 'refresh-1',
    expires_at: new Date(Date.now() + 3600_000).toISOString(),
    scopes: ['read'],
  };

  beforeEach(() => {
    createRouteHandlerClientMock.mockReset();
    createSupabaseAdminClientMock.mockReset();
    requireAuthMock.mockReset();
    fetchMalListMock.mockReset();
    getMalOAuthConfigMock.mockReset();
    mapMalStatusToBacklogStatusMock.mockReset();
    refreshMalAccessTokenMock.mockReset();
    refreshGenreAffinityMock.mockReset();
    requireAuthMock.mockResolvedValue({ user: { id: 'user-1' } });
    getMalOAuthConfigMock.mockReturnValue({ clientId: 'cid', clientSecret: 'secret' });
    refreshMalAccessTokenMock.mockResolvedValue({
      access_token: 'token-new',
      refresh_token: 'refresh-new',
      expires_in: 3600,
      scope: 'read write',
    });
    mapMalStatusToBacklogStatusMock.mockImplementation((status: string) => `mapped-${status}`);
    fetchMalListMock.mockResolvedValue([]);
    refreshGenreAffinityMock.mockResolvedValue(undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 404 when MAL integration is not connected', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeUserClient({ integrationData: null }));
    createSupabaseAdminClientMock.mockReturnValue(makeAdminClient());

    const res = await POST(new Request('http://localhost/api/integrations/mal/sync'));
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({
      error: 'MAL integration not connected. Connect first from the backlog.',
    });
  });

  it('returns 401 when auth fails with UnauthorizedError', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeUserClient({ integrationData: baseIntegration }),
    );
    createSupabaseAdminClientMock.mockReturnValue(makeAdminClient());
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError('nope'));

    const res = await POST(new Request('http://localhost/api/integrations/mal/sync'));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 500 when integration query fails', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeUserClient({ integrationData: null, integrationError: { message: 'db fail' } }),
    );
    createSupabaseAdminClientMock.mockReturnValue(makeAdminClient());

    const res = await POST(new Request('http://localhost/api/integrations/mal/sync'));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Failed to sync MAL list' });
  });

  it('refreshes expired token for manga and returns zero result on empty list', async () => {
    const expiredIntegration = {
      ...baseIntegration,
      expires_at: new Date(Date.now() - 1000).toISOString(),
    };
    const userClient = makeUserClient({ integrationData: expiredIntegration });
    createRouteHandlerClientMock.mockResolvedValue(userClient);
    createSupabaseAdminClientMock.mockReturnValue(makeAdminClient());
    fetchMalListMock.mockResolvedValueOnce([]);
    refreshMalAccessTokenMock.mockResolvedValueOnce({
      access_token: 'token-new',
      refresh_token: 'refresh-new',
      expires_in: 3600,
      scope: undefined,
    });

    const res = await POST(
      new Request('http://localhost/api/integrations/mal/sync?category=manga'),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      totalFetched: 0,
      mediaInserted: 0,
      mediaUpdated: 0,
      entriesInserted: 0,
      entriesUpdated: 0,
    });
    expect(refreshMalAccessTokenMock).toHaveBeenCalled();
    expect(userClient.spies.refreshUpdate).toHaveBeenCalled();
    expect(fetchMalListMock).toHaveBeenCalledWith('token-new', 'manga');
  });

  it('returns 500 when token is expired and refresh token is missing', async () => {
    const expiredNoRefresh = {
      ...baseIntegration,
      refresh_token: null,
      expires_at: new Date(Date.now() - 1000).toISOString(),
    };
    createRouteHandlerClientMock.mockResolvedValue(
      makeUserClient({ integrationData: expiredNoRefresh }),
    );
    createSupabaseAdminClientMock.mockReturnValue(makeAdminClient());

    const res = await POST(new Request('http://localhost/api/integrations/mal/sync'));
    expect(res.status).toBe(500);
  });

  it('returns 500 when refreshed token cannot be persisted', async () => {
    const expiredIntegration = {
      ...baseIntegration,
      expires_at: new Date(Date.now() - 1000).toISOString(),
    };
    createRouteHandlerClientMock.mockResolvedValue(
      makeUserClient({
        integrationData: expiredIntegration,
        refreshStoreError: { message: 'persist failed' },
      }),
    );
    createSupabaseAdminClientMock.mockReturnValue(makeAdminClient());

    const res = await POST(new Request('http://localhost/api/integrations/mal/sync'));
    expect(res.status).toBe(500);
  });

  it('parses refreshed token scopes from string and trims empty values', async () => {
    const expiredIntegration = {
      ...baseIntegration,
      expires_at: new Date(Date.now() - 1000).toISOString(),
    };
    const userClient = makeUserClient({ integrationData: expiredIntegration });
    createRouteHandlerClientMock.mockResolvedValue(userClient);
    createSupabaseAdminClientMock.mockReturnValue(makeAdminClient());
    refreshMalAccessTokenMock.mockResolvedValueOnce({
      access_token: 'token-new',
      refresh_token: 'refresh-new',
      expires_in: 3600,
      scope: ' read   write  ',
    });
    fetchMalListMock.mockResolvedValueOnce([]);

    const res = await POST(new Request('http://localhost/api/integrations/mal/sync'));
    expect(res.status).toBe(200);
    const refreshPayload = userClient.spies.refreshUpdate.mock.calls[0][0];
    expect(refreshPayload.scopes).toEqual(['read', 'write']);
  });

  it('returns 500 when media query/upsert or entry query fails', async () => {
    const userClient1 = makeUserClient({ integrationData: baseIntegration });
    const adminClient1 = makeAdminClient({ existingMediaError: { message: 'media select fail' } });
    createRouteHandlerClientMock.mockResolvedValueOnce(userClient1);
    createSupabaseAdminClientMock.mockReturnValueOnce(adminClient1);
    fetchMalListMock.mockResolvedValueOnce([makeMalItem(1)]);
    const r1 = await POST(new Request('http://localhost/api/integrations/mal/sync'));
    expect(r1.status).toBe(500);

    const userClient0 = makeUserClient({ integrationData: baseIntegration });
    const adminClient0 = makeAdminClient({ mediaUpsertError: { message: 'upsert fail' } });
    createRouteHandlerClientMock.mockResolvedValueOnce(userClient0);
    createSupabaseAdminClientMock.mockReturnValueOnce(adminClient0);
    fetchMalListMock.mockResolvedValueOnce([makeMalItem(9)]);
    const r0 = await POST(new Request('http://localhost/api/integrations/mal/sync'));
    expect(r0.status).toBe(500);

    const userClient2 = makeUserClient({ integrationData: baseIntegration });
    const adminClient2 = makeAdminClient({ mediaRows: [], mediaUpsertError: null });
    createRouteHandlerClientMock.mockResolvedValueOnce(userClient2);
    createSupabaseAdminClientMock.mockReturnValueOnce(adminClient2);
    fetchMalListMock.mockResolvedValueOnce([makeMalItem(2)]);
    const r2 = await POST(new Request('http://localhost/api/integrations/mal/sync'));
    expect(r2.status).toBe(500);
    await expect(r2.json()).resolves.toEqual({
      error: 'Unable to map MAL items to media records.',
    });

    const userClient3 = makeUserClient({
      integrationData: baseIntegration,
      existingEntriesError: { message: 'entry select fail' },
    });
    const adminClient3 = makeAdminClient({ mediaRows: [{ id: 22, mal_id: 2 }] });
    createRouteHandlerClientMock.mockResolvedValueOnce(userClient3);
    createSupabaseAdminClientMock.mockReturnValueOnce(adminClient3);
    fetchMalListMock.mockResolvedValueOnce([makeMalItem(2)]);
    const r3 = await POST(new Request('http://localhost/api/integrations/mal/sync'));
    expect(r3.status).toBe(500);
  });

  it('returns 500 when user entry insert fails', async () => {
    const userClient = makeUserClient({
      integrationData: baseIntegration,
      existingEntryRows: [],
      entryInsertError: { message: 'insert fail' },
    });
    const adminClient = makeAdminClient({ mediaRows: [{ id: 10, mal_id: 1 }] });
    createRouteHandlerClientMock.mockResolvedValue(userClient);
    createSupabaseAdminClientMock.mockReturnValue(adminClient);
    fetchMalListMock.mockResolvedValueOnce([makeMalItem(1)]);

    const res = await POST(new Request('http://localhost/api/integrations/mal/sync'));
    expect(res.status).toBe(500);
  });

  it('returns sync summary on success with dedupe/skip logic and triggers genre refresh only when inserts exist', async () => {
    const userClient = makeUserClient({
      integrationData: baseIntegration,
      existingEntryRows: [{ media_id: 200 }], // skip one existing entry
    });
    const adminClient = makeAdminClient({
      existingMediaRows: [{ id: 100, mal_id: 1 }],
      mediaRows: [
        { id: 100, mal_id: 1 },
        { id: 200, mal_id: 2 },
      ],
    });
    createRouteHandlerClientMock.mockResolvedValue(userClient);
    createSupabaseAdminClientMock.mockReturnValue(adminClient);
    fetchMalListMock.mockResolvedValueOnce([
      makeMalItem(1, { list_status: { status: 'completed', score: 0, num_episodes_watched: 3 } }),
      makeMalItem(1, { list_status: { status: 'completed', score: 9, num_episodes_watched: 5 } }), // duplicate mal id
      makeMalItem(2, {
        list_status: { status: 'watching', score: Number.NaN, num_episodes_watched: 7 },
      }),
    ]);

    const res = await POST(new Request('http://localhost/api/integrations/mal/sync'));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      totalFetched: 2,
      mediaInserted: 1,
      mediaUpdated: 1,
      entriesInserted: 1,
      entriesSkipped: 1,
    });

    const insertedPayload = userClient.spies.entryInsert.mock.calls[0][0];
    expect(insertedPayload).toHaveLength(1);
    expect(insertedPayload[0]).toEqual(
      expect.objectContaining({
        user_id: 'user-1',
        media_id: 100,
        status: 'mapped-completed',
        import_source: 'mal',
        progress: 5,
        score: 9,
      }),
    );
    expect(refreshGenreAffinityMock).toHaveBeenCalledWith(userClient, 'user-1');
  });

  it('uses manga progress, handles missing media mapping, and skips insert/genre refresh when all entries exist', async () => {
    const userClient = makeUserClient({
      integrationData: baseIntegration,
      existingEntryRows: [{ media_id: 501 }],
    });
    const adminClient = makeAdminClient({
      mediaRows: [{ id: 501, mal_id: 5 }],
    });
    createRouteHandlerClientMock.mockResolvedValue(userClient);
    createSupabaseAdminClientMock.mockReturnValue(adminClient);
    fetchMalListMock.mockResolvedValueOnce([
      makeMalItem(5, {
        node: { start_date: null },
        list_status: { status: 'reading', score: 0, num_chapters_read: 44 },
      }),
      makeMalItem(6, {
        node: { start_date: null },
        list_status: { status: 'reading', score: null, num_chapters_read: 12 },
      }), // media mapping missing -> continue
    ]);

    const res = await POST(
      new Request('http://localhost/api/integrations/mal/sync?category=manga'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.entriesInserted).toBe(0);
    expect(body.entriesSkipped).toBeGreaterThanOrEqual(1);
    expect(userClient.spies.entryInsert).not.toHaveBeenCalled();
    expect(refreshGenreAffinityMock).not.toHaveBeenCalled();
  });

  it('inserts manga entries using chapter progress and omits score when normalized to null', async () => {
    const userClient = makeUserClient({
      integrationData: baseIntegration,
      existingEntryRows: [],
    });
    const adminClient = makeAdminClient({
      mediaRows: [
        { id: 777, mal_id: 77 },
        { id: 888, mal_id: 88 },
      ],
    });
    createRouteHandlerClientMock.mockResolvedValue(userClient);
    createSupabaseAdminClientMock.mockReturnValue(adminClient);
    fetchMalListMock.mockResolvedValueOnce([
      makeMalItem(77, {
        node: { start_date: null },
        list_status: { status: 'reading', score: 0, num_chapters_read: 123 },
      }),
      makeMalItem(88, {
        node: { start_date: null },
        list_status: { status: 'completed', score: 6, num_chapters_read: 321 },
      }),
    ]);

    const res = await POST(
      new Request('http://localhost/api/integrations/mal/sync?category=manga'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();

    const insertedPayload = userClient.spies.entryInsert.mock.calls[0][0];
    expect(insertedPayload).toHaveLength(2);
    expect(insertedPayload[0]).toEqual(
      expect.objectContaining({
        user_id: 'user-1',
        media_id: 777,
        status: 'mapped-reading',
        import_source: 'mal',
        progress: 123,
      }),
    );
    expect(insertedPayload[0]).not.toHaveProperty('score');
    expect(insertedPayload[1]).toEqual(
      expect.objectContaining({
        user_id: 'user-1',
        media_id: 888,
        status: 'mapped-completed',
        import_source: 'mal',
        progress: 321,
        score: 6,
      }),
    );

    expect(body).toEqual(
      expect.objectContaining({
        totalFetched: 2,
        entriesInserted: 2,
      }),
    );
  });

  it('covers sparse anime payload fallbacks and refresh path branches', async () => {
    const refreshableIntegration = {
      ...baseIntegration,
      expires_at: null,
      scopes: null,
    };
    const userClient = makeUserClient({
      integrationData: refreshableIntegration,
      existingEntryRows: null,
    });
    const adminClient = makeAdminClient({
      existingMediaRows: [{ id: 401, mal_id: null }],
      mediaRows: [
        { id: 901, mal_id: 91 },
        { id: 902, mal_id: null },
      ],
    });
    createRouteHandlerClientMock.mockResolvedValue(userClient);
    createSupabaseAdminClientMock.mockReturnValue(adminClient);
    refreshMalAccessTokenMock.mockResolvedValueOnce({
      access_token: 'token-refreshed',
      refresh_token: 'refresh-refreshed',
      expires_in: 3600,
      scope: 'read  write   ',
    });
    fetchMalListMock.mockResolvedValueOnce([
      makeMalItem(91, {
        node: {
          alternative_titles: undefined,
          title: undefined,
          synopsis: undefined,
          media_type: undefined,
          status: undefined,
          num_episodes: undefined,
          start_date: 'abcd-01-01',
          main_picture: undefined,
          genres: undefined,
        },
        list_status: {
          status: 'watching',
          score: 4,
          num_episodes_watched: undefined,
        },
      }),
    ]);

    const res = await POST(new Request('http://localhost/api/integrations/mal/sync'));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({
        totalFetched: 1,
        entriesInserted: 1,
      }),
    );

    const upsertPayload = adminClient.spies.mediaUpsert.mock.calls[0][0];
    expect(upsertPayload[0]).toEqual(
      expect.objectContaining({
        title_english: null,
        title_romaji: null,
        title_native: null,
        description: null,
        format: null,
        status: null,
        season_year: null,
        episodes: null,
        start_date: 'abcd-01-01',
        cover_image_large: null,
        cover_image_medium: null,
      }),
    );

    const insertedPayload = userClient.spies.entryInsert.mock.calls[0][0];
    expect(insertedPayload[0]).toEqual(
      expect.objectContaining({
        media_id: 901,
        progress: 0,
        score: 4,
      }),
    );
  });

  it('covers manga fallbacks for chapters/progress defaults', async () => {
    const userClient = makeUserClient({
      integrationData: baseIntegration,
      existingEntryRows: [],
    });
    const adminClient = makeAdminClient({
      mediaRows: [{ id: 7777, mal_id: 777 }],
    });
    createRouteHandlerClientMock.mockResolvedValue(userClient);
    createSupabaseAdminClientMock.mockReturnValue(adminClient);
    fetchMalListMock.mockResolvedValueOnce([
      makeMalItem(777, {
        node: {
          num_episodes: undefined,
          start_date: undefined,
        },
        list_status: {
          status: 'reading',
          score: 7,
          num_chapters_read: undefined,
        },
      }),
    ]);

    const res = await POST(
      new Request('http://localhost/api/integrations/mal/sync?category=manga'),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({
        totalFetched: 1,
        entriesInserted: 1,
      }),
    );

    const upsertPayload = adminClient.spies.mediaUpsert.mock.calls[0][0];
    expect(upsertPayload[0]).toEqual(
      expect.objectContaining({
        category: 'manga',
        chapters: null,
        start_date: null,
      }),
    );

    const insertedPayload = userClient.spies.entryInsert.mock.calls[0][0];
    expect(insertedPayload[0]).toEqual(
      expect.objectContaining({
        media_id: 7777,
        progress: 0,
        score: 7,
      }),
    );
  });
});
