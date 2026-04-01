import { DEFAULT_COVER } from '@/lib/constants/messages';
import type { MediaCategoryConfig } from '../config';
import type { LibraryRow } from '../types';
import { resolveTitle } from './title-resolver';

/**
 * Mapped library entry returned to the client
 */
export type MappedLibraryEntry = {
  id: string;
  entryId: number;
  mediaId: number;
  externalId?: number;
  status: string;
  isFavorite: boolean;
  importSource?: string;
  catalogSource?: string;
  priority: number;
  score?: string;
  progress?: number;
  notes?: string;
  selectedPlatform?: string;
  title: string;
  subtitle: string;
  year?: string;
  tags: string[];
  cover: string;
  description?: string;
  // Category-specific fields
  totalEpisodes?: number;
  totalChapters?: number;
  totalVolumes?: number;
  totalRuntime?: number;
  totalPages?: number;
  format?: string;
  platforms?: string[];
  developer?: string;
  publisher?: string;
  metacritic?: number;
  runtime?: number;
  igdbCategory?: number;
  authors?: string[];
  studios?: string[];
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is string | number => typeof item === 'string' || typeof item === 'number')
    .map(item => String(item).trim())
    .filter(Boolean);
}

function normalizeSteamCoverUrl(url: string | undefined, steamAppId?: number): string | undefined {
  if (!url) {
    return undefined;
  }

  // Old fallback we used: /steam/apps/{appid}/header.jpg can 404 for some titles.
  if (
    steamAppId &&
    url === `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamAppId}/header.jpg`
  ) {
    return undefined;
  }

  if (
    url.includes('cdn.cloudflare.steamstatic.com/steam/apps/') &&
    !url.includes('/steamcommunity/public/images/apps/')
  ) {
    return url.replace('/steam/apps/', '/steamcommunity/public/images/apps/');
  }

  return url;
}

/**
 * Maps a database library row to client-friendly format
 * Handles category-specific field differences (episodes, chapters, pages, etc.)
 *
 * @param row - Database row from user_media_entries join with media_items
 * @param config - Category configuration
 * @returns Mapped entry or null if media_items is missing
 */
export function mapLibraryEntry(
  row: LibraryRow,
  config: MediaCategoryConfig,
): MappedLibraryEntry | null {
  const media = row.media_items;
  if (!media) {
    return null;
  }

  // Validate that media has a valid ID
  if (!media.id || typeof media.id !== 'number' || !Number.isFinite(media.id)) {
    console.warn('Invalid media.id in library entry:', { entryId: row.id, mediaId: media.id });
    return null;
  }

  // Resolve title based on category priority
  const title = resolveTitle(media, config.titlePriority);

  // Subtitle logic varies by category
  let subtitle = '';
  if (config.key === 'anime') {
    subtitle = (media.title_romaji as string) || (media.title_english as string) || '';
  } else if (config.key === 'books') {
    const tagList = Array.isArray(media.tags) ? media.tags.map(String) : [];
    subtitle = tagList.length > 0 ? tagList.join(', ') : '';
  } else if (config.key === 'movies') {
    const originalTitle = media.original_title as string | undefined;
    subtitle = originalTitle && originalTitle !== title ? originalTitle : '';
  }

  // Year extraction
  const year =
    (media.season_year as number | undefined)?.toString() ||
    (media.start_date as string | undefined)?.slice(0, 4) ||
    (media.release_date as string | undefined)?.slice(0, 4) ||
    (media.first_air_date as string | undefined)?.slice(0, 4) ||
    undefined;

  // Genres/tags
  const tags = Array.isArray(media.genres) ? media.genres.map(String) : [];
  const platforms = Array.isArray(media.platforms) ? media.platforms.map(String) : [];

  // Cover image
  const mediaSource = (media.source as string | null) ?? undefined;
  const inferredSource =
    mediaSource ||
    (typeof media.steam_app_id === 'number'
      ? 'steam'
      : typeof media.igdb_id === 'number'
        ? 'igdb'
        : typeof media.rawg_id === 'number'
          ? 'rawg'
          : undefined);
  const steamAppId = (media.steam_app_id as number | null) ?? undefined;
  const rawLarge = (media.cover_image_large as string) || undefined;
  const rawMedium = (media.cover_image_medium as string) || undefined;
  const igdbCoverBig = (media.cover_url_big as string) || undefined;
  const igdbCoverThumb = (media.cover_url_thumb as string) || undefined;

  const coverLarge =
    mediaSource === 'steam' ? normalizeSteamCoverUrl(rawLarge, steamAppId) : rawLarge;
  const coverMedium =
    mediaSource === 'steam' ? normalizeSteamCoverUrl(rawMedium, steamAppId) : rawMedium;

  const cover = igdbCoverBig || coverLarge || igdbCoverThumb || coverMedium || DEFAULT_COVER;

  // Base mapped entry
  const baseEntry: MappedLibraryEntry = {
    id: `entry-${row.id}`,
    entryId: row.id,
    mediaId: media.id as number,
    externalId:
      typeof media[config.externalId.field] === 'number'
        ? (media[config.externalId.field] as number)
        : undefined,
    status: row.status,
    isFavorite: row.is_favorite ?? false,
    importSource: row.import_source ?? undefined,
    catalogSource: inferredSource,
    priority: row.priority ?? 0,
    score: row.score?.toString() ?? undefined,
    progress: row.progress ?? undefined,
    notes: row.notes ?? undefined,
    selectedPlatform: row.selected_platform ?? undefined,
    title,
    subtitle,
    year,
    tags,
    cover,
    description: (media.description as string) ?? undefined,
  };

  // Add category-specific fields
  if (config.key === 'anime') {
    return {
      ...baseEntry,
      totalEpisodes: (media.episodes as number) ?? undefined,
      totalChapters: (media.chapters as number) ?? undefined,
      totalVolumes: (media.volumes as number) ?? undefined,
      format: (media.format as string) ?? undefined,
      studios: toStringArray(media.studios),
      authors: toStringArray(media.tags),
    };
  }

  if (config.key === 'books') {
    return {
      ...baseEntry,
      totalPages: (media.page_count as number) ?? undefined,
      authors: toStringArray(media.tags),
    };
  }

  if (config.key === 'movies') {
    return {
      ...baseEntry,
      totalRuntime: (media.runtime as number) ?? undefined,
      totalEpisodes: (media.number_of_episodes as number) ?? undefined,
    };
  }

  if (config.key === 'games') {
    return {
      ...baseEntry,
      platforms,
      developer: (media.developer as string) ?? undefined,
      publisher: (media.publisher as string) ?? undefined,
      metacritic: (media.metacritic as number) ?? undefined,
      runtime: (media.runtime as number) ?? undefined,
      igdbCategory: (media.igdb_category as number | undefined) ?? undefined,
    };
  }

  // Other categories
  return baseEntry;
}
