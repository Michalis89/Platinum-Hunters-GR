import 'whatwg-fetch';

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

import { GET as getGame } from '@/app/api/admin/igdb/game/route';
import { GET as getSearch } from '@/app/api/admin/igdb/search/route';
import { fetchIgdbGameDetails, mapIgdbToPayload } from '@/lib/services/igdbService';
import { igdbImage, igdbPost, unixToDate } from '@/lib/igdb/igdbClient';
import {
  getIgdbCategoryLabel,
  igdbAllowedCategoriesWhereClause,
  isAllowedIgdbCategory,
  isAllowedIgdbGameCandidate,
} from '@/lib/igdb/categories';

jest.mock('@/lib/observability/withApiRoute', () => ({
  __esModule: true,
  withApiRoute: (handler: unknown) => handler,
}));

jest.mock('@/lib/services/igdbService', () => ({
  __esModule: true,
  fetchIgdbGameDetails: jest.fn(),
  mapIgdbToPayload: jest.fn(),
}));

jest.mock('@/lib/igdb/igdbClient', () => ({
  __esModule: true,
  igdbImage: jest.fn(),
  igdbPost: jest.fn(),
  unixToDate: jest.fn(),
}));

jest.mock('@/lib/igdb/categories', () => ({
  __esModule: true,
  getIgdbCategoryLabel: jest.fn(),
  igdbAllowedCategoriesWhereClause: jest.fn(),
  isAllowedIgdbGameCandidate: jest.fn(),
  isAllowedIgdbCategory: jest.fn(),
}));

