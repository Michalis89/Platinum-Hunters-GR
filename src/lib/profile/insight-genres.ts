import type { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import type { CategoryProfiles } from '@/lib/validation/profile';

type InsightCategory = 'games' | 'anime' | 'manga' | 'books' | 'movies' | 'tv';

const INSIGHT_CATEGORIES: InsightCategory[] = ['games', 'anime', 'manga', 'books', 'movies', 'tv'];
const INSIGHT_TOP_GENRES_LIMIT = 12;
const INSIGHT_MIN_GENRE_PERCENT = 8;

function normalizeGenreKey(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function getInsightWeight(
  score: number | null | undefined,
  isFavorite: boolean | null | undefined,
): number {
  const hasScore = typeof score === 'number' && Number.isFinite(score) && score >= 0 && score <= 10;
  const baseWeight = hasScore ? 0.25 + score / 10 : 0.35;
  return isFavorite ? Math.min(baseWeight * 1.35, 1.7) : baseWeight;
}

export async function buildInsightGenresMap(
  supabase: Awaited<ReturnType<typeof createRouteHandlerClient>>,
  userId: string,
): Promise<Partial<Record<InsightCategory, string[]>>> {
  const result: Partial<Record<InsightCategory, string[]>> = {};
  const { data, error } = await supabase
    .from('user_media_entries')
    .select('status,score,is_favorite,media_items!inner(category,genres)')
    .eq('user_id', userId)
    .in('status', ['current', 'completed'])
    .in('media_items.category', INSIGHT_CATEGORIES);

  if (error || !data) {
    return result;
  }

  const statsByCategory = new Map<
    InsightCategory,
    Map<string, { label: string; weight: number; count: number }>
  >();

  for (const row of data as Array<Record<string, unknown>>) {
    const mediaRaw = row.media_items as unknown;
    const media = Array.isArray(mediaRaw)
      ? (mediaRaw[0] as Record<string, unknown> | undefined)
      : (mediaRaw as Record<string, unknown> | null | undefined);
    if (!media) {
      continue;
    }

    const category = media.category;
    if (typeof category !== 'string' || !INSIGHT_CATEGORIES.includes(category as InsightCategory)) {
      continue;
    }

    const genres = Array.isArray(media.genres) ? media.genres : [];
    if (genres.length === 0) {
      continue;
    }

    const weight = getInsightWeight(
      typeof row.score === 'number' ? row.score : null,
      typeof row.is_favorite === 'boolean' ? row.is_favorite : null,
    );
    const categoryKey = category as InsightCategory;
    const categoryStats = statsByCategory.get(categoryKey) ?? new Map();

    for (const rawGenre of genres) {
      if (typeof rawGenre !== 'string') {
        continue;
      }
      const label = rawGenre.trim();
      if (!label) {
        continue;
      }
      const key = normalizeGenreKey(label);
      const current = categoryStats.get(key) ?? { label, weight: 0, count: 0 };
      current.weight += weight;
      current.count += 1;
      categoryStats.set(key, current);
    }

    statsByCategory.set(categoryKey, categoryStats);
  }

  for (const category of INSIGHT_CATEGORIES) {
    const categoryStats = statsByCategory.get(category);
    if (!categoryStats || categoryStats.size === 0) {
      result[category] = [];
      continue;
    }

    const sortedByWeight = Array.from(categoryStats.values()).sort((a, b) => {
      if (b.weight !== a.weight) {
        return b.weight - a.weight;
      }
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.label.localeCompare(b.label);
    });

    const totalWeight = sortedByWeight.reduce((sum, item) => sum + item.weight, 0);
    const visibleGenres = sortedByWeight
      .filter(item => {
        if (totalWeight <= 0) {
          return false;
        }
        const percent = (item.weight / totalWeight) * 100;
        return percent >= INSIGHT_MIN_GENRE_PERCENT;
      })
      .slice(0, INSIGHT_TOP_GENRES_LIMIT)
      .map(item => item.label);

    result[category] = visibleGenres;
  }

  return result;
}

export function applyInsightGenres(
  profiles: CategoryProfiles,
  insights: Partial<Record<InsightCategory, string[]>>,
): CategoryProfiles {
  const next = { ...profiles } as CategoryProfiles;

  if (profiles.games) {
    next.games = {
      ...profiles.games,
      user_favorite_genres: insights.games ?? [],
    };
  }
  if (profiles.anime) {
    next.anime = {
      ...profiles.anime,
      genres: insights.anime ?? [],
    };
  }
  if (profiles.manga) {
    next.manga = {
      ...profiles.manga,
      genres: insights.manga ?? [],
    };
  }
  if (profiles.books) {
    next.books = {
      ...profiles.books,
      genres: insights.books ?? [],
    };
  }
  if (profiles.movies) {
    next.movies = {
      ...profiles.movies,
      genres: insights.movies ?? [],
    };
  }
  if (profiles.tv) {
    next.tv = {
      ...profiles.tv,
      genres: insights.tv ?? [],
    };
  }

  return next;
}

export async function enrichCategoryProfilesWithInsights(
  supabase: Awaited<ReturnType<typeof createRouteHandlerClient>>,
  userId: string,
  profiles: CategoryProfiles,
): Promise<CategoryProfiles> {
  const insightGenres = await buildInsightGenresMap(supabase, userId);
  return applyInsightGenres(profiles, insightGenres);
}
