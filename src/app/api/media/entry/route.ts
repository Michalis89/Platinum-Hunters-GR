import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/observability/withApiRoute';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { hasAnyRole } from '@/lib/roles';
import { isMediaCategory, type MediaStatus } from '@/app/components/backlog/types';
import type { MediaEntryState } from '@/lib/media/types';
import {
  fetchIgdbGameDetails,
  findIgdbGameIdBySteamAppId,
  mapIgdbToPayload,
  searchIgdbGames,
  searchIgdbGamesWithoutCategoryFilter,
} from '@/lib/services/igdbService';
import { isAllowedIgdbGameCandidate, isAllowedIgdbCategory } from '@/lib/igdb/categories';

type SyncAction = 'sync_igdb_metadata' | 'preview_igdb_metadata' | 'apply_igdb_metadata_patch';

type UpdateMediaEntryBody =
  | {
      action: 'update_description';
      category: string;
      mediaId: number;
      description: string;
    }
  | {
      action: SyncAction;
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

function tokenize(value?: string | null): string[] {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function buildIgdbSearchQueries(value: string): string[] {
  const base = value.trim();
  if (!base) return [];
  const beforeColon = base.split(':')[0]?.trim() ?? '';
  const withoutParens = base
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const queries = [base, withoutParens, beforeColon].filter(Boolean);
  return Array.from(new Set(queries));
}

function selectBestCandidate<T extends { name?: string | null }>(
  query: string,
  candidates: T[],
): T | null {
  if (candidates.length === 0) return null;
  const key = normalizeForMatch(query);
  const exact = candidates.find(candidate => normalizeForMatch(candidate.name) === key);
  if (exact) return exact;

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return candidates[0] ?? null;
  const queryTokenSet = new Set(queryTokens);

  let best: { candidate: T; score: number } | null = null;
  for (const candidate of candidates) {
    const candidateTokens = tokenize(candidate.name);
    if (candidateTokens.length === 0) continue;
    const overlap = candidateTokens.filter(token => queryTokenSet.has(token)).length;
    if (overlap === 0) continue;
    const score =
      overlap / Math.max(queryTokens.length, 1) + overlap / Math.max(candidateTokens.length, 1);
    if (!best || score > best.score) {
      best = { candidate, score };
    }
  }

  return best?.candidate ?? candidates[0] ?? null;
}

async function resolveIgdbPatch(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  mediaId: number,
) {
  const { data: media, error: mediaError } = await admin
    // Supabase generated types may lag behind recent migrations.
    // Use runtime-safe mapping here to avoid compile-time schema drift issues.
    .from('media_items')
    .select('id,title,title_english,igdb_id,igdb_category,igdb_slug,steam_app_id,source,category')
    .eq('id', mediaId)
    .eq('category', 'games')
    .maybeSingle();
  const typedMedia = media as {
    id: number;
    title: string | null;
    title_english: string | null;
    igdb_id: number | null;
    igdb_category: number | null;
    igdb_slug: string | null;
    steam_app_id: number | null;
    source: string | null;
    category: string;
  } | null;

  if (mediaError) throw mediaError;
  if (!typedMedia) throw new Error('GAME_NOT_FOUND');
  if (
    (typeof typedMedia.igdb_category === 'number' &&
      !isAllowedIgdbCategory(typedMedia.igdb_category)) ||
    !isAllowedIgdbGameCandidate({
      category: typedMedia.igdb_category,
      name: typedMedia.title_english || typedMedia.title,
      slug: typedMedia.igdb_slug,
    })
  ) {
    throw new Error('IGDB_UNSUPPORTED_CATEGORY');
  }

  let igdbId = typedMedia.igdb_id ?? null;
  if (!igdbId) {
    const isSteamImported = (typedMedia.source ?? '').toLowerCase() === 'steam';
    if (
      isSteamImported &&
      typeof typedMedia.steam_app_id === 'number' &&
      typedMedia.steam_app_id > 0
    ) {
      igdbId = await findIgdbGameIdBySteamAppId(typedMedia.steam_app_id);
    }
  }
  if (!igdbId) {
    const query = typedMedia.title_english || typedMedia.title || '';
    const searchQueries = buildIgdbSearchQueries(query);
    if (searchQueries.length === 0) throw new Error('IGDB_ID_NOT_RESOLVED');

    let candidates: Awaited<ReturnType<typeof searchIgdbGames>> = [];
    for (const q of searchQueries) {
      candidates = await searchIgdbGames(q, 8);
      if (candidates.length > 0) break;
    }
    if (candidates.length === 0) {
      for (const q of searchQueries) {
        candidates = await searchIgdbGamesWithoutCategoryFilter(q, 20);
        if (candidates.length > 0) break;
      }
    }
    const allowedCandidates = candidates.filter(candidate =>
      isAllowedIgdbGameCandidate({
        category: candidate.category,
        name: candidate.name,
        slug: candidate.slug ?? null,
      }),
    );
    const matched = selectBestCandidate(query, allowedCandidates);
    igdbId = matched?.id ?? null;
  }

  if (!igdbId) throw new Error('IGDB_MATCH_NOT_FOUND');

  const game = await fetchIgdbGameDetails(igdbId, { mainGameOnly: false });
  if (!game) throw new Error('IGDB_DETAILS_FAILED');
  if (
    !isAllowedIgdbGameCandidate({
      category: game.category,
      name: game.name,
      slug: game.slug ?? null,
    })
  ) {
    throw new Error('IGDB_UNSUPPORTED_CATEGORY');
  }

  const payload = mapIgdbToPayload(game);
  return {
    ...payload,
    platforms:
      typedMedia.steam_app_id && Array.isArray(payload.platforms)
        ? Array.from(new Set(['PC', ...payload.platforms]))
        : payload.platforms,
  };
}

async function assertPrivilegedUser(userId: string) {
  const supabase = await createRouteHandlerClient();
  const { data: userRow, error } = await supabase
    .from('users')
    .select('roles')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  const userRoles = Array.isArray(userRow?.roles) ? userRow.roles : [];
  const hasSupportRole = userRoles.some(r => r.toLowerCase() === 'support');

  if (!userRow || (!hasSupportRole && !hasAnyRole(userRow, ['admin', 'owner', 'moderator']))) {
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
    if (!Number.isFinite(mediaId) || Number.isNaN(mediaId) || mediaId <= 0) {
      console.warn('[GET /api/media/entry] Invalid mediaId:', mediaIdRaw);
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
    if (!body || typeof body !== 'object' || !('action' in body)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();

    if (!('category' in body) || !body.category || !isMediaCategory(body.category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }
    if (!('mediaId' in body)) {
      return NextResponse.json({ error: 'Invalid mediaId' }, { status: 400 });
    }

    const mediaId = Number(body.mediaId);
    if (!Number.isFinite(mediaId) || mediaId <= 0) {
      return NextResponse.json({ error: 'Invalid mediaId' }, { status: 400 });
    }

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

    const action = body.action as SyncAction;
    if (
      !['sync_igdb_metadata', 'preview_igdb_metadata', 'apply_igdb_metadata_patch'].includes(action)
    ) {
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
    }

    if (body.category !== 'games') {
      return NextResponse.json(
        { error: 'IGDB metadata sync is only available for games' },
        { status: 400 },
      );
    }

    let patch: ReturnType<typeof mapIgdbToPayload>;
    try {
      patch = await resolveIgdbPatch(admin, mediaId);
    } catch (resolveError) {
      if (resolveError instanceof Error) {
        if (resolveError.message === 'GAME_NOT_FOUND') {
          return NextResponse.json({ error: 'Game not found' }, { status: 404 });
        }
        if (resolveError.message === 'IGDB_ID_NOT_RESOLVED') {
          return NextResponse.json(
            { error: 'Unable to resolve IGDB ID for this title' },
            { status: 404 },
          );
        }
        if (resolveError.message === 'IGDB_MATCH_NOT_FOUND') {
          return NextResponse.json({ error: 'IGDB match not found' }, { status: 404 });
        }
        if (resolveError.message === 'IGDB_DETAILS_FAILED') {
          return NextResponse.json({ error: 'IGDB details fetch failed' }, { status: 502 });
        }
        if (resolveError.message === 'IGDB_UNSUPPORTED_CATEGORY') {
          return NextResponse.json(
            { ok: false, error: 'Unsupported IGDB category' },
            { status: 422 },
          );
        }
      }
      throw resolveError;
    }

    if (action === 'preview_igdb_metadata') {
      return NextResponse.json({
        success: true,
        mediaId,
        igdbId: patch.igdb_id,
        patch,
        description: patch.description ?? '',
      });
    }

    const { data: saved, error: saveError } = await admin
      .from('media_items')
      .update({
        ...(patch as unknown as Record<string, unknown>),
        source: 'igdb',
        igdb_updated_at: patch.igdb_updated_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', mediaId)
      .eq('category', 'games')
      .select('id,igdb_id,description')
      .single();
    if (saveError) throw saveError;

    return NextResponse.json({
      success: true,
      mediaId,
      igdbId: (saved as { igdb_id?: number | null })?.igdb_id ?? null,
      description: (saved as { description?: string | null })?.description ?? '',
      applied: Object.keys(patch),
    });
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
export const POST = withApiRoute(PATCHHandler);
