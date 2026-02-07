import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/observability/withApiRoute';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import type { Database } from '@/lib/supabase/database.types';
import {
  fetchMalList,
  getMalOAuthConfig,
  mapMalStatusToBacklogStatus,
  refreshMalAccessToken,
  type MalSyncCategory,
  type MalAnimeListItem,
} from '@/lib/integrations/mal';

type IntegrationRow = {
  user_id: string;
  provider: 'mal';
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  scopes: string[] | null;
};

function normalizeScore(score?: number | null): number | null {
  if (typeof score !== 'number' || Number.isNaN(score) || score <= 0) {
    return null;
  }
  return score;
}

function getSeasonYear(dateString?: string | null): number | null {
  if (!dateString) {
    return null;
  }
  const year = Number.parseInt(dateString.slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

function buildMediaPayload(
  item: MalAnimeListItem,
  category: MalSyncCategory,
): Database['public']['Tables']['media_items']['Insert'] {
  const node = item.node;
  return {
    category,
    source: 'mal',
    mal_id: node.id,
    title_english: node.alternative_titles?.en ?? null,
    title_romaji: node.title ?? null,
    title_native: node.alternative_titles?.ja ?? null,
    description: node.synopsis ?? null,
    format: node.media_type ?? null,
    status: node.status ?? null,
    season_year: getSeasonYear(node.start_date),
    episodes: category === 'anime' ? node.num_episodes ?? null : null,
    chapters: category === 'manga' ? item.list_status.num_chapters_read ?? null : null,
    start_date: node.start_date ?? null,
    cover_image_large: node.main_picture?.large ?? null,
    cover_image_medium: node.main_picture?.medium ?? null,
    genres: node.genres?.map(genre => genre.name) ?? [],
    tags: node.alternative_titles?.synonyms ?? [],
  };
}

async function ensureValidAccessToken(
  supabase: Awaited<ReturnType<typeof createRouteHandlerClient>>,
  integration: IntegrationRow,
) {
  const now = Date.now();
  const expiresAtMs = integration.expires_at ? Date.parse(integration.expires_at) : 0;
  const hasValidToken = expiresAtMs > now + 60_000;

  if (hasValidToken) {
    return integration.access_token;
  }

  if (!integration.refresh_token) {
    throw new Error('MAL refresh token missing');
  }

  const { clientId, clientSecret } = getMalOAuthConfig();
  const refreshedTokens = await refreshMalAccessToken({
    clientId,
    clientSecret,
    refreshToken: integration.refresh_token,
  });

  const refreshedExpiresAt = new Date(Date.now() + refreshedTokens.expires_in * 1000).toISOString();
  const refreshedScopes = refreshedTokens.scope
    ? refreshedTokens.scope
        .split(' ')
        .map(value => value.trim())
        .filter(Boolean)
    : integration.scopes ?? [];

  const { error: refreshStoreError } = await supabase
    .from('user_integrations' as never)
    .update(
      {
        access_token: refreshedTokens.access_token,
        refresh_token: refreshedTokens.refresh_token,
        expires_at: refreshedExpiresAt,
        scopes: refreshedScopes,
      } as never,
    )
    .eq('user_id', integration.user_id)
    .eq('provider', 'mal');

  if (refreshStoreError) {
    throw new Error(`Failed to persist MAL token refresh: ${refreshStoreError.message}`);
  }

  return refreshedTokens.access_token;
}

async function POSTHandler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedCategory = searchParams.get('category');
    const syncCategory: MalSyncCategory = requestedCategory === 'manga' ? 'manga' : 'anime';

    const supabase = await createRouteHandlerClient();
    const adminSupabase = createSupabaseAdminClient();
    const session = await requireAuth(supabase);

    const { data: integrationData, error: integrationError } = await supabase
      .from('user_integrations' as never)
      .select('user_id,provider,access_token,refresh_token,expires_at,scopes')
      .eq('user_id', session.user.id)
      .eq('provider', 'mal')
      .maybeSingle();

    if (integrationError) {
      throw integrationError;
    }

    if (!integrationData) {
      return NextResponse.json(
        { error: 'MAL integration not connected. Connect first from the backlog.' },
        { status: 404 },
      );
    }

    const integration = integrationData as unknown as IntegrationRow;
    const accessToken = await ensureValidAccessToken(supabase, integration);
    const malItems = await fetchMalList(accessToken, syncCategory);

    const uniqueMalItems = Array.from(
      new Map(malItems.map(item => [item.node.id, item] as const)).values(),
    );

    if (uniqueMalItems.length === 0) {
      return NextResponse.json({
        totalFetched: 0,
        mediaInserted: 0,
        mediaUpdated: 0,
        entriesInserted: 0,
        entriesUpdated: 0,
      });
    }

    const malIds = uniqueMalItems.map(item => item.node.id);
    const { data: existingMediaRows, error: existingMediaError } = await adminSupabase
      .from('media_items')
      .select('id,mal_id')
      .eq('source', 'mal')
      .eq('category', syncCategory)
      .in('mal_id', malIds);

    if (existingMediaError) {
      throw existingMediaError;
    }

    const existingMalIds = new Set<number>(
      (existingMediaRows ?? [])
        .map(row => row.mal_id)
        .filter((value): value is number => typeof value === 'number'),
    );

    const mediaPayload = uniqueMalItems.map(item => buildMediaPayload(item, syncCategory));
    const { data: mediaRows, error: mediaUpsertError } = await adminSupabase
      .from('media_items')
      .upsert(mediaPayload, { onConflict: 'mal_id,category' })
      .select('id,mal_id');

    if (mediaUpsertError) {
      throw mediaUpsertError;
    }

    const mediaIdByMalId = new Map<number, number>();
    for (const row of mediaRows ?? []) {
      if (typeof row.mal_id === 'number') {
        mediaIdByMalId.set(row.mal_id, row.id);
      }
    }

    const mediaIds = Array.from(mediaIdByMalId.values());
    if (mediaIds.length === 0) {
      return NextResponse.json(
        { error: 'Unable to map MAL items to media records.' },
        { status: 500 },
      );
    }

    const { data: existingEntryRows, error: existingEntriesError } = await supabase
      .from('user_media_entries')
      .select('media_id')
      .eq('user_id', session.user.id)
      .in('media_id', mediaIds);

    if (existingEntriesError) {
      throw existingEntriesError;
    }

    const existingEntryMediaIds = new Set<number>((existingEntryRows ?? []).map(row => row.media_id));

    const userEntryPayload: Database['public']['Tables']['user_media_entries']['Insert'][] = [];
    for (const item of uniqueMalItems) {
      const mediaId = mediaIdByMalId.get(item.node.id);
      if (!mediaId) {
        continue;
      }
      if (existingEntryMediaIds.has(mediaId)) {
        continue;
      }

      // Insert-only sync: do not modify any existing user entries.
      const score = normalizeScore(item.list_status.score);
      const nextEntry: Database['public']['Tables']['user_media_entries']['Insert'] = {
        user_id: session.user.id,
        media_id: mediaId,
        status: mapMalStatusToBacklogStatus(item.list_status.status),
        import_source: 'mal',
        progress:
          syncCategory === 'manga'
            ? item.list_status.num_chapters_read ?? 0
            : item.list_status.num_episodes_watched ?? 0,
      };
      if (score !== null) {
        nextEntry.score = score;
      }
      userEntryPayload.push(nextEntry);
    }

    if (userEntryPayload.length > 0) {
      const { error: entryInsertError } = await supabase
        .from('user_media_entries')
        .insert(userEntryPayload);

      if (entryInsertError) {
        throw entryInsertError;
      }
    }

    const mediaInserted = uniqueMalItems.filter(item => !existingMalIds.has(item.node.id)).length;
    const mediaUpdated = uniqueMalItems.length - mediaInserted;

    const entriesInserted = userEntryPayload.length;
    const entriesSkipped = mediaIds.length - entriesInserted;

    return NextResponse.json({
      totalFetched: uniqueMalItems.length,
      mediaInserted,
      mediaUpdated,
      entriesInserted,
      entriesSkipped,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('MAL sync error:', error);
    return NextResponse.json({ error: 'Failed to sync MAL list' }, { status: 500 });
  }
}

export const POST = withApiRoute(POSTHandler);
