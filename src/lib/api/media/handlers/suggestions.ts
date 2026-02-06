import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { requireAuth } from '@/lib/api/auth';
import { UNSUPPORTED_CATEGORY } from '@/lib/constants/messages';

/**
 * Generic suggestion row type - media_items is dynamic based on select fields
 */
export type SuggestionRow<TMediaItem = Record<string, unknown>> = {
  media_id: number;
  score: number | null;
  media_items: TMediaItem | null;
};

/**
 * Configuration for suggestion routes
 */
export type SuggestionsConfig<TMediaItem = Record<string, unknown>, TResult = unknown> = {
  /** Allowed category values (e.g., ['anime', 'manga']) */
  allowedCategories: string[];

  /** Default category if not specified in query params */
  defaultCategory: string;

  /** Supabase select fields for the media_items join */
  selectFields: string;

  /** Maps a media item to the result format */
  mapper: (media: TMediaItem, weightedScore: number, userCount?: number) => TResult;

  /** Optional fallback handler when no suggestions are found */
  fallback?: (
    category: string,
    userMediaIds: Set<number>,
  ) => Promise<TResult[]>;

  /** Minimum votes threshold for Bayesian averaging (default: 2) */
  minimumVotes?: number;

  /** Maximum number of suggestions to return (default: 4) */
  limit?: number;

  /** Log prefix for error messages */
  logPrefix?: string;
};

/**
 * Generic suggestions handler using Bayesian averaging
 */
export async function handleSuggestionsGet<TMediaItem, TResult>(
  req: Request,
  config: SuggestionsConfig<TMediaItem, TResult>,
) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || config.defaultCategory;

    // Validate category
    if (!config.allowedCategories.includes(category)) {
      return NextResponse.json({ error: UNSUPPORTED_CATEGORY }, { status: 400 });
    }

    // Auth check using existing helper (throws if unauthenticated)
    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);
    const userId = session.user.id;

    // Get user's existing media IDs to exclude from suggestions
    const { data: userEntries } = await supabase
      .from('user_media_entries')
      .select('media_id, media_items!inner(category)')
      .eq('user_id', userId)
      .eq('media_items.category', category);

    const userMediaIds = new Set(
      (userEntries ?? []).map((e: { media_id: number }) => e.media_id),
    );

    // Fetch all scored entries for this category from ALL users
    const { data, error } = await supabase
      .from('user_media_entries')
      .select(config.selectFields)
      .eq('media_items.category', category)
      .not('score', 'is', null);

    if (error) {
      throw error;
    }

    // Bayesian averaging algorithm
    const buckets = new Map<number, { sum: number; count: number; media: TMediaItem }>();
    let globalSum = 0;
    let globalCount = 0;

    (data as unknown as SuggestionRow<TMediaItem>[] | null)?.forEach(row => {
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
    const minimumVotes = config.minimumVotes ?? 2;
    const limit = config.limit ?? 4;

    // Calculate weighted scores and map to result format
    const suggestions = Array.from(buckets.values())
      .filter(item => !userMediaIds.has((item.media as { id: number }).id))
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
      .slice(0, limit)
      .map(item => config.mapper(item.media, item.weighted, item.count));

    // Return suggestions if found
    if (suggestions.length > 0) {
      return NextResponse.json({ items: suggestions });
    }

    // Optional fallback (e.g., popular items from external API)
    if (config.fallback) {
      const fallbackItems = await config.fallback(category, userMediaIds);
      return NextResponse.json({ items: fallbackItems });
    }

    return NextResponse.json({ items: [] });
  } catch (error) {
    const prefix = config.logPrefix || 'Suggestions';
    console.error(`${prefix} fetch error:`, error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
