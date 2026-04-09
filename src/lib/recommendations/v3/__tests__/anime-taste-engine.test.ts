import { buildAnimeTasteProfile } from '../anime/anime-taste-engine';
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
    updatedAt: new Date(0).toISOString(),
    media: {
      id: params.id,
      title: params.title,
      category: 'anime',
      genres: params.genres,
    },
  };
}

describe('buildAnimeTasteProfile', () => {
  it('elevates premium fantasy axis from a unique 10/10 favorite and ignores backlog identity noise', () => {
    const baseHistory: MediaHistoryEntry[] = [
      entry({ id: 1, title: 'Jujutsu Kaisen', status: 'completed', score: 9.5, favorite: true, genres: ['Action', 'Shounen', 'Supernatural'] }),
      entry({ id: 2, title: 'Attack on Titan', status: 'completed', score: 8.5, genres: ['Action', 'Drama', 'Shounen'] }),
      entry({ id: 3, title: 'One-Punch Man Season 2', status: 'completed', score: 7.5, genres: ['Action', 'Comedy', 'Super Power'] }),
      entry({ id: 4, title: "Frieren: Beyond Journey's End", status: 'completed', score: 10, favorite: true, genres: ['Adventure', 'Drama', 'Fantasy', 'Award Winning'] }),
      entry({ id: 5, title: 'Re:ZERO -Starting Life in Another World-', status: 'current', genres: ['Drama', 'Fantasy', 'Psychological', 'Suspense', 'Time Travel'] }),
    ];

    const withBacklogNoise = [
      ...baseHistory,
      entry({ id: 6, title: 'Some Planned Show', status: 'planned', genres: ['Sports', 'Music'] }),
    ];

    const baseTaste = buildAnimeTasteProfile(baseHistory);
    const tasteWithNoise = buildAnimeTasteProfile(withBacklogNoise);

    expect(baseTaste.profile.coreGenres.some(item => item.name.includes('battle shounen'))).toBe(true);
    expect(baseTaste.profile.coreGenres.some(item => item.name.includes('prestige fantasy'))).toBe(true);
    expect(baseTaste.profile.premiumSignals?.some(item => item.name.includes('10/10 favorite-led premium lane'))).toBe(true);

    expect(baseTaste.profile.coreGenres).toEqual(tasteWithNoise.profile.coreGenres);
  });
});
