import { UNTITLED_FALLBACK } from '@/lib/constants/messages';
import type { TitlePriority } from '../types';

/**
 * Resolves media title based on category-specific priority
 * Iterates through priority list and returns the first non-empty value
 *
 * @param mediaRow - Database row containing title fields
 * @param priorities - Ordered list of title field names to check
 * @returns Resolved title or UNTITLED_FALLBACK if none found
 *
 * @example
 * resolveTitle(
 *   { title_english: 'Attack on Titan', title_romaji: 'Shingeki no Kyojin' },
 *   ['title_english', 'title_romaji', 'title_native']
 * )
 * // Returns: 'Attack on Titan'
 */
export function resolveTitle(mediaRow: Record<string, unknown>, priorities: TitlePriority): string {
  for (const field of priorities) {
    const value = mediaRow[field];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return UNTITLED_FALLBACK;
}
