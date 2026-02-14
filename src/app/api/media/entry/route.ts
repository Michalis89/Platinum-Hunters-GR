import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/observability/withApiRoute';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { hasAnyRole } from '@/lib/roles';
import { isMediaCategory, type MediaStatus } from '@/app/components/backlog/types';
import type { MediaEntryState } from '@/lib/media/types';
import { fetchRawgGameDetails, searchRawgGames } from '@/lib/services/rawgService';

type UpdateMediaEntryBody =
  | {
      action: 'update_description';
      category: string;
      mediaId: number;
      description: string;
    }
  | {
      action: 'sync_rawg_metadata';
      category: string;
      mediaId: number;
    }
  | {
      action: 'preview_rawg_metadata';
      category: string;
      mediaId: number;
    };

function normalizeForMatch(value?: string | null): string {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .trim();
}

function mergePlatforms(rawgPlatforms: string[] | null | undefined, forcePc: boolean): string[] {
  const ordered = [forcePc ? 'PC' : null, ...(rawgPlatforms ?? [])].filter(Boolean) as string[];
  return Array.from(new Set(ordered));
}

type RawgMetadataPreview = {
  source: string;
  rawg_id: number;
  title: string | null;
  title_english: string | null;
  description: string | null;
  cover_image_large: string | null;
  cover_image_medium: string | null;
  season_year: number | null;
  release_date: string | null;
  rating: number | null;
  metacritic: number | null;
  platforms: string[];
  genres: string[];
  developer: string | null;
  publisher: string | null;
  esrb_rating: string | null;
  runtime: number | null;
  steam_app_id: number | null;
};

async function buildRawgMetadataPatch(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  mediaId: number,
): Promise<{ patch: RawgMetadataPreview; rawgId: number }> {
  const { data: media, error: mediaError } = await admin
    .from('media_items')
    .select('id,title,title_english,rawg_id,steam_app_id,category')
    .eq('id', mediaId)
    .eq('category', 'games')
    .maybeSingle();

  if (mediaError) throw mediaError;
  if (!media) {
    throw new Error('GAME_NOT_FOUND');
  }

  let rawgId = media.rawg_id ?? null;
  if (!rawgId) {
    const query = media.title_english || media.title || '';
    const key = normalizeForMatch(query);
    if (!key) {
      throw new Error('RAWG_ID_NOT_RESOLVED');
    }
    const candidates = await searchRawgGames(query, 8);
    const matched =
      candidates.find(candidate => normalizeForMatch(candidate.name) === key) ??
      candidates[0] ??
      null;
    rawgId = matched?.id ?? null;
  }

  if (!rawgId) {
    throw new Error('RAWG_MATCH_NOT_FOUND');
  }

  const rawg = await fetchRawgGameDetails(rawgId);
  if (!rawg) {
    throw new Error('RAWG_DETAILS_FAILED');
  }

  const rawgPlatforms = rawg.platforms?.map(item => item.platform.name) ?? [];
  const patch: RawgMetadataPreview = {
    source: 'rawg',
    rawg_id: rawg.id,
    title: rawg.name ?? media.title ?? media.title_english,
    title_english: rawg.name ?? media.title_english ?? media.title,
    description: rawg.description_raw ?? null,
    cover_image_large: rawg.background_image ?? null,
    cover_image_medium: rawg.background_image ?? null,
    season_year: rawg.released ? Number.parseInt(rawg.released.slice(0, 4), 10) || null : null,
    release_date: rawg.released ?? null,
    rating: rawg.rating ?? null,
    metacritic: rawg.metacritic ?? null,
    platforms: mergePlatforms(rawgPlatforms, Boolean(media.steam_app_id)),
    genres: rawg.genres?.map(item => item.name) ?? [],
    developer: rawg.developers?.[0]?.name ?? null,
    publisher: rawg.publishers?.[0]?.name ?? null,
    esrb_rating: rawg.esrb_rating?.name ?? null,
    runtime: rawg.playtime ?? null,
    steam_app_id: media.steam_app_id ?? null,
  };

  return { patch, rawgId: rawg.id };
}

async function assertPrivilegedUser(userId: string) {
  const supabase = await createRouteHandlerClient();
  const { data: userRow, error } = await supabase
    .from('users')
    .select('role,roles')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!userRow || !hasAnyRole(userRow, ['admin', 'owner', 'moderator'])) {
    throw new Error('FORBIDDEN');
  }
}

