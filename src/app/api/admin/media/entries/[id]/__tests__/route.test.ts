import 'whatwg-fetch';

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

jest.mock('@/lib/observability/withApiRoute', () => ({
  __esModule: true,
  withApiRoute: (handler: unknown) => handler,
}));

const createRouteHandlerClientMock = jest.fn();
const createSupabaseAdminClientMock = jest.fn();
const requireAdminRoleMock = jest.fn();
const logApplicationEventMock = jest.fn();

jest.mock('@/lib/supabase-route-handler', () => ({
  createRouteHandlerClient: () => createRouteHandlerClientMock(),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => createSupabaseAdminClientMock(),
}));

jest.mock('@/lib/observability/applicationLogger', () => ({
  logApplicationEvent: (...args: unknown[]) => logApplicationEventMock(...args),
}));

jest.mock('@/lib/api/auth', () => ({
  UnauthorizedError: class UnauthorizedError extends Error {
    code = 'UNAUTHORIZED';
  },
}));

jest.mock('@/lib/api/permissions', () => ({
  ForbiddenError: class ForbiddenError extends Error {
    code = 'FORBIDDEN';
  },
  requireAdminRole: (...args: unknown[]) => requireAdminRoleMock(...args),
}));

import { API_ERRORS } from '@/lib/api/errors';
import { UnauthorizedError } from '@/lib/api/auth';
import { ForbiddenError } from '@/lib/api/permissions';
import { PATCH, DELETE, dynamic } from '@/app/api/admin/media/entries/[id]/route';

type PatchResult = { data: unknown; error: unknown };
type DeleteResult = { data: unknown; error: unknown };

type AdminSetup = {
  patchResult?: PatchResult;
  linkedDeleteError?: unknown;
  mediaDeleteResult?: DeleteResult;
};

