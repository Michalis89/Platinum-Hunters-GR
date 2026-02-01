import { withApiRoute } from '@/lib/observability/withApiRoute';

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

type SuggestionRow = {
  media_id: number;
  score: number | null;
  media_items: {
    id: number;
    category: string;
    title: string | null;
    title_english: string | null;
    description: string | null;
    season_year: number | null;
    release_date: string | null;
    cover_image_large: string | null;
    cover_image_medium: string | null;
    genres: string[] | null;
  } | null;
};

const mapSuggestedItem = (
  media: NonNullable<SuggestionRow['media_items']>,
  average: number,
  userCount: number,
) => {
  const title = media.title || media.title_english || 'Untitled';
  const year =
    media.season_year?.toString() || media.release_date?.slice(0, 4) || undefined;
  return {
    source: 'local',
    id: `suggest-${media.id}`,
    mediaId: media.id,
    title,
    subtitle: `${userCount} users`,
    year,
    status: 'planned',
    score: average.toFixed(1),
    tags: media.genres ?? [],
    cover: media.cover_image_large || media.cover_image_medium || '/og-image.png',
    description: media.description ?? undefined,
  };
};

async function GETHandler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || 'games';

    if (category !== 'games') {
      return NextResponse.json({ error: 'Unsupported category' }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Μη εξουσιοδοτημένη πρόσβαση' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's existing media IDs to exclude from suggestions
    const { data: userEntries } = await supabase
      .from('user_media_entries')
      .select('media_id, media_items!inner(category)')
      .eq('user_id', userId)
      .eq('media_items.category', 'games');

    const userMediaIds = new Set(
      (userEntries ?? []).map((e: { media_id: number }) => e.media_id),
    );

    // Get all scored entries for games from ALL users
    const { data, error } = await supabase
      .from('user_media_entries')
      .select(
        'media_id,score,media_items!inner(id,category,title,title_english,description,season_year,release_date,cover_image_large,cover_image_medium,genres)',
      )
      .eq('media_items.category', 'games')
      .not('score', 'is', null);

    if (error) {
      throw error;
    }

    // Group by media_id and calculate weighted score
    const buckets = new Map<
      number,
      { sum: number; count: number; media: NonNullable<SuggestionRow['media_items']> }
    >();

    let globalSum = 0;
    let globalCount = 0;
    (data as SuggestionRow[] | null)?.forEach(row => {
      if (!row.media_items || row.score === null) return;
      globalSum += row.score;
      globalCount += 1;
      const current = buckets.get(row.media_id);
      if (current) {
        current.sum += row.score;
        current.count += 1;
      } else {
        buckets.set(row.media_id, {
          sum: row.score,
          count: 1,
          media: row.media_items,
        });
      }
    });

    const globalAverage = globalCount > 0 ? globalSum / globalCount : 0;
    // Lower minimumVotes to show items even with few ratings
    const minimumVotes = 2;

    // Calculate popularity score: weighted average that favors items with more votes
    // Using Bayesian average: (count / (count + m)) * average + (m / (count + m)) * globalAverage
    const suggestions = Array.from(buckets.values())
      // Filter out items the user already has
      .filter(item => !userMediaIds.has(item.media.id))
      .map(item => {
        const average = item.sum / item.count;
        const weighted =
          item.count + minimumVotes > 0
            ? (item.count / (item.count + minimumVotes)) * average +
              (minimumVotes / (item.count + minimumVotes)) * globalAverage
            : 0;
        return {
          average,
          weighted,
          count: item.count,
          media: item.media,
        };
      })
      .sort((a, b) => b.weighted - a.weighted)
      .slice(0, 4)
      .map(item => mapSuggestedItem(item.media, item.weighted, item.count));

    return NextResponse.json({ items: suggestions });
  } catch (error) {
    console.error('Games suggestions fetch error:', error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}

export const GET = withApiRoute(GETHandler);