async function GETHandler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const mediaIdRaw = searchParams.get('mediaId');

    if (!category || !mediaIdRaw || !isMediaCategory(category)) {
      return NextResponse.json({ error: 'Invalid category or mediaId' }, { status: 400 });
    }

    const mediaId = Number(mediaIdRaw);
    if (!Number.isFinite(mediaId)) {
      return NextResponse.json({ error: 'Invalid mediaId' }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);

    const { data, error } = await supabase
      .from('user_media_entries')
      .select(
        'id,media_id,status,is_favorite,score,progress,notes,selected_platform,created_at,updated_at,media_items!inner(category)',
      )
      .eq('user_id', session.user.id)
      .eq('media_id', mediaId)
      .eq('media_items.category', category)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ entry: null });

    const status = (data.status as MediaStatus) ?? 'planned';
    const entry: MediaEntryState = {
      entryId: data.id,
      mediaId: data.media_id,
      status,
      favorite: data.is_favorite ?? false,
      rating: data.score ?? null,
      progress: data.progress ?? null,
      notes: data.notes ?? null,
      selectedPlatform: data.selected_platform ?? null,
      startedAt: data.created_at ?? null,
      completedAt: data.updated_at ?? null,
    };

    return NextResponse.json({ entry });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Media entry fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function PATCHHandler(req: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);
    await assertPrivilegedUser(session.user.id);

    const body = (await req.json()) as UpdateMediaEntryBody;
    if (!body?.category || !body?.mediaId || !isMediaCategory(body.category)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const mediaId = Number(body.mediaId);
    if (!Number.isFinite(mediaId) || mediaId <= 0) {
      return NextResponse.json({ error: 'Invalid mediaId' }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();

    if (body.action === 'update_description') {
      const description = (body.description ?? '').trim();
      const { data, error } = await admin
        .from('media_items')
        .update({ description: description || null })
        .eq('id', mediaId)
        .eq('category', body.category)
        .select('id,description')
        .maybeSingle();

      if (error) throw error;
      if (!data) return NextResponse.json({ error: 'Media not found' }, { status: 404 });

      return NextResponse.json({ success: true, mediaId, description: data.description ?? '' });
    }

    if (body.action === 'sync_rawg_metadata' || body.action === 'preview_rawg_metadata') {
      if (body.category !== 'games') {
        return NextResponse.json(
          { error: 'RAWG metadata sync is only available for games' },
          { status: 400 },
        );
      }

      let patch: RawgMetadataPreview;
      try {
        const resolved = await buildRawgMetadataPatch(admin, mediaId);
        patch = resolved.patch;
      } catch (resolveError) {
        if (resolveError instanceof Error) {
          if (resolveError.message === 'GAME_NOT_FOUND') {
            return NextResponse.json({ error: 'Game not found' }, { status: 404 });
          }
          if (resolveError.message === 'RAWG_ID_NOT_RESOLVED') {
            return NextResponse.json(
              { error: 'Unable to resolve RAWG ID for this title' },
              { status: 404 },
            );
          }
          if (resolveError.message === 'RAWG_MATCH_NOT_FOUND') {
            return NextResponse.json({ error: 'RAWG match not found' }, { status: 404 });
          }
          if (resolveError.message === 'RAWG_DETAILS_FAILED') {
            return NextResponse.json({ error: 'RAWG details fetch failed' }, { status: 502 });
          }
        }
        throw resolveError;
      }

      if (body.action === 'preview_rawg_metadata') {
        return NextResponse.json({
          success: true,
          mediaId,
          rawgId: patch.rawg_id,
          patch,
          description: patch.description ?? '',
        });
      }

      const { data: updated, error: updateError } = await admin
        .from('media_items')
        .update(patch)
        .eq('id', mediaId)
        .eq('category', 'games')
        .select('id,rawg_id,description')
        .single();

      if (updateError) throw updateError;

      return NextResponse.json({
        success: true,
        mediaId,
        rawgId: updated.rawg_id,
        description: updated.description ?? '',
      });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Media entry patch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withApiRoute(GETHandler);
export const PATCH = withApiRoute(PATCHHandler);
