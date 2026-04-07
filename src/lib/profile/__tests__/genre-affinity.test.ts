import { computeGenreAffinity } from '@/lib/profile/genre-affinity';

describe('computeGenreAffinity anime weighting', () => {
  it('dampens weak metadata genres versus core genres', () => {
    const result = computeGenreAffinity([
      {
        title: 'Jujutsu Kaisen',
        category: 'anime',
        status: 'completed',
        score: 9,
        is_favorite: false,
        progress: null,
        genres: ['Action', 'Shounen'],
      },
      {
        title: 'Attack on Titan',
        category: 'anime',
        status: 'completed',
        score: 8,
        is_favorite: false,
        progress: null,
        genres: ['Action', 'Drama'],
      },
    ]);

    const anime = result.anime ?? [];
    const action = anime.find(item => item.genre === 'Action');
    const shounen = anime.find(item => item.genre === 'Shounen');

    expect(action).toBeDefined();
    expect(shounen).toBeDefined();
    expect((action?.score ?? 0) / (shounen?.score ?? 1)).toBeGreaterThan(2.5);
  });

  it('applies diminishing returns to repeated franchise entries', () => {
    const result = computeGenreAffinity([
      {
        title: 'Jujutsu Kaisen',
        category: 'anime',
        status: 'completed',
        score: 8,
        is_favorite: false,
        progress: null,
        genres: ['Action'],
      },
      {
        title: 'Jujutsu Kaisen 0',
        category: 'anime',
        status: 'completed',
        score: 8,
        is_favorite: false,
        progress: null,
        genres: ['Action'],
      },
      {
        title: 'Jujutsu Kaisen Season 2',
        category: 'anime',
        status: 'completed',
        score: 8,
        is_favorite: false,
        progress: null,
        genres: ['Action'],
      },
    ]);

    const anime = result.anime ?? [];
    const action = anime.find(item => item.genre === 'Action');

    expect(action).toBeDefined();
    // 1.5 * 1.2 * (1 + 0.55 + 0.35) = 3.42
    expect(action?.score).toBeCloseTo(3.42, 2);
  });

  it('keeps in-progress contribution below completed evidence', () => {
    const result = computeGenreAffinity([
      {
        title: 'Re:ZERO -Starting Life in Another World-',
        category: 'anime',
        status: 'current',
        score: null,
        is_favorite: false,
        progress: null,
        genres: ['Fantasy'],
      },
      {
        title: 'Frieren: Beyond Journey\'s End',
        category: 'anime',
        status: 'completed',
        score: 9,
        is_favorite: false,
        progress: null,
        genres: ['Fantasy'],
      },
      {
        title: 'Mushoku Tensei: Jobless Reincarnation',
        category: 'anime',
        status: 'completed',
        score: 8,
        is_favorite: false,
        progress: null,
        genres: ['Fantasy'],
      },
    ]);

    const anime = result.anime ?? [];
    const fantasy = anime.find(item => item.genre === 'Fantasy');

    expect(fantasy).toBeDefined();
    // Completed contributions dominate and current is capped.
    expect(fantasy?.score).toBeGreaterThan(4);
    expect(fantasy?.strongSignalCount).toBe(2);
  });
});
