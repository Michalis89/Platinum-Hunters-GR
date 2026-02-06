/**
 * Type helpers for media items
 * Eliminates duplicate type casts across media routes
 */

import type { Database } from '@/lib/supabase/database.types';

/**
 * Full media item row type from database
 */
export type MediaItem = Database['public']['Tables']['media_items']['Row'];

/**
 * Media item insert type
 */
export type MediaItemInsert = Database['public']['Tables']['media_items']['Insert'];

/**
 * Media item update type
 */
export type MediaItemUpdate = Database['public']['Tables']['media_items']['Update'];

/**
 * Pick specific fields from MediaItem
 *
 * @example
 * type TitleFields = MediaItemPick<'title' | 'title_english' | 'category'>;
 */
export type MediaItemPick<T extends keyof MediaItem> = Pick<MediaItem, T>;

/**
 * Commonly used field combinations
 */
export type MediaItemTitle = MediaItemPick<
  'title' | 'title_english' | 'title_romaji' | 'title_native' | 'original_title'
>;

export type MediaItemBasic = MediaItemPick<
  | 'id'
  | 'category'
  | 'title'
  | 'title_english'
  | 'title_romaji'
  | 'title_native'
  | 'original_title'
  | 'description'
  | 'cover_image_large'
  | 'cover_image_medium'
  | 'genres'
>;

export type MediaItemWithDates = MediaItemBasic &
  MediaItemPick<'release_date' | 'first_air_date' | 'start_date' | 'season_year'>;

/**
 * User media entry types
 */
export type UserMediaEntry = Database['public']['Tables']['user_media_entries']['Row'];
export type UserMediaEntryInsert = Database['public']['Tables']['user_media_entries']['Insert'];
export type UserMediaEntryUpdate = Database['public']['Tables']['user_media_entries']['Update'];

/**
 * Pick specific fields from UserMediaEntry
 */
export type UserMediaEntryPick<T extends keyof UserMediaEntry> = Pick<UserMediaEntry, T>;
