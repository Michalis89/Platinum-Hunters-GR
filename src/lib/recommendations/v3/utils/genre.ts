/**
 * Genre utilities for V3
 *
 * Wraps the shared getCanonicalKey with helpers specific to the v3 pipeline.
 */

import { getCanonicalKey } from '../../core/genre-normalization';

export { getCanonicalKey };

/** Normalize a list of raw genre strings, deduplicated */
export function normalizeGenres(genres: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const g of genres) {
    const key = getCanonicalKey(g);
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(key);
    }
  }
  return result;
}

/**
 * Compute the overlap count between two sets of canonical genre keys.
 */
export function genreOverlap(a: string[], b: string[]): number {
  const setA = new Set(a);
  return b.filter(g => setA.has(g)).length;
}

/**
 * Given a list of raw genres and a set of canonical loved keys,
 * return the count and fraction of genres that are loved.
 */
export function lovedGenreScore(
  rawGenres: string[],
  lovedKeys: Set<string>,
): { count: number; fraction: number } {
  const normalized = normalizeGenres(rawGenres);
  const count = normalized.filter(g => lovedKeys.has(g)).length;
  return { count, fraction: normalized.length > 0 ? count / normalized.length : 0 };
}
