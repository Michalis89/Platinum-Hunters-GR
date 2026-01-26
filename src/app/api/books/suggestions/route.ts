import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

type Category = 'books';

type SuggestionRow = {
  media_id: number;
  score: number | null;
  media_items: {
    id: number;
    category: Category;
    title: string | null;
    original_title: string | null;
    description: string | null;
    release_date: string | null;
    page_count: number | null;
    cover_image_large: string | null;
    cover_image_medium: string | null;
    genres: string[] | null;
    tags: string[] | null;
  } | null;
};

const mapSuggestedItem = (
  media: NonNullable<SuggestionRow['media_items']>,
  average: number,
) => {
  const title = media.title || media.original_title || 'Untitled';
  const subtitle = (media.tags && media.tags.length > 0 ? media.tags.join(', ') : '') || '';
  const year = media.release_date?.slice(0, 4) || undefined;
  return {
    source: 'local',
    id: `suggest-${media.id}`,
    mediaId: media.id,
    title,
    subtitle,
    year,
    status: 'planned',
    score: average.toFixed(1),
    tags: media.genres ?? [],
    cover: media.cover_image_large || media.cover_image_medium || '/og-image.png',
    totalPages: media.page_count ?? undefined,
    description: media.description ?? undefined,
  };
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = (searchParams.get('category') || 'books') as Category;

    if (category !== 'books') {
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
      .eq('media_items.category', category);

    const userMediaIds = new Set(
      (userEntries ?? []).map((e: { media_id: number }) => e.media_id)
    );

    const { data, error } = await supabase
      .from('user_media_entries')
      .select(
        'media_id,score,media_items!inner(id,category,title,original_title,description,release_date,page_count,cover_image_large,cover_image_medium,genres,tags)',
      )
      .eq('media_items.category', category)
      .not('score', 'is', null);

    if (error) {
      throw error;
    }

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
    const minimumVotes = 5;

    const suggestions = Array.from(buckets.values())
      // Filter out items the user already has
      .filter(item => !userMediaIds.has(item.media.id))
      .map(item => ({
        average: item.sum / item.count,
        weighted:
          item.count + minimumVotes > 0
            ? (item.count / (item.count + minimumVotes)) * (item.sum / item.count) +
              (minimumVotes / (item.count + minimumVotes)) * globalAverage
            : 0,
        media: item.media,
      }))
      .sort((a, b) => b.weighted - a.weighted)
      .slice(0, 4)
      .map(item => mapSuggestedItem(item.media, item.weighted));

    return NextResponse.json({ items: suggestions });
  } catch (error) {
    console.error('Suggestions fetch error:', error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
