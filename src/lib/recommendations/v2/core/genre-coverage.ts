/**
 * Genre Coverage Analyzer
 *
 * Dynamically detects "generic" genres by calculating coverage
 * across the database. No hardcoded lists.
 */

import { getCanonicalKey } from '../../core/genre-normalization';
import type { GenreCoverage } from '../types';
import type { createRouteHandlerClient } from '@/lib/supabase-route-handler';

type SupabaseClient = Awaited<ReturnType<typeof createRouteHandlerClient>>;

/**
 * Generic genre threshold
 * If a genre appears in more than 60% of games, it's considered generic
 */
const GENERIC_THRESHOLD = 0.6;

/**
 * Cache genre coverage for performance
 * Expires after 1 hour
 */
const coverageCache = new Map<
  string,
  {
    data: Map<string, GenreCoverage>;
    timestamp: number;
  }
>();

const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Calculate genre coverage for a category
 *
 * @param supabase - Supabase client
 * @param category - Category to analyze
 * @returns Map of canonical genre key -> coverage data
 */
export async function calculateGenreCoverage(
  supabase: SupabaseClient,
  category: string,
): Promise<Map<string, GenreCoverage>> {
  // Check cache first
  const cached = coverageCache.get(category);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Get total count of items in category
  const { count: totalItems, error: countError } = await supabase
    .from('media_items')
    .select('*', { count: 'exact', head: true })
    .in('category', category === 'games' ? ['games', 'game'] : [category]);

  if (countError || totalItems === null) {
    console.error('[GenreCoverage] Error counting items:', countError);
    return new Map();
  }

  // Get all genres with their item counts
  const { data: items, error: itemsError } = await supabase
    .from('media_items')
    .select('genres')
    .in('category', category === 'games' ? ['games', 'game'] : [category])
    .not('genres', 'is', null);

  if (itemsError || !items) {
    console.error('[GenreCoverage] Error fetching genres:', itemsError);
    return new Map();
  }

  // Count occurrences of each genre (normalized)
  const genreCounts = new Map<string, number>();

  for (const item of items) {
    const genres = item.genres as string[] | null;
    if (!genres || !Array.isArray(genres)) {
      continue;
    }

    const seenInThisItem = new Set<string>(); // Avoid double-counting same genre in one item

    for (const genre of genres) {
      const canonicalKey = getCanonicalKey(genre);
      if (!canonicalKey || seenInThisItem.has(canonicalKey)) {
        continue;
      }

      seenInThisItem.add(canonicalKey);
      genreCounts.set(canonicalKey, (genreCounts.get(canonicalKey) ?? 0) + 1);
    }
  }

  // Calculate coverage for each genre
  const coverageMap = new Map<string, GenreCoverage>();

  for (const [genre, itemCount] of genreCounts.entries()) {
    const coverage = totalItems > 0 ? itemCount / totalItems : 0;
    const isGeneric = coverage > GENERIC_THRESHOLD;

    coverageMap.set(genre, {
      genre,
      itemCount,
      totalItems,
      coverage,
      isGeneric,
    });
  }

  // Cache the result
  coverageCache.set(category, {
    data: coverageMap,
    timestamp: Date.now(),
  });

  return coverageMap;
}

/**
 * Check if a genre is generic
 */
export function isGenreGeneric(genre: string, coverageMap: Map<string, GenreCoverage>): boolean {
  const canonicalKey = getCanonicalKey(genre);
  if (!canonicalKey) {
    return false;
  }

  const coverage = coverageMap.get(canonicalKey);
  return coverage?.isGeneric ?? false;
}

/**
 * Get coverage for a specific genre
 */
export function getGenreCoverage(
  genre: string,
  coverageMap: Map<string, GenreCoverage>,
): GenreCoverage | null {
  const canonicalKey = getCanonicalKey(genre);
  if (!canonicalKey) {
    return null;
  }

  return coverageMap.get(canonicalKey) ?? null;
}

/**
 * Clear cache (useful for testing or when data changes)
 */
export function clearCoverageCache(): void {
  coverageCache.clear();
}