describe('admin IGDB routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (igdbImage as jest.Mock).mockImplementation((imageId: string | null, size: string) =>
      imageId ? `${imageId}-${size}` : null,
    );
    (getIgdbCategoryLabel as jest.Mock).mockImplementation((category: number | null | undefined) =>
      category == null ? 'Unknown' : `Category ${category}`,
    );
  });

  describe('game route', () => {
    it('returns 400 for invalid ids', async () => {
      const response = await getGame(new Request('https://example.com/api/admin/igdb/game?id=0'));
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: 'Invalid id' });
    });

    it('returns 404 when the game is not found', async () => {
      (fetchIgdbGameDetails as jest.Mock).mockResolvedValue(null);

      const response = await getGame(new Request('https://example.com/api/admin/igdb/game?id=42'));

      expect(fetchIgdbGameDetails).toHaveBeenCalledWith(42, { mainGameOnly: false });
      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({ error: 'Game not found' });
    });

    it('returns 422 for unsupported IGDB categories', async () => {
      (fetchIgdbGameDetails as jest.Mock).mockResolvedValue({
        category: 9,
        name: 'Game',
        slug: 'game',
      });
      (isAllowedIgdbGameCandidate as jest.Mock).mockReturnValue(false);

      const response = await getGame(new Request('https://example.com/api/admin/igdb/game?id=42'));

      expect(response.status).toBe(422);
      await expect(response.json()).resolves.toEqual({
        ok: false,
        error: 'Unsupported IGDB category',
        category: 'Category 9',
      });
    });

    it('maps a valid game payload into the response', async () => {
      (fetchIgdbGameDetails as jest.Mock).mockResolvedValue({
        category: 1,
        name: 'Game',
        slug: 'game',
      });
      (isAllowedIgdbGameCandidate as jest.Mock).mockReturnValue(true);
      (mapIgdbToPayload as jest.Mock).mockReturnValue({
        igdb_id: 99,
        igdb_category: 1,
        title: 'Mapped Game',
        igdb_slug: 'mapped-game',
        summary: 'summary',
        storyline: 'story',
        first_release_date: '2025-01-15',
        season_year: 2025,
        platforms: ['PC'],
        genres: ['RPG'],
        igdb_themes: ['Fantasy'],
        igdb_game_modes: ['Single-player'],
        igdb_player_perspectives: ['Third person'],
        developer: 'FromSoft',
        publisher: 'Bandai',
        cover_image_id: 'cover1',
        cover_url_big: 'cover1-big',
        igdb_artwork_image_ids: ['art1'],
        igdb_screenshot_image_ids: ['shot1'],
        aggregated_rating: 90,
        aggregated_rating_count: 100,
        rating: 92,
        rating_count: 200,
        official_website: 'https://example.com',
        igdb_updated_at: '2025-01-16T00:00:00.000Z',
      });

      const response = await getGame(new Request('https://example.com/api/admin/igdb/game?id=42'));

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        id: 99,
        igdb_category: 1,
        name: 'Mapped Game',
        slug: 'mapped-game',
        summary: 'summary',
        storyline: 'story',
        first_release_date: '2025-01-15T00:00:00.000Z',
        year: 2025,
        platforms: ['PC'],
        genres: ['RPG'],
        themes: ['Fantasy'],
        game_modes: ['Single-player'],
        player_perspectives: ['Third person'],
        developers: ['FromSoft'],
        publishers: ['Bandai'],
        cover_image_id: 'cover1',
        cover_big: 'cover1-big',
        cover_1080p: 'cover1-t_1080p',
        artworks_1080p: ['art1-t_1080p'],
        screenshots_1080p: ['shot1-t_1080p'],
        aggregated_rating: 90,
        aggregated_rating_count: 100,
        rating: 92,
        rating_count: 200,
        official_website: 'https://example.com',
        igdb_updated_at: '2025-01-16T00:00:00.000Z',
      });
    });

    it('returns null first_release_date when the mapped payload does not include a release date', async () => {
      (fetchIgdbGameDetails as jest.Mock).mockResolvedValue({
        category: 1,
        name: 'Game',
        slug: null,
      });
      (isAllowedIgdbGameCandidate as jest.Mock).mockReturnValue(true);
      (mapIgdbToPayload as jest.Mock).mockReturnValue({
        igdb_id: 1,
        igdb_category: 1,
        title: 'Mapped Game',
        igdb_slug: null,
        summary: null,
        storyline: null,
        first_release_date: null,
        season_year: null,
        platforms: [],
        genres: [],
        igdb_themes: [],
        igdb_game_modes: [],
        igdb_player_perspectives: [],
        developer: null,
        publisher: null,
        cover_image_id: null,
        cover_url_big: null,
        igdb_artwork_image_ids: [],
        igdb_screenshot_image_ids: [],
        aggregated_rating: null,
        aggregated_rating_count: null,
        rating: null,
        rating_count: null,
        official_website: null,
        igdb_updated_at: null,
      });

      const response = await getGame(new Request('https://example.com/api/admin/igdb/game?id=7'));
      await expect(response.json()).resolves.toMatchObject({
        first_release_date: null,
        developers: [],
        publishers: [],
      });
    });
  });

  describe('search route', () => {
    it('returns an empty result set for blank queries', async () => {
      const response = await getSearch(
        new Request('https://example.com/api/admin/igdb/search?q=%20%20'),
      );
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ results: [] });
      expect(igdbPost).not.toHaveBeenCalled();
    });

    it('uses strict search results when available and normalizes valid games', async () => {
      (igdbAllowedCategoriesWhereClause as jest.Mock).mockReturnValue('1,2');
      (igdbPost as jest.Mock).mockResolvedValueOnce([
        {
          id: 1,
          name: '  Elden Ring  ',
          category: 1,
          slug: 'elden-ring',
          first_release_date: 123,
          summary: 'summary',
          cover: { image_id: 'img1' },
        },
        {
          id: 2,
          name: '',
          category: 1,
          slug: 'blank',
        },
      ]);
      (unixToDate as jest.Mock).mockReturnValue(new Date('2025-01-01T00:00:00.000Z'));
      (isAllowedIgdbCategory as jest.Mock).mockImplementation(
        (category: number | null) => category === 1,
      );
      (isAllowedIgdbGameCandidate as jest.Mock).mockReturnValue(false);

      const response = await getSearch(
        new Request('https://example.com/api/admin/igdb/search?q=ring'),
      );

      expect(igdbPost).toHaveBeenCalledTimes(1);
      expect(String((igdbPost as jest.Mock).mock.calls[0][1])).toContain('search "ring";');
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        results: [
          {
            id: 1,
            name: 'Elden Ring',
            category: 1,
            categoryLabel: 'Category 1',
            slug: 'elden-ring',
            firstReleaseDate: '2025-01-01T00:00:00.000Z',
            year: 2025,
            coverImageId: 'img1',
            coverUrlThumb: 'img1-t_cover_small',
            coverUrlBig: 'img1-t_cover_big',
            summary: 'summary',
          },
        ],
      });
    });

    it('falls back to the broader query when strict results are empty', async () => {
      (igdbAllowedCategoriesWhereClause as jest.Mock).mockReturnValue('1,2');
      (igdbPost as jest.Mock).mockResolvedValueOnce([]).mockResolvedValueOnce([
        {
          id: 3,
          name: 'Fallback Game',
          category: null,
          slug: null,
          first_release_date: null,
          summary: null,
          cover: null,
        },
      ]);
      (unixToDate as jest.Mock).mockReturnValue(null);
      (isAllowedIgdbCategory as jest.Mock).mockReturnValue(false);
      (isAllowedIgdbGameCandidate as jest.Mock).mockReturnValue(true);

      const response = await getSearch(
        new Request('https://example.com/api/admin/igdb/search?q=test'),
      );

      expect(igdbPost).toHaveBeenCalledTimes(2);
      expect(String((igdbPost as jest.Mock).mock.calls[1][1])).toContain('limit 40;');
      await expect(response.json()).resolves.toEqual({
        results: [
          {
            id: 3,
            name: 'Fallback Game',
            category: null,
            categoryLabel: 'Unknown',
            slug: null,
            firstReleaseDate: null,
            year: null,
            coverImageId: null,
            coverUrlThumb: null,
            coverUrlBig: null,
            summary: null,
          },
        ],
      });
    });

    it('filters disallowed fallback results and escapes quotes in the search term', async () => {
      (igdbAllowedCategoriesWhereClause as jest.Mock).mockReturnValue('1,2');
      (igdbPost as jest.Mock).mockResolvedValueOnce([]).mockResolvedValueOnce([
        {
          id: 4,
          name: 'Denied Game',
          category: 9,
          slug: 'denied',
          first_release_date: null,
          summary: null,
          cover: null,
        },
      ]);
      (unixToDate as jest.Mock).mockReturnValue(null);
      (isAllowedIgdbCategory as jest.Mock).mockReturnValue(false);
      (isAllowedIgdbGameCandidate as jest.Mock).mockReturnValue(false);

      const response = await getSearch(
        new Request('https://example.com/api/admin/igdb/search?q=a%22b'),
      );

      expect(String((igdbPost as jest.Mock).mock.calls[0][1])).toContain('search "a\\"b";');
      await expect(response.json()).resolves.toEqual({ results: [] });
    });

    it('handles non-array strict and fallback responses safely', async () => {
      (igdbAllowedCategoriesWhereClause as jest.Mock).mockReturnValue('1,2');
      (igdbPost as jest.Mock).mockResolvedValueOnce({ not: 'an-array' }).mockResolvedValueOnce({
        still: 'not-an-array',
      });

      const response = await getSearch(
        new Request('https://example.com/api/admin/igdb/search?q=safe'),
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ results: [] });
    });
  });
});
