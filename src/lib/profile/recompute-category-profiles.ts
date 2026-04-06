import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { fetchTmdbCredits } from '@/lib/tmdb/credits';

const DERIVED_CATEGORIES = ['movies', 'tv', 'books', 'anime', 'manga'] as const;
type DerivedCategory = (typeof DERIVED_CATEGORIES)[number];

const MAX_CREDITS_LOOKUPS_PER_CATEGORY = 8;

type EntryRow = {
  status: string | null;
  is_favorite: boolean | null;
  score: number | null;
  media_items: {
    category: string | null;
    tmdb_id: number | null;
    runtime: number | null;
    tags: unknown;
    studios: unknown;
  } | null;
};

const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ');

const scoreWeight = (score: number | null) => {
  if (score === null || !Number.isFinite(score)) {
    return 0;
  }
  if (score >= 10) {
    return 5;
  }
  if (score >= 9) {
    return 4;
  }
  if (score >= 8) {
    return 3;
  }
  if (score >= 7) {
    return 2;
  }
  return 0;
};

const buildEntryWeight = (entry: EntryRow, withRuntimeBonus = false) => {
  if ((entry.status ?? '') !== 'completed') {
    return 0;
  }
  let points = 1;
  if (entry.is_favorite) {
    points += 6;
  }
  points += scoreWeight(entry.score ?? null);
  if (
    withRuntimeBonus &&
    typeof entry.media_items?.runtime === 'number' &&
    entry.media_items.runtime > 180
  ) {
    points += 0.5;
  }
  return points;
};

const addWeightedNames = (target: Map<string, number>, names: string[], points: number) => {
  for (const rawName of names) {
    const name = normalizeName(rawName);
    if (!name) {
      continue;
    }
    target.set(name, (target.get(name) ?? 0) + points);
  }
};

const topNames = (source: Map<string, number>, limit = 3) =>
  Array.from(source.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name);

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter(
        (item): item is string | number => typeof item === 'string' || typeof item === 'number',
      )
      .map(item => String(item).trim())
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }
  return [];
};

const getDerivedCategories = (categories?: string[]): DerivedCategory[] => {
  if (!categories || categories.length === 0) {
    return [...DERIVED_CATEGORIES];
  }
  const set = new Set(categories);
  return DERIVED_CATEGORIES.filter(category => set.has(category));
};

const ensureCategoryObject = (profiles: Record<string, unknown>, category: string) => {
  const current = profiles[category];
  if (current && typeof current === 'object' && !Array.isArray(current)) {
    return current as Record<string, unknown>;
  }
  const next = {};
  profiles[category] = next;
  return next as Record<string, unknown>;
};

const applyDerivedValue = (target: Record<string, unknown>, key: string, values: string[]) => {
  if (values.length > 0) {
    target[key] = values.join(', ');
    return;
  }
  delete target[key];
};

export async function recomputeCategoryProfiles(
  supabase: SupabaseClient<Database>,
  userId: string,
  categories?: string[],
) {
  const derivedCategories = getDerivedCategories(categories);
  if (derivedCategories.length === 0) {
    return;
  }

  const [
    { data: categoryProfileRow, error: categoryProfileError },
    { data: entries, error: entriesError },
  ] = await Promise.all([
    supabase.from('user_category_profiles').select('profiles').eq('user_id', userId).maybeSingle(),
    supabase
      .from('user_media_entries')
      .select('status,is_favorite,score,media_items!inner(category,tmdb_id,runtime,tags,studios)')
      .eq('user_id', userId)
      .in('media_items.category', derivedCategories),
  ]);

  if (categoryProfileError) {
    throw categoryProfileError;
  }
  if (entriesError) {
    throw entriesError;
  }

  const profiles =
    categoryProfileRow?.profiles && typeof categoryProfileRow.profiles === 'object'
      ? ({ ...(categoryProfileRow.profiles as Record<string, unknown>) } as Record<string, unknown>)
      : ({} as Record<string, unknown>);

  const safeEntries = (Array.isArray(entries) ? entries : []) as EntryRow[];
  const byCategory = new Map<DerivedCategory, EntryRow[]>();
  for (const category of derivedCategories) {
    byCategory.set(category, []);
  }

  for (const entry of safeEntries) {
    const category = entry.media_items?.category;
    if (!category || !byCategory.has(category as DerivedCategory)) {
      continue;
    }
    byCategory.get(category as DerivedCategory)?.push(entry);
  }

  for (const category of derivedCategories) {
    const target = ensureCategoryObject(profiles, category);
    const categoryEntries = byCategory.get(category) ?? [];

    if (category === 'movies' || category === 'tv') {
      const directorsMap = new Map<string, number>();
      const actorsMap = new Map<string, number>();

      const weighted = categoryEntries
        .map(entry => ({
          entry,
          tmdbId: entry.media_items?.tmdb_id ?? null,
          points: buildEntryWeight(entry, true),
        }))
        .filter(
          (item): item is { entry: EntryRow; tmdbId: number; points: number } =>
            typeof item.tmdbId === 'number' && Number.isFinite(item.tmdbId) && item.points > 0,
        )
        .sort((a, b) => b.points - a.points);

      const selected: Array<{ tmdbId: number; points: number }> = [];
      const seenTmdbIds = new Set<number>();
      for (const item of weighted) {
        if (seenTmdbIds.has(item.tmdbId)) {
          continue;
        }
        seenTmdbIds.add(item.tmdbId);
        selected.push({ tmdbId: item.tmdbId, points: item.points });
        if (selected.length >= MAX_CREDITS_LOOKUPS_PER_CATEGORY) {
          break;
        }
      }

      for (const item of selected) {
        try {
          const credits = await fetchTmdbCredits(category, item.tmdbId);
          addWeightedNames(directorsMap, credits.directors, item.points);
          addWeightedNames(actorsMap, credits.actors, item.points);
        } catch {
          // Ignore individual TMDB failures to keep recompute resilient.
        }
      }

      applyDerivedValue(target, 'directors', topNames(directorsMap));
      applyDerivedValue(target, 'actors', topNames(actorsMap));
      continue;
    }

    if (category === 'books') {
      const authorsMap = new Map<string, number>();
      for (const entry of categoryEntries) {
        const points = buildEntryWeight(entry);
        if (points <= 0) {
          continue;
        }
        addWeightedNames(authorsMap, toStringArray(entry.media_items?.tags), points);
      }
      applyDerivedValue(target, 'authors', topNames(authorsMap));
      continue;
    }

    if (category === 'manga') {
      // Manga `media_items.tags` currently stores alternate titles/synonyms (MAL),
      // not creator names. Avoid deriving "authors" from that field.
      continue;
    }

    if (category === 'anime') {
      const studiosMap = new Map<string, number>();
      for (const entry of categoryEntries) {
        const points = buildEntryWeight(entry);
        if (points <= 0) {
          continue;
        }
        addWeightedNames(studiosMap, toStringArray(entry.media_items?.studios), points);
      }
      applyDerivedValue(target, 'favorite_studios', topNames(studiosMap));
    }
  }

  const now = new Date().toISOString();
  const { error: upsertError } = await supabase.from('user_category_profiles').upsert(
    {
      user_id: userId,
      profiles: profiles as never,
      updated_at: now,
    } as never,
    { onConflict: 'user_id' },
  );
  if (upsertError) {
    throw upsertError;
  }
}
