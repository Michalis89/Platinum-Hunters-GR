import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { fetchTmdbCredits } from '@/lib/tmdb/credits';

const DERIVED_CATEGORIES = ['movies', 'tv', 'books', 'anime', 'manga', 'games'] as const;
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
    title: string | null;
  } | null;
};

const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ');

// Extracts a franchise key from a title by stripping subtitles, season/part numbers,
// and trailing numerals — the same logic used in genre-affinity for franchise dedup.
export function extractFranchiseKey(title: string): string {
  let normalized = title.toLowerCase().trim();
  normalized = normalized
    .replace(/:\s+.+$/u, '')
    .replace(/\bseason\s+\d+\b/giu, '')
    .replace(/\bpart\s+\d+\b/giu, '')
    .replace(/\bcour\s+\d+\b/giu, '')
    .replace(/\b(ova|ona|special|movie|arc|the final chapters?)\b/giu, '')
    .replace(/\(\s*\d{4}\s*\)/gu, '')
    .replace(/\s+-\s+.+$/u, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  normalized = normalized.replace(/\b\d+\b$/u, '').trim();
  return normalized || title.toLowerCase().trim();
}

// Builds franchise-deduped directors and actors maps from a set of entries with credits.
// Directors: per franchise family, contributes max(points) — not the sum.
// Actors: same dedup, plus filtered to those appearing in 2+ distinct franchise families.
export function buildCreditMaps(
  entries: Array<{
    title: string;
    points: number;
    credits: { directors: string[]; actors: string[] };
  }>,
): { directorsMap: Map<string, number>; actorsMap: Map<string, number> } {
  // Per person: Map<franchiseKey, maxPoints>
  const directorsAccumulator = new Map<string, Map<string, number>>();
  const actorsAccumulator = new Map<string, Map<string, number>>();

  const updateAccumulator = (
    acc: Map<string, Map<string, number>>,
    names: string[],
    franchiseKey: string,
    points: number,
  ) => {
    for (const rawName of names) {
      const name = normalizeName(rawName);
      if (!name) {
        continue;
      }
      let familyMap = acc.get(name);
      if (!familyMap) {
        familyMap = new Map<string, number>();
        acc.set(name, familyMap);
      }
      const existing = familyMap.get(franchiseKey) ?? 0;
      if (points > existing) {
        familyMap.set(franchiseKey, points);
      }
    }
  };

  for (const entry of entries) {
    const franchiseKey = extractFranchiseKey(entry.title);
    updateAccumulator(directorsAccumulator, entry.credits.directors, franchiseKey, entry.points);
    updateAccumulator(actorsAccumulator, entry.credits.actors, franchiseKey, entry.points);
  }

  // Directors: sum of per-family max weights
  const directorsMap = new Map<string, number>();
  for (const [name, familyMap] of directorsAccumulator) {
    const total = Array.from(familyMap.values()).reduce((sum, w) => sum + w, 0);
    directorsMap.set(name, total);
  }

  // Actors: same, but only include those appearing in 2+ distinct franchise families
  const actorsMap = new Map<string, number>();
  for (const [name, familyMap] of actorsAccumulator) {
    if (familyMap.size < 2) {
      continue;
    }
    const total = Array.from(familyMap.values()).reduce((sum, w) => sum + w, 0);
    actorsMap.set(name, total);
  }

  return { directorsMap, actorsMap };
}

// Builds a franchise-deduped studio/developer map.
// Per franchise family, a studio contributes max(points) — not the sum.
export function buildStudioMap(
  entries: Array<{ title: string; points: number; studios: string[] }>,
): Map<string, number> {
  // Per studio: Map<franchiseKey, maxPoints>
  const accumulator = new Map<string, Map<string, number>>();

  for (const entry of entries) {
    const franchiseKey = extractFranchiseKey(entry.title);
    for (const rawName of entry.studios) {
      const name = normalizeName(rawName);
      if (!name) {
        continue;
      }
      let familyMap = accumulator.get(name);
      if (!familyMap) {
        familyMap = new Map<string, number>();
        accumulator.set(name, familyMap);
      }
      const existing = familyMap.get(franchiseKey) ?? 0;
      if (entry.points > existing) {
        familyMap.set(franchiseKey, entry.points);
      }
    }
  }

  const result = new Map<string, number>();
  for (const [name, familyMap] of accumulator) {
    const total = Array.from(familyMap.values()).reduce((sum, w) => sum + w, 0);
    result.set(name, total);
  }
  return result;
}

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

const topNames = (source: Map<string, number>, limit = 5) =>
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

const MIN_PEOPLE_DERIVATION_ENTRIES = 5;

const hasSufficientEntries = (entries: EntryRow[]): boolean => {
  const count = entries.filter(
    e => e.status === 'completed' || e.status === 'current',
  ).length;
  return count >= MIN_PEOPLE_DERIVATION_ENTRIES;
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
      .select('status,is_favorite,score,media_items!inner(category,tmdb_id,runtime,tags,studios,title)')
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
      if (!hasSufficientEntries(categoryEntries)) {
        delete target['directors'];
        delete target['actors'];
        continue;
      }
      const weighted = categoryEntries
        .map(entry => ({
          entry,
          tmdbId: entry.media_items?.tmdb_id ?? null,
          title: entry.media_items?.title ?? '',
          points: buildEntryWeight(entry, true),
        }))
        .filter(
          (item): item is { entry: EntryRow; tmdbId: number; title: string; points: number } =>
            typeof item.tmdbId === 'number' && Number.isFinite(item.tmdbId) && item.points > 0,
        )
        .sort((a, b) => b.points - a.points);

      const selected: Array<{ tmdbId: number; title: string; points: number }> = [];
      const seenTmdbIds = new Set<number>();
      for (const item of weighted) {
        if (seenTmdbIds.has(item.tmdbId)) {
          continue;
        }
        seenTmdbIds.add(item.tmdbId);
        selected.push({ tmdbId: item.tmdbId, title: item.title, points: item.points });
        if (selected.length >= MAX_CREDITS_LOOKUPS_PER_CATEGORY) {
          break;
        }
      }

      const creditEntries: Array<{
        title: string;
        points: number;
        credits: { directors: string[]; actors: string[] };
      }> = [];
      for (const item of selected) {
        try {
          const credits = await fetchTmdbCredits(category, item.tmdbId);
          creditEntries.push({ title: item.title, points: item.points, credits });
        } catch {
          // Ignore individual TMDB failures to keep recompute resilient.
        }
      }

      const { directorsMap, actorsMap } = buildCreditMaps(creditEntries);
      applyDerivedValue(target, 'directors', topNames(directorsMap));
      applyDerivedValue(target, 'actors', topNames(actorsMap));
      continue;
    }

    if (category === 'books') {
      if (!hasSufficientEntries(categoryEntries)) {
        delete target['authors'];
        continue;
      }
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
      if (!hasSufficientEntries(categoryEntries)) {
        delete target['favorite_studios'];
        continue;
      }
      const animeStudioEntries = categoryEntries
        .map(entry => ({
          title: entry.media_items?.title ?? '',
          points: buildEntryWeight(entry),
          studios: toStringArray(entry.media_items?.studios),
        }))
        .filter(item => item.points > 0);
      const studiosMap = buildStudioMap(animeStudioEntries);
      applyDerivedValue(target, 'favorite_studios', topNames(studiosMap));
      continue;
    }

    if (category === 'games') {
      if (!hasSufficientEntries(categoryEntries)) {
        delete target['favorite_developers'];
        continue;
      }
      const gameDevEntries = categoryEntries
        .map(entry => ({
          title: entry.media_items?.title ?? '',
          points: buildEntryWeight(entry),
          studios: toStringArray(entry.media_items?.studios),
        }))
        .filter(item => item.points > 0);
      const developersMap = buildStudioMap(gameDevEntries);
      applyDerivedValue(target, 'favorite_developers', topNames(developersMap));
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
