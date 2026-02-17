import { withApiRoute } from '@/lib/observability/withApiRoute';

import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { API_ERRORS } from '@/lib/api/errors';
import { fail, ok } from '@/lib/api/response';
import { UnauthorizedError } from '@/lib/api/auth';
import { ForbiddenError, requireAdminRole } from '@/lib/api/permissions';
import { logApplicationEvent } from '@/lib/observability/applicationLogger';

const EDITABLE_KEYS = new Set([
  'source',
  'rawg_id',
  'igdb_id',
  'igdb_slug',
  'title',
  'title_english',
  'title_romaji',
  'title_native',
  'description',
  'summary',
  'storyline',
  'cover_image_id',
  'cover_url_thumb',
  'cover_url_big',
  'cover_image_large',
  'cover_image_medium',
  'format',
  'status',
  'season_year',
  'episodes',
  'start_date',
  'end_date',
  'first_release_date',
  'release_date',
  'rating',
  'rating_count',
  'aggregated_rating',
  'aggregated_rating_count',
  'metacritic',
  'platforms',
  'genres',
  'igdb_themes',
  'igdb_game_modes',
  'igdb_player_perspectives',
  'igdb_artwork_image_ids',
  'igdb_screenshot_image_ids',
  'official_website',
  'developer',
  'publisher',
  'esrb_rating',
  'runtime',
  'steam_app_id',
]);

function normalizeText(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeNumber(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const cleaned = value.map(item => (typeof item === 'string' ? item.trim() : '')).filter(Boolean);
  return cleaned.length > 0 ? Array.from(new Set(cleaned)) : [];
}

function formatDbError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return null;
  }
  const maybe = error as { code?: string; message?: string; details?: string; hint?: string };
  if (!maybe.code && !maybe.message) {
    return null;
  }
  return maybe;
}

