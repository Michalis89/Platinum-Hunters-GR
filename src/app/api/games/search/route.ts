import { withApiRoute } from '@/lib/observability/withApiRoute';

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import {
  searchRawgGames,
  mapRawgToSearchResult,
  mapLocalGameItem,
  type GameSearchResult,
} from '@/lib/services/rawgService';

async function GETHandler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() || '';
    const category = searchParams.get('category') || 'games';

    if (!q) {
      return NextResponse.json({ source: 'local', items: [] });
    }

    if (category !== 'games') {
      return NextResponse.json({ error: 'Unsupported category' }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    // Search local media_items first
    const { data: localItems, error: localError } = await supabase
      .from('media_items')
      .select('*')
      .eq('category', 'games')
      .or(`title.ilike.%${q}%,title_english.ilike.%${q}%`)
      .limit(12);

    if (localError) {
      console.warn('Local games search error:', localError);
    }

    const typedLocalItems = localItems as Array<{
      rawg_id?: number | null;
      [key: string]: unknown;
    }> | null;

    const localResults: GameSearchResult[] = (typedLocalItems ?? []).map(item =>
      mapLocalGameItem(item),
    );

    const remaining = Math.max(12 - localResults.length, 0);

    // Get local RAWG IDs to avoid duplicates
    const localRawgIds = new Set(
      typedLocalItems
        ?.map(item => item.rawg_id as number | null)
        .filter((id): id is number => typeof id === 'number') ?? [],
    );

    // Search RAWG API for additional results
    let externalResults: GameSearchResult[] = [];
    if (remaining > 0) {
      const rawgGames = await searchRawgGames(q, 12);
      externalResults = rawgGames
        .filter(game => !localRawgIds.has(game.id))
        .slice(0, remaining)
        .map(mapRawgToSearchResult);
    }

    const source =
      localResults.length > 0 && externalResults.length > 0
        ? 'mixed'
        : localResults.length > 0
          ? 'local'
          : 'external';

    return NextResponse.json({
      source,
      items: [...localResults, ...externalResults],
    });
  } catch (error) {
    console.error('Games search error:', error);
    return NextResponse.json({ source: 'external', items: [] }, { status: 500 });
  }
}

export const GET = withApiRoute(GETHandler);