function makeAdminClient(setup: AdminSetup = {}) {
  const patchResult: PatchResult = setup.patchResult ?? { data: { id: 1 }, error: null };
  const linkedDeleteError = setup.linkedDeleteError ?? null;
  const mediaDeleteResult: DeleteResult = setup.mediaDeleteResult ?? {
    data: { id: 1 },
    error: null,
  };

  const updateMaybeSingle = jest.fn().mockResolvedValue(patchResult);
  const updateSelect = jest.fn().mockReturnValue({ maybeSingle: updateMaybeSingle });
  const updateEq = jest.fn().mockReturnValue({ select: updateSelect });
  const update = jest.fn().mockReturnValue({ eq: updateEq });

  const linkedDeleteEq = jest.fn().mockResolvedValue({ error: linkedDeleteError });
  const linkedDelete = jest.fn().mockReturnValue({ eq: linkedDeleteEq });

  const mediaDeleteMaybeSingle = jest.fn().mockResolvedValue(mediaDeleteResult);
  const mediaDeleteSelect = jest.fn().mockReturnValue({ maybeSingle: mediaDeleteMaybeSingle });
  const mediaDeleteEq = jest.fn().mockReturnValue({ select: mediaDeleteSelect });
  const mediaDelete = jest.fn().mockReturnValue({ eq: mediaDeleteEq });

  const from = jest.fn().mockImplementation((table: string) => {
    if (table === 'media_items') {
      return {
        update,
        delete: mediaDelete,
      };
    }

    if (table === 'user_media_entries') {
      return {
        delete: linkedDelete,
      };
    }

    return {};
  });

  return {
    client: { from },
    spies: {
      from,
      update,
      updateEq,
      updateSelect,
      updateMaybeSingle,
      linkedDelete,
      linkedDeleteEq,
      mediaDelete,
      mediaDeleteEq,
      mediaDeleteSelect,
      mediaDeleteMaybeSingle,
    },
  };
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('app/api/admin/media/entries/[id]/route', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    createRouteHandlerClientMock.mockResolvedValue({ auth: {} });
    requireAdminRoleMock.mockResolvedValue({});
    process.env.NODE_ENV = 'test';
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('exports force-dynamic mode', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  describe('PATCH', () => {
    it('returns bad request for invalid id', async () => {
      const response = await PATCH(
        new Request('https://example.com', { method: 'PATCH' }),
        params('0'),
      );
      expect(response.status).toBe(API_ERRORS.BAD_REQUEST.status);
      await expect(response.json()).resolves.toEqual(API_ERRORS.BAD_REQUEST);
    });

    it('returns bad request when body cannot be parsed', async () => {
      const request = {
        json: jest.fn().mockRejectedValue(new Error('bad json')),
      } as unknown as Request;
      const response = await PATCH(request, params('12'));

      expect(response.status).toBe(API_ERRORS.BAD_REQUEST.status);
      await expect(response.json()).resolves.toEqual(API_ERRORS.BAD_REQUEST);
    });

    it('returns bad request when updates object is missing or empty', async () => {
      const request1 = new Request('https://example.com', {
        method: 'PATCH',
        body: JSON.stringify({}),
      });
      const response1 = await PATCH(request1, params('12'));

      expect(response1.status).toBe(API_ERRORS.BAD_REQUEST.status);

      const request2 = new Request('https://example.com', {
        method: 'PATCH',
        body: JSON.stringify({ updates: { unknown: 'x' } }),
      });
      const response2 = await PATCH(request2, params('12'));

      expect(response2.status).toBe(API_ERRORS.BAD_REQUEST.status);
    });

    it('normalizes updates and returns saved row', async () => {
      const admin = makeAdminClient({
        patchResult: { data: { id: 77, title: 'ok' }, error: null },
      });
      createSupabaseAdminClientMock.mockReturnValue(admin.client);

      const response = await PATCH(
        new Request('https://example.com', {
          method: 'PATCH',
          body: JSON.stringify({
            updates: {
              title: '  New Title  ',
              description: '',
              rawg_id: '123',
              igdb_id: 'abc',
              runtime: undefined,
              platforms: [' PC ', 'PC', '', 5],
              genres: 'not-array',
              status: null,
              steam_app_id: '',
            },
          }),
        }),
        params('77'),
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ data: { id: 77, title: 'ok' } });

      expect(admin.spies.update).toHaveBeenCalledWith({
        title: 'New Title',
        description: null,
        rawg_id: 123,
        igdb_id: null,
        platforms: ['PC'],
        genres: null,
        status: null,
        steam_app_id: null,
      });
      expect(admin.spies.updateEq).toHaveBeenCalledWith('id', 77);
      expect(admin.spies.updateSelect).toHaveBeenCalled();
    });

    it('returns duplicate igdb conflict with specific code and logs event', async () => {
      const admin = makeAdminClient({
        patchResult: {
          data: null,
          error: {
            code: '23505',
            message: 'violates media_items_igdb_category_uq',
            details: 'Key (igdb_id, category) already exists',
            hint: 'remove duplicate',
          },
        },
      });
      createSupabaseAdminClientMock.mockReturnValue(admin.client);

      const response = await PATCH(
        new Request('https://example.com', {
          method: 'PATCH',
          body: JSON.stringify({ updates: { igdb_id: 999 } }),
        }),
        params('91'),
      );

      expect(response.status).toBe(409);
      await expect(response.json()).resolves.toEqual({
        error:
          'Duplicate IGDB entry: this IGDB ID already exists for games. Delete one duplicate row (or clear igdb_id) and try again.',
        code: 'CONFLICT_DUPLICATE_IGDB',
      });
      expect(logApplicationEventMock).toHaveBeenCalledTimes(1);
    });

    it('returns generic duplicate conflict for 23505 without igdb constraint', async () => {
      const admin = makeAdminClient({
        patchResult: {
          data: null,
          error: { code: '23505', message: 'duplicate key value', details: 'other unique key' },
        },
      });
      createSupabaseAdminClientMock.mockReturnValue(admin.client);

      const response = await PATCH(
        new Request('https://example.com', {
          method: 'PATCH',
          body: JSON.stringify({ updates: { title: 'x' } }),
        }),
        params('4'),
      );

      expect(response.status).toBe(409);
      await expect(response.json()).resolves.toEqual({
        error: 'Duplicate value conflict while saving row 4.',
        code: 'CONFLICT',
      });
    });

    it('maps every editable key in a single update payload', async () => {
      const admin = makeAdminClient({ patchResult: { data: { id: 55 }, error: null } });
      createSupabaseAdminClientMock.mockReturnValue(admin.client);

      const response = await PATCH(
        new Request('https://example.com', {
          method: 'PATCH',
          body: JSON.stringify({
            updates: {
              source: '  mal  ',
              rawg_id: '1',
              igdb_id: '2',
              igdb_slug: '  slug  ',
              title: '  t  ',
              title_english: '  te  ',
              title_romaji: '  tr  ',
              title_native: '  tn  ',
              description: '  d  ',
              summary: '  s  ',
              storyline: '  st  ',
              cover_image_id: '  c1  ',
              cover_url_thumb: '  ct  ',
              cover_url_big: '  cb  ',
              cover_image_large: '  cl  ',
              cover_image_medium: '  cm  ',
              format: '  tv  ',
              status: '  released  ',
              season_year: '2024',
              episodes: '24',
              start_date: '  2024-01-01  ',
              end_date: '  2024-12-31  ',
              first_release_date: '  2024-01-15  ',
              release_date: '  2024-01-20  ',
              rating: '8.5',
              rating_count: '100',
              aggregated_rating: '7.7',
              aggregated_rating_count: '80',
              metacritic: '90',
              platforms: ['PC', 'PC', ' Switch '],
              genres: ['RPG', ' RPG '],
              igdb_themes: ['', ' '],
              igdb_game_modes: ['Single-player', ' Single-player '],
              igdb_player_perspectives: ['Third person'],
              igdb_artwork_image_ids: ['a1', 'a1'],
              igdb_screenshot_image_ids: ['s1', ' s2 '],
              official_website: '  https://example.com  ',
              developer: '  Dev  ',
              publisher: '  Pub  ',
              esrb_rating: '  T  ',
              runtime: '120',
              steam_app_id: '999',
            },
          }),
        }),
        params('55'),
      );

      expect(response.status).toBe(200);
      const updatesArg = admin.spies.update.mock.calls[0][0] as Record<string, unknown>;
      expect(Object.keys(updatesArg)).toHaveLength(42);
      expect(updatesArg.runtime).toBe(120);
      expect(updatesArg.platforms).toEqual(['PC', 'Switch']);
      expect(updatesArg.igdb_themes).toEqual([]);
    });

    it('returns bad input for 22P02 and forbidden for 42501', async () => {
      const adminBadInput = makeAdminClient({
        patchResult: { data: null, error: { code: '22P02', message: '' } },
      });
      createSupabaseAdminClientMock.mockReturnValueOnce(adminBadInput.client);

      const r1 = await PATCH(
        new Request('https://example.com', {
          method: 'PATCH',
          body: JSON.stringify({ updates: { rating: 'bad' } }),
        }),
        params('1'),
      );
      expect(r1.status).toBe(400);
      await expect(r1.json()).resolves.toEqual({
        error: 'Invalid value type in updates payload.',
        code: 'BAD_INPUT',
      });

      const adminForbidden = makeAdminClient({
        patchResult: { data: null, error: { code: '42501', message: 'forbidden' } },
      });
      createSupabaseAdminClientMock.mockReturnValueOnce(adminForbidden.client);

      const r2 = await PATCH(
        new Request('https://example.com', {
          method: 'PATCH',
          body: JSON.stringify({ updates: { title: 'x' } }),
        }),
        params('1'),
      );
      expect(r2.status).toBe(API_ERRORS.FORBIDDEN.status);
      await expect(r2.json()).resolves.toEqual(API_ERRORS.FORBIDDEN);
    });

    it('logs duplicate errors with nullable metadata fields', async () => {
      const admin = makeAdminClient({
        patchResult: {
          data: null,
          error: { code: '23505' },
        },
      });
      createSupabaseAdminClientMock.mockReturnValue(admin.client);

      const response = await PATCH(
        new Request('https://example.com', {
          method: 'PATCH',
          body: JSON.stringify({ updates: { title: 'x' } }),
        }),
        params('13'),
      );

      expect(response.status).toBe(409);
      await expect(response.json()).resolves.toEqual({
        error: 'Duplicate value conflict while saving row 13.',
        code: 'CONFLICT',
      });
      expect(logApplicationEventMock).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            code: '23505',
            message: null,
            details: null,
            hint: null,
          }),
        }),
      );
    });

    it('returns detailed internal error in development and generic in non-development', async () => {
      process.env.NODE_ENV = 'development';
      const adminDev = makeAdminClient({
        patchResult: { data: null, error: { foo: 'bar' } },
      });
      createSupabaseAdminClientMock.mockReturnValueOnce(adminDev.client);

      const rDev = await PATCH(
        new Request('https://example.com', {
          method: 'PATCH',
          body: JSON.stringify({ updates: { title: 'x' } }),
        }),
        params('2'),
      );
      expect(rDev.status).toBe(API_ERRORS.INTERNAL.status);
      await expect(rDev.json()).resolves.toEqual({
        error: API_ERRORS.INTERNAL.error,
        code: API_ERRORS.INTERNAL.code,
      });

      process.env.NODE_ENV = 'test';
      const adminProd = makeAdminClient({
        patchResult: { data: null, error: { code: 'XX000', message: 'db exploded' } },
      });
      createSupabaseAdminClientMock.mockReturnValueOnce(adminProd.client);

      const rProd = await PATCH(
        new Request('https://example.com', {
          method: 'PATCH',
          body: JSON.stringify({ updates: { title: 'x' } }),
        }),
        params('2'),
      );
      expect(rProd.status).toBe(API_ERRORS.INTERNAL.status);
      await expect(rProd.json()).resolves.toEqual(API_ERRORS.INTERNAL);
    });

    it('handles non-object db error shape in development mode', async () => {
      process.env.NODE_ENV = 'development';
      const admin = makeAdminClient({
        patchResult: { data: null, error: 'raw-error-string' },
      });
      createSupabaseAdminClientMock.mockReturnValue(admin.client);

      const response = await PATCH(
        new Request('https://example.com', {
          method: 'PATCH',
          body: JSON.stringify({ updates: { title: 'x' } }),
        }),
        params('7'),
      );

      expect(response.status).toBe(API_ERRORS.INTERNAL.status);
      await expect(response.json()).resolves.toEqual({
        error: API_ERRORS.INTERNAL.error,
        code: API_ERRORS.INTERNAL.code,
      });
    });

    it('returns db error details in development when available', async () => {
      process.env.NODE_ENV = 'development';
      const admin = makeAdminClient({
        patchResult: { data: null, error: { code: 'P0001', message: 'dev-visible' } },
      });
      createSupabaseAdminClientMock.mockReturnValue(admin.client);

      const response = await PATCH(
        new Request('https://example.com', {
          method: 'PATCH',
          body: JSON.stringify({ updates: { title: 'x' } }),
        }),
        params('7'),
      );

      expect(response.status).toBe(API_ERRORS.INTERNAL.status);
      await expect(response.json()).resolves.toEqual({
        error: 'dev-visible',
        code: 'P0001',
      });
    });

    it('returns not found when update returns no data', async () => {
      const admin = makeAdminClient({ patchResult: { data: null, error: null } });
      createSupabaseAdminClientMock.mockReturnValue(admin.client);

      const response = await PATCH(
        new Request('https://example.com', {
          method: 'PATCH',
          body: JSON.stringify({ updates: { title: 'x' } }),
        }),
        params('9'),
      );

      expect(response.status).toBe(API_ERRORS.NOT_FOUND.status);
      await expect(response.json()).resolves.toEqual(API_ERRORS.NOT_FOUND);
    });

    it('maps Unauthorized/Forbidden/unknown exceptions in catch', async () => {
      createRouteHandlerClientMock.mockRejectedValueOnce(new UnauthorizedError());
      const r1 = await PATCH(new Request('https://example.com', { method: 'PATCH' }), params('1'));
      expect(r1.status).toBe(API_ERRORS.UNAUTHORIZED.status);

      createRouteHandlerClientMock.mockRejectedValueOnce(new ForbiddenError());
      const r2 = await PATCH(new Request('https://example.com', { method: 'PATCH' }), params('1'));
      expect(r2.status).toBe(API_ERRORS.FORBIDDEN.status);

      createRouteHandlerClientMock.mockRejectedValueOnce(new Error('boom'));
      const r3 = await PATCH(new Request('https://example.com', { method: 'PATCH' }), params('1'));
      expect(r3.status).toBe(API_ERRORS.INTERNAL.status);
    });
  });

  describe('DELETE', () => {
    it('returns bad request for invalid id', async () => {
      const response = await DELETE(
        new Request('https://example.com', { method: 'DELETE' }),
        params('x'),
      );
      expect(response.status).toBe(API_ERRORS.BAD_REQUEST.status);
      await expect(response.json()).resolves.toEqual(API_ERRORS.BAD_REQUEST);
    });

    it('returns internal when deleting linked rows fails', async () => {
      const admin = makeAdminClient({ linkedDeleteError: { message: 'linked fail' } });
      createSupabaseAdminClientMock.mockReturnValue(admin.client);

      const response = await DELETE(
        new Request('https://example.com', { method: 'DELETE' }),
        params('10'),
      );
      expect(response.status).toBe(API_ERRORS.INTERNAL.status);
      await expect(response.json()).resolves.toEqual(API_ERRORS.INTERNAL);
    });

    it('returns internal when media delete fails', async () => {
      const admin = makeAdminClient({
        mediaDeleteResult: { data: null, error: { message: 'delete fail' } },
      });
      createSupabaseAdminClientMock.mockReturnValue(admin.client);

      const response = await DELETE(
        new Request('https://example.com', { method: 'DELETE' }),
        params('10'),
      );
      expect(response.status).toBe(API_ERRORS.INTERNAL.status);
      await expect(response.json()).resolves.toEqual(API_ERRORS.INTERNAL);
    });

    it('returns not found when media row does not exist', async () => {
      const admin = makeAdminClient({ mediaDeleteResult: { data: null, error: null } });
      createSupabaseAdminClientMock.mockReturnValue(admin.client);

      const response = await DELETE(
        new Request('https://example.com', { method: 'DELETE' }),
        params('10'),
      );
      expect(response.status).toBe(API_ERRORS.NOT_FOUND.status);
      await expect(response.json()).resolves.toEqual(API_ERRORS.NOT_FOUND);
    });

    it('returns ok with deleted id when delete succeeds', async () => {
      const admin = makeAdminClient({ mediaDeleteResult: { data: { id: 10 }, error: null } });
      createSupabaseAdminClientMock.mockReturnValue(admin.client);

      const response = await DELETE(
        new Request('https://example.com', { method: 'DELETE' }),
        params('10'),
      );
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ data: { id: 10 } });

      expect(admin.spies.linkedDeleteEq).toHaveBeenCalledWith('media_id', 10);
      expect(admin.spies.mediaDeleteEq).toHaveBeenCalledWith('id', 10);
    });

    it('maps Unauthorized/Forbidden/unknown exceptions in delete catch', async () => {
      createRouteHandlerClientMock.mockRejectedValueOnce(new UnauthorizedError());
      const r1 = await DELETE(
        new Request('https://example.com', { method: 'DELETE' }),
        params('1'),
      );
      expect(r1.status).toBe(API_ERRORS.UNAUTHORIZED.status);

      createRouteHandlerClientMock.mockRejectedValueOnce(new ForbiddenError());
      const r2 = await DELETE(
        new Request('https://example.com', { method: 'DELETE' }),
        params('1'),
      );
      expect(r2.status).toBe(API_ERRORS.FORBIDDEN.status);

      createRouteHandlerClientMock.mockRejectedValueOnce(new Error('boom'));
      const r3 = await DELETE(
        new Request('https://example.com', { method: 'DELETE' }),
        params('1'),
      );
      expect(r3.status).toBe(API_ERRORS.INTERNAL.status);
    });
  });
});
