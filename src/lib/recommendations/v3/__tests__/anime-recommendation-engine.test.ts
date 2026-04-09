import { buildAnimeRecommendations } from '../anime/anime-recommendation-engine';
import { buildAnimeTasteProfile } from '../anime/anime-taste-engine';
import type { MediaCandidate, MediaHistoryEntry } from '../types';

function historyEntry(params: {
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
    updatedAt: new Date(0).toISOString(),
    media: {
      id: params.id,
      title: params.title,
      category: 'anime',
      genres: params.genres,
    },
  };
}

function candidate(params: {
  id: number;
  title: string;
  genres: string[];
}): MediaCandidate {
  return {
    id: params.id,
    title: params.title,
    cover: '',
    slug: params.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-'),
    category: 'anime',
    genres: params.genres,
    themes: [],
    platforms: [],
    popularityScore: 0,
  };
}

describe('buildAnimeRecommendations', () => {
  it('prioritizes continuation-first backlog picks and premium/battle best-fit balance', () => {
    const history: MediaHistoryEntry[] = [
      historyEntry({ id: 1, title: 'One-Punch Man', status: 'completed', score: 8, genres: ['Action', 'Comedy', 'Super Power'] }),
      historyEntry({ id: 2, title: 'One-Punch Man Season 2', status: 'completed', score: 7.5, genres: ['Action', 'Comedy', 'Super Power'] }),
      historyEntry({ id: 3, title: 'Mushoku Tensei: Jobless Reincarnation', status: 'completed', score: 7.5, genres: ['Adventure', 'Drama', 'Fantasy', 'Isekai'] }),
      historyEntry({ id: 4, title: 'Mushoku Tensei: Jobless Reincarnation Part 2', status: 'completed', score: 8, genres: ['Adventure', 'Drama', 'Fantasy', 'Isekai'] }),
      historyEntry({ id: 5, title: "Frieren: Beyond Journey's End", status: 'completed', score: 10, favorite: true, genres: ['Adventure', 'Award Winning', 'Drama', 'Fantasy'] }),
      historyEntry({ id: 6, title: 'Jujutsu Kaisen', status: 'completed', score: 9.5, favorite: true, genres: ['Action', 'Shounen', 'Supernatural'] }),
      historyEntry({ id: 7, title: 'Re:ZERO -Starting Life in Another World-', status: 'current', genres: ['Drama', 'Fantasy', 'Psychological', 'Suspense', 'Time Travel'] }),
    ];

    const backlog: MediaHistoryEntry[] = [
      historyEntry({ id: 101, title: 'Mushoku Tensei: Jobless Reincarnation Season 3', status: 'planned', genres: ['Adventure', 'Drama', 'Fantasy', 'Isekai', 'Reincarnation'] }),
      historyEntry({ id: 102, title: 'One-Punch Man Season 3', status: 'planned', genres: ['Action', 'Comedy', 'Parody', 'Seinen', 'Super Power'] }),
      historyEntry({ id: 103, title: 'Fullmetal Alchemist: Brotherhood', status: 'planned', genres: ['Action', 'Adventure', 'Drama', 'Fantasy', 'Military', 'Shounen'] }),
      historyEntry({ id: 104, title: 'Bleach', status: 'planned', genres: ['Action', 'Adventure', 'Shounen', 'Supernatural'] }),
      historyEntry({ id: 105, title: 'Dragon Ball Z: Dead Zone', status: 'planned', genres: ['Action', 'Adventure', 'Comedy', 'Fantasy', 'Shounen'] }),
      historyEntry({ id: 106, title: 'Dragon Ball Z: The Worlds Strongest', status: 'planned', genres: ['Action', 'Adventure', 'Comedy', 'Fantasy', 'Shounen'] }),
      historyEntry({ id: 107, title: 'Dragon Ball Z: Bio-Broly', status: 'planned', genres: ['Action', 'Adventure', 'Comedy', 'Fantasy', 'Shounen'] }),
    ];

    const candidates: MediaCandidate[] = [
      candidate({ id: 201, title: "Frieren: Beyond Journey's End Season 2", genres: ['Adventure', 'Drama', 'Fantasy', 'Award Winning'] }),
      candidate({ id: 202, title: 'Re:ZERO -Starting Life in Another World- Season 3', genres: ['Drama', 'Fantasy', 'Psychological', 'Suspense', 'Time Travel'] }),
      candidate({ id: 203, title: 'Mob Psycho 100 III', genres: ['Action', 'Comedy', 'Supernatural', 'Super Power'] }),
      candidate({ id: 204, title: 'Psycho-Pass', genres: ['Action', 'Psychological', 'Sci-Fi', 'Suspense'] }),
      candidate({ id: 205, title: 'Dragon Ball Z: Movie Special', genres: ['Action', 'Adventure', 'Fantasy', 'Shounen'] }),
    ];

    const taste = buildAnimeTasteProfile(history);
    const result = buildAnimeRecommendations({
      history,
      backlog,
      databaseCandidates: candidates,
      taste,
    });

    const backlogTitles = result.backlogPicks.map(item => item.title);
    expect(backlogTitles).toHaveLength(4);
    expect(backlogTitles[0]).toBe('Mushoku Tensei: Jobless Reincarnation Season 3');
    expect(backlogTitles[1]).toBe('One-Punch Man Season 3');
    expect(backlogTitles).toContain('Fullmetal Alchemist: Brotherhood');
    expect(backlogTitles).toContain('Bleach');

    const possibleTitles = result.possibleNext.map(item => item.title);
    expect(possibleTitles).toHaveLength(4);
    expect(possibleTitles).toContain("Frieren: Beyond Journey's End Season 2");
    expect(possibleTitles).toContain('Re:ZERO -Starting Life in Another World- Season 3');
    expect(possibleTitles).toContain('Mob Psycho 100 III');
    expect(possibleTitles).toContain('Psycho-Pass');
  });
});
