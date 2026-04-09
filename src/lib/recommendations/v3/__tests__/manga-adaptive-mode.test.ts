import { evaluateMangaRichnessSignals, inferMangaRecommendationMode } from '../adapters/manga.adapter';
import type { MediaHistoryEntry } from '../types';

function entry(params: {
  id: number;
  title: string;
  status: MediaHistoryEntry['status'];
  genres: string[];
  score?: number | null;
  favorite?: boolean;
}): MediaHistoryEntry {
  return {
    id: params.id,
    mediaId: params.id,
    status: params.status,
    score: params.score ?? null,
    progress: null,
    priority: null,
    isFavorite: params.favorite ?? false,
    pinnedRank: null,
    updatedAt: '2026-04-08T00:00:00.000Z',
    media: {
      id: params.id,
      title: params.title,
      category: 'manga',
      genres: params.genres,
    },
  };
}

describe('manga adaptive mode activation', () => {
  it('activates full mode when at least 3 richness signals are satisfied', () => {
    const history: MediaHistoryEntry[] = [
      entry({ id: 1, title: 'Jujutsu Kaisen', status: 'current', genres: ['Action', 'Shounen', 'Supernatural'], score: 9, favorite: true }),
      entry({ id: 2, title: 'Jujutsu Kaisen 0', status: 'completed', genres: ['Action', 'Shounen', 'Supernatural'], score: 10, favorite: true }),
      entry({ id: 3, title: 'Naruto', status: 'current', genres: ['Action', 'Adventure', 'Fantasy', 'Shounen'], score: 8 }),
      entry({ id: 4, title: 'Naruto Shippuden', status: 'completed', genres: ['Action', 'Adventure', 'Fantasy', 'Shounen'], score: 8.5 }),
      entry({ id: 5, title: "Frieren: Beyond Journey's End", status: 'completed', genres: ['Adventure', 'Award Winning', 'Drama', 'Fantasy', 'Shounen'], score: 9 }),
      entry({ id: 6, title: 'Berserk', status: 'completed', genres: ['Action', 'Adventure', 'Drama', 'Fantasy', 'Seinen'], score: 9 }),
      entry({ id: 7, title: 'Monster', status: 'completed', genres: ['Drama', 'Mystery', 'Psychological'], score: 8 }),
      entry({ id: 8, title: 'One Piece', status: 'current', genres: ['Action', 'Adventure', 'Fantasy', 'Shounen'], score: 8 }),
    ];

    const signals = evaluateMangaRichnessSignals(history);

    expect(signals.satisfiedSignals).toBeGreaterThanOrEqual(3);
    expect(inferMangaRecommendationMode(history)).toBe('full');
  });

  it('keeps small-data mode when fewer than 3 richness signals are satisfied', () => {
    const history: MediaHistoryEntry[] = [
      entry({ id: 1, title: 'Jujutsu Kaisen 0', status: 'completed', genres: ['Action', 'School', 'Shounen', 'Supernatural'], score: 10, favorite: true }),
      entry({ id: 2, title: 'Jujutsu Kaisen', status: 'current', genres: ['Action', 'School', 'Shounen', 'Supernatural'], score: 9, favorite: true }),
      entry({ id: 3, title: "Frieren: Beyond Journey's End", status: 'current', genres: ['Adventure', 'Drama', 'Fantasy', 'Shounen'], score: null }),
    ];

    const signals = evaluateMangaRichnessSignals(history);

    expect(signals.satisfiedSignals).toBeLessThan(3);
    expect(inferMangaRecommendationMode(history)).toBe('small-data');
  });
});
