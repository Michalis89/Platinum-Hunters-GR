import {
  buildEntry,
  getProgressDisplay,
  getStatusLabel,
  igdbImageUrl,
  resolveSubtitle,
  resolveTitle,
  resolveYear,
} from '@/app/components/media-detail/mediaDetailClient.helpers';
import type { MediaEntryState, MediaItem } from '@/lib/media/types';

const baseItem: MediaItem = {
  id: 7,
  title: 'Main Title',
  genres: ['Action'],
} as MediaItem;

describe('mediaDetailClient.helpers', () => {
  it('resolves title fallback chain', () => {
    expect(resolveTitle(baseItem)).toBe('Main Title');
    expect(resolveTitle({ id: 1, title_english: 'English' } as MediaItem)).toBe('English');
    expect(resolveTitle({ id: 1 } as MediaItem)).toBe('Untitled');
  });

  it('resolves subtitle and year fallback chains', () => {
    expect(resolveSubtitle(baseItem, 'Main Title')).toBe('');
    expect(
      resolveSubtitle({ id: 1, original_title: 'Orig', title_english: 'Eng' } as MediaItem, 'Eng'),
    ).toBe('Orig');

    expect(resolveYear({ id: 1, season_year: 2025 } as MediaItem)).toBe('2025');
    expect(resolveYear({ id: 1, release_date: '2020-01-15' } as MediaItem)).toBe('2020');
    expect(resolveYear({ id: 1 } as MediaItem)).toBeUndefined();
  });

  it('builds igdb image urls', () => {
    expect(igdbImageUrl('abc')).toBe('https://images.igdb.com/igdb/image/upload/t_1080p/abc.jpg');
    expect(igdbImageUrl('abc', 't_screenshot_big')).toContain('/t_screenshot_big/abc.jpg');
  });

  it('returns status labels', () => {
    expect(getStatusLabel('games', null)).toBe('Not in library');
    expect(getStatusLabel('games', { status: 'planned' } as MediaEntryState)).toBe('Backlog');
    expect(getStatusLabel('games', { status: 'current' } as MediaEntryState)).toBe('Playing');
    expect(getStatusLabel('games', { status: 'completed' } as MediaEntryState)).toBe('Completed');
    expect(getStatusLabel('games', { status: 'dropped' } as MediaEntryState)).toBe('Dropped');
  });

  it('formats progress for each category', () => {
    expect(getProgressDisplay('games', null, baseItem)).toBe('-');
    expect(getProgressDisplay('games', { progress: 15 } as MediaEntryState, baseItem)).toBe(
      '15h played',
    );
    expect(
      getProgressDisplay(
        'books',
        { progress: 10 } as MediaEntryState,
        {
          ...baseItem,
          page_count: 200,
        } as MediaItem,
      ),
    ).toBe('10 / 200 pages');
    expect(
      getProgressDisplay(
        'manga',
        { progress: 4 } as MediaEntryState,
        {
          ...baseItem,
          volumes: 12,
        } as MediaItem,
      ),
    ).toBe('4 / 12');
    expect(
      getProgressDisplay(
        'movies',
        { progress: 40 } as MediaEntryState,
        {
          ...baseItem,
          runtime: 120,
        } as MediaItem,
      ),
    ).toBe('40 / 120 min');
    expect(
      getProgressDisplay(
        'anime',
        { progress: 3 } as MediaEntryState,
        {
          ...baseItem,
          episodes: 24,
        } as MediaItem,
      ),
    ).toBe('3 / 24 episodes');
  });

  it('builds entry payload from media and entry state', () => {
    const entryState = {
      entryId: 'e1',
      status: 'current',
      favorite: true,
      rating: 8.5,
      progress: 12,
      notes: 'hello',
      selectedPlatform: 'PC',
      updatedAt: '2026-01-01',
    } as MediaEntryState;
    const item = {
      ...baseItem,
      title: 'My Item',
      title_romaji: 'Romaji',
      cover_image_large: '/cover.jpg',
      episodes: 12,
    } as MediaItem;

    const result = buildEntry(item, entryState);

    expect(result).toMatchObject({
      id: 'media-7',
      mediaId: 7,
      status: 'current',
      isFavorite: true,
      score: '8.5',
      progress: 12,
      notes: 'hello',
      selectedPlatform: 'PC',
      title: 'My Item',
      subtitle: 'Romaji',
      cover: '/cover.jpg',
      totalEpisodes: 12,
    });
  });
});
