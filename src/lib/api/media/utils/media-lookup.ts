import type { SupabaseClient } from '@supabase/supabase-js';
import type { MediaCategoryConfig } from '../config';
import type { ExternalIdValue } from '../types';

/**
 * Finds existing media item by external ID and category
 *
 * @param supabase - Supabase client instance
 * @param config - Category configuration with external ID field info
 * @param externalId - External ID value (mal_id, google_books_id, etc.)
 * @param category - Media category (anime, books, games, movies, etc.)
 * @returns Media ID if found, null otherwise
 *
 * @example
 * const mediaId = await findExistingMedia(supabase, config, 12345, 'anime');
 * // Returns: 789 (internal media_items.id) or null
 */
export async function findExistingMedia(
  supabase: SupabaseClient,
  config: MediaCategoryConfig,
  externalId: ExternalIdValue,
  category: string,
): Promise<number | null> {
  const { data } = await supabase
    .from('media_items')
    .select('id')
    .eq(config.externalId.field, externalId)
    .eq('category', category)
    .maybeSingle();

  return (data as { id?: number } | null)?.id ?? null;
}
