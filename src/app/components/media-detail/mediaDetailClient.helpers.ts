import {
  CATEGORY_CONFIG,
  type MediaCategory,
  type MediaEntry,
  type SearchResult,
} from '@/app/components/backlog/types';
import type { MediaEntryState, MediaItem } from '@/lib/media/types';

export const resolveTitle = (item: MediaItem) =>
  item.title ||
  item.title_english ||
  item.title_romaji ||
  item.title_native ||
  item.original_title ||
  'Untitled';

export const resolveSubtitle = (item: MediaItem, title: string) => {
  const candidates = [
    item.original_title,
    item.title_romaji,
    item.title_english,
    item.title_native,
  ];
  return candidates.find(value => value && value !== title) || '';
};

export const resolveYear = (item: MediaItem) =>
  item.season_year?.toString() ||
  item.release_date?.slice(0, 4) ||
  item.first_air_date?.slice(0, 4) ||
  item.start_date?.slice(0, 4) ||
  item.first_release_date?.slice(0, 4) ||
  undefined;

export const igdbImageUrl = (imageId: string, size: 't_1080p' | 't_screenshot_big' = 't_1080p') =>
  `https://images.igdb.com/igdb/image/upload/${size}/${imageId}.jpg`;

export const getStatusLabel = (category: MediaCategory, entry: MediaEntryState | null) => {
  if (!entry) {
    return 'Not in library';
  }
  const config = CATEGORY_CONFIG[category];
  if (entry.status === 'planned') {
    return config.plannedLabel;
  }
  if (entry.status === 'current') {
    return config.currentLabel;
  }
  if (entry.status === 'completed') {
    return config.completedLabel;
  }
  return config.droppedLabel;
};

export const getProgressDisplay = (
  category: MediaCategory,
  entry: MediaEntryState | null,
  media: MediaItem,
): string => {
  if (!entry || typeof entry.progress !== 'number') {
    return '-';
  }

  if (category === 'games') {
    return `${entry.progress}h played`;
  }
  if (category === 'books') {
    const total = media.page_count ?? null;
    return total ? `${entry.progress} / ${total} pages` : `${entry.progress} pages`;
  }
  if (category === 'manga') {
    const total = media.volumes ?? media.chapters ?? null;
    return total ? `${entry.progress} / ${total}` : `${entry.progress}`;
  }
  if (category === 'movies') {
    const total = media.runtime ?? null;
    return total ? `${entry.progress} / ${total} min` : `${entry.progress} min`;
  }
  const total = media.episodes ?? media.number_of_episodes ?? null;
  return total ? `${entry.progress} / ${total} episodes` : `${entry.progress} episodes`;
};

export const buildEntry = (item: MediaItem, entryState: MediaEntryState | null) => {
  const title = resolveTitle(item);
  const subtitle = resolveSubtitle(item, title);
  const year = resolveYear(item);
  const cover = item.cover_image_large || item.cover_image_medium || '/og-image.jpg';

  return {
    id: `media-${item.id}`,
    updatedAt: entryState?.updatedAt ?? entryState?.completedAt ?? undefined,
    entryId: entryState?.entryId,
    mediaId: item.id,
    status: entryState?.status ?? 'planned',
    isFavorite: entryState?.favorite ?? false,
    score:
      entryState?.rating !== null && entryState?.rating !== undefined ? `${entryState.rating}` : '',
    progress: entryState?.progress ?? undefined,
    notes: entryState?.notes ?? undefined,
    selectedPlatform: entryState?.selectedPlatform ?? undefined,
    title,
    subtitle,
    year,
    tags: item.genres ?? [],
    cover,
    totalEpisodes: item.episodes ?? item.number_of_episodes ?? undefined,
    totalChapters: item.chapters ?? undefined,
    totalVolumes: item.volumes ?? undefined,
    totalRuntime: item.runtime ?? undefined,
    totalPages: item.page_count ?? undefined,
    format: item.format ?? undefined,
    description: item.description ?? undefined,
    runtime: item.runtime ?? undefined,
    platforms: item.platforms ?? undefined,
    developer: item.developer ?? undefined,
    publisher: item.publisher ?? undefined,
    metacritic: item.metacritic ?? undefined,
  } as MediaEntry & Partial<SearchResult>;
};