async function PATCHHandler(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createRouteHandlerClient();
    await requireAdminRole(supabase);
    const admin = createSupabaseAdminClient();

    const { id: idParam } = await context.params;
    const mediaId = Number.parseInt(idParam, 10);
    if (!Number.isFinite(mediaId) || mediaId <= 0) {
      return fail(API_ERRORS.BAD_REQUEST, API_ERRORS.BAD_REQUEST.status);
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const input = body?.updates;
    if (!input || typeof input !== 'object') {
      return fail(API_ERRORS.BAD_REQUEST, API_ERRORS.BAD_REQUEST.status);
    }

    const updates: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(input)) {
      if (!EDITABLE_KEYS.has(key)) {
        continue;
      }

      switch (key) {
        case 'source':
          updates.source = normalizeText(value);
          break;
        case 'rawg_id':
          updates.rawg_id = normalizeNumber(value);
          break;
        case 'igdb_id':
          updates.igdb_id = normalizeNumber(value);
          break;
        case 'igdb_slug':
          updates.igdb_slug = normalizeText(value);
          break;
        case 'title':
          updates.title = normalizeText(value);
          break;
        case 'title_english':
          updates.title_english = normalizeText(value);
          break;
        case 'title_romaji':
          updates.title_romaji = normalizeText(value);
          break;
        case 'title_native':
          updates.title_native = normalizeText(value);
          break;
        case 'description':
          updates.description = normalizeText(value);
          break;
        case 'summary':
          updates.summary = normalizeText(value);
          break;
        case 'storyline':
          updates.storyline = normalizeText(value);
          break;
        case 'cover_image_id':
          updates.cover_image_id = normalizeText(value);
          break;
        case 'cover_url_thumb':
          updates.cover_url_thumb = normalizeText(value);
          break;
        case 'cover_url_big':
          updates.cover_url_big = normalizeText(value);
          break;
        case 'cover_image_large':
          updates.cover_image_large = normalizeText(value);
          break;
        case 'cover_image_medium':
          updates.cover_image_medium = normalizeText(value);
          break;
        case 'format':
          updates.format = normalizeText(value);
          break;
        case 'status':
          updates.status = normalizeText(value);
          break;
        case 'season_year':
          updates.season_year = normalizeNumber(value);
          break;
        case 'episodes':
          updates.episodes = normalizeNumber(value);
          break;
        case 'start_date':
          updates.start_date = normalizeText(value);
          break;
        case 'end_date':
          updates.end_date = normalizeText(value);
          break;
        case 'first_release_date':
          updates.first_release_date = normalizeText(value);
          break;
        case 'release_date':
          updates.release_date = normalizeText(value);
          break;
        case 'rating':
          updates.rating = normalizeNumber(value);
          break;
        case 'rating_count':
          updates.rating_count = normalizeNumber(value);
          break;
        case 'aggregated_rating':
          updates.aggregated_rating = normalizeNumber(value);
          break;
        case 'aggregated_rating_count':
          updates.aggregated_rating_count = normalizeNumber(value);
          break;
        case 'metacritic':
          updates.metacritic = normalizeNumber(value);
          break;
        case 'platforms':
          updates.platforms = normalizeStringArray(value);
          break;
        case 'genres':
          updates.genres = normalizeStringArray(value);
          break;
        case 'igdb_themes':
          updates.igdb_themes = normalizeStringArray(value);
          break;
        case 'igdb_game_modes':
          updates.igdb_game_modes = normalizeStringArray(value);
          break;
        case 'igdb_player_perspectives':
          updates.igdb_player_perspectives = normalizeStringArray(value);
          break;
        case 'igdb_artwork_image_ids':
          updates.igdb_artwork_image_ids = normalizeStringArray(value);
          break;
        case 'igdb_screenshot_image_ids':
          updates.igdb_screenshot_image_ids = normalizeStringArray(value);
          break;
        case 'official_website':
          updates.official_website = normalizeText(value);
          break;
        case 'developer':
          updates.developer = normalizeText(value);
          break;
        case 'publisher':
          updates.publisher = normalizeText(value);
          break;
        case 'esrb_rating':
          updates.esrb_rating = normalizeText(value);
          break;
        case 'runtime':
          updates.runtime = normalizeNumber(value);
          break;
        case 'steam_app_id':
          updates.steam_app_id = normalizeNumber(value);
          break;
        default:
          break;
      }
    }

    if (Object.keys(updates).length === 0) {
      return fail(API_ERRORS.BAD_REQUEST, API_ERRORS.BAD_REQUEST.status);
    }

    const { data, error } = await admin
      .from('media_items')
      .update(updates as never)
      .eq('id', mediaId)
      .select(
        'id,mal_id,category,source,title,title_english,title_romaji,title_native,description,summary,storyline,format,status,season_year,episodes,start_date,end_date,first_release_date,release_date,runtime,rating,rating_count,aggregated_rating,aggregated_rating_count,metacritic,esrb_rating,rawg_id,igdb_id,igdb_category,igdb_slug,steam_app_id,developer,publisher,platforms,genres,igdb_themes,igdb_game_modes,igdb_player_perspectives,igdb_artwork_image_ids,igdb_screenshot_image_ids,official_website,cover_image_id,cover_url_thumb,cover_url_big,cover_image_large,cover_image_medium,igdb_updated_at,updated_at',
      )
      .maybeSingle();

    if (error) {
      console.error('Admin media entry update error:', error);
      const dbError = formatDbError(error);
      if (dbError?.code === '23505') {
        const duplicateIgdbConstraint =
          dbError.details?.includes('(igdb_id, category)') ||
          dbError.message?.includes('media_items_igdb_category_uq');

        await logApplicationEvent({
          level: 'error',
          source: 'api/admin/media/entries/[id]',
          message: duplicateIgdbConstraint
            ? 'Duplicate IGDB/category conflict on media update'
            : `Duplicate value conflict while saving row ${mediaId}`,
          path: `/api/admin/media/entries/${mediaId}`,
          method: 'PATCH',
          status: 409,
          details: {
            mediaId,
            code: dbError.code ?? null,
            message: dbError.message ?? null,
            details: dbError.details ?? null,
            hint: dbError.hint ?? null,
          },
        });

        return fail(
          duplicateIgdbConstraint
            ? {
                error:
                  'Duplicate IGDB entry: this IGDB ID already exists for games. Delete one duplicate row (or clear igdb_id) and try again.',
                code: 'CONFLICT_DUPLICATE_IGDB',
              }
            : {
                error: `Duplicate value conflict while saving row ${mediaId}.`,
                code: 'CONFLICT',
              },
          409,
        );
      }
      if (dbError?.code === '22P02') {
        return fail(
          {
            error: dbError.message || 'Invalid value type in updates payload.',
            code: 'BAD_INPUT',
          },
          400,
        );
      }
      if (dbError?.code === '42501') {
        return fail(API_ERRORS.FORBIDDEN, API_ERRORS.FORBIDDEN.status);
      }

      if (process.env.NODE_ENV === 'development') {
        return fail(
          {
            error: dbError?.message || API_ERRORS.INTERNAL.error,
            code: dbError?.code || API_ERRORS.INTERNAL.code,
          },
          API_ERRORS.INTERNAL.status,
        );
      }
      return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    }
    if (!data) {
      return fail(API_ERRORS.NOT_FOUND, API_ERRORS.NOT_FOUND.status);
    }

    return ok(data);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    if (error instanceof ForbiddenError) {
      return fail(API_ERRORS.FORBIDDEN, API_ERRORS.FORBIDDEN.status);
    }
    console.error('Admin media entry update error:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

export const dynamic = 'force-dynamic';

export const PATCH = withApiRoute(PATCHHandler);

async function DELETEHandler(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createRouteHandlerClient();
    await requireAdminRole(supabase);
    const admin = createSupabaseAdminClient();

    const { id: idParam } = await context.params;
    const mediaId = Number.parseInt(idParam, 10);
    if (!Number.isFinite(mediaId) || mediaId <= 0) {
      return fail(API_ERRORS.BAD_REQUEST, API_ERRORS.BAD_REQUEST.status);
    }

    const { error: linkedEntriesError } = await admin
      .from('user_media_entries')
      .delete()
      .eq('media_id', mediaId);

    if (linkedEntriesError) {
      console.error('Admin media entry delete linked rows error:', linkedEntriesError);
      return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    }

    const { data, error } = await admin
      .from('media_items')
      .delete()
      .eq('id', mediaId)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('Admin media entry delete error:', error);
      return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    }

    if (!data) {
      return fail(API_ERRORS.NOT_FOUND, API_ERRORS.NOT_FOUND.status);
    }

    return ok({ id: mediaId });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    if (error instanceof ForbiddenError) {
      return fail(API_ERRORS.FORBIDDEN, API_ERRORS.FORBIDDEN.status);
    }
    console.error('Admin media entry delete error:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

export const DELETE = withApiRoute(DELETEHandler);
