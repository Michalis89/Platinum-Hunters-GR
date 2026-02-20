import type { ExternalIdConfig, MediaPayload, TitlePriority } from './types';

/**
 * Media category keys supported by the factory
 */
export type MediaCategoryKey = 'anime' | 'books' | 'games' | 'movies';

/**
 * Configuration for a media category
 */
export type MediaCategoryConfig = {
  /** Unique key identifying the category */
  key: MediaCategoryKey;

  /** Subcategories that share this configuration (e.g., ['anime', 'manga'] or ['movies', 'tv']) */
  subcategories: string[];

  /** Configuration for the external ID field */
  externalId: ExternalIdConfig;

  /** Priority order for resolving media titles */
  titlePriority: TitlePriority;

  /** Optional data enrichment function (e.g., fetching additional details from external API) */
  enricher?: (category: string, externalId: number) => Promise<Partial<MediaPayload>>;

  /** Optional payload transformation function for category-specific field mapping */
  payloadMapper?: (payload: Record<string, unknown>) => Record<string, unknown>;

  /** Error logging prefix for console output */
  logPrefix: string;

  /** Default category to use when category is not specified */
  defaultCategory: string;

  /** Query fields to select for library GET requests */
  librarySelectFields: string;

  /** Query fields to select for suggestions GET requests */
  suggestionsSelectFields: string;
};

/**
 * Category-specific configurations for all supported media types
 */
export const MEDIA_CATEGORY_CONFIGS: Record<MediaCategoryKey, MediaCategoryConfig> = {
  anime: {
    key: 'anime',
    subcategories: ['anime', 'manga'],
    externalId: { field: 'mal_id', type: 'number' },
    titlePriority: ['title_english', 'title_romaji', 'title_native'],
    logPrefix: 'Anime',
    defaultCategory: 'anime',
    librarySelectFields:
      'id,status,is_favorite,import_source,selected_platform,priority,score,progress,notes,media_items!inner(id,category,source,title_english,title_romaji,title_native,description,format,season_year,episodes,chapters,volumes,start_date,cover_image_large,cover_image_medium,genres)',
    suggestionsSelectFields:
      'media_id,score,media_items!inner(id,category,title_english,title_romaji,title_native,description,format,season_year,episodes,chapters,volumes,start_date,cover_image_large,cover_image_medium,genres)',
  },

  books: {
    key: 'books',
    subcategories: ['books'],
    externalId: { field: 'google_books_id', type: 'string' },
    titlePriority: ['title', 'original_title'],
    logPrefix: 'Books',
    defaultCategory: 'books',
    librarySelectFields:
      'id,status,is_favorite,import_source,selected_platform,priority,score,progress,notes,media_items!inner(id,category,source,title,original_title,description,release_date,page_count,cover_image_large,cover_image_medium,genres,tags)',
    suggestionsSelectFields:
      'media_id,score,media_items!inner(id,category,title,original_title,description,release_date,page_count,cover_image_large,cover_image_medium,genres,tags)',
  },

  games: {
    key: 'games',
    subcategories: ['games'],
    externalId: { field: 'igdb_id', type: 'number' },
    titlePriority: ['title', 'title_english'],
    logPrefix: 'Games',
    defaultCategory: 'games',
    librarySelectFields:
      'id,status,is_favorite,import_source,selected_platform,priority,score,progress,notes,media_items!inner(id,category,source,steam_app_id,rawg_id,igdb_id,igdb_category,igdb_slug,title,title_english,summary,storyline,description,first_release_date,release_date,cover_image_id,cover_url_thumb,cover_url_big,cover_image_large,cover_image_medium,genres,platforms,developer,publisher,aggregated_rating,aggregated_rating_count,rating,rating_count,igdb_themes,igdb_game_modes,igdb_player_perspectives,igdb_artwork_image_ids,igdb_screenshot_image_ids,official_website,runtime)',
    suggestionsSelectFields:
      'media_id,score,media_items!inner(id,category,title,title_english,description,season_year,release_date,cover_image_large,cover_image_medium,genres)',
    // payloadMapper will be set in enrichers.ts to avoid circular dependency
  },

  movies: {
    key: 'movies',
    subcategories: ['movies', 'tv'],
    externalId: { field: 'tmdb_id', type: 'number' },
    titlePriority: ['title', 'original_title', 'title_english', 'title_romaji', 'title_native'],
    logPrefix: 'Movies',
    defaultCategory: 'movies',
    librarySelectFields:
      'id,status,is_favorite,import_source,selected_platform,priority,score,progress,notes,media_items!inner(id,category,source,title,original_title,title_english,title_romaji,title_native,description,release_date,first_air_date,runtime,number_of_episodes,cover_image_large,cover_image_medium,banner_image,genres)',
    suggestionsSelectFields:
      'media_id,score,media_items!inner(id,category,title,original_title,title_english,title_romaji,title_native,description,release_date,first_air_date,runtime,number_of_episodes,cover_image_large,cover_image_medium,genres)',
    // enricher will be set in enrichers.ts to avoid circular dependency
  },
};
