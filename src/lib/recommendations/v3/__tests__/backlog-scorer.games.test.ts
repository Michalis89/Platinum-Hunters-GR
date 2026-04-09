import { scoreBacklogItems } from '../pipeline/backlog-scorer';
import type { MediaHistoryEntry, UserScoringContext } from '../types';

function makeHistoryEntry(
  id: number,
  title: string,
  status: MediaHistoryEntry['status'],
  genres: string[],
  score: number | null = null,
  isFavorite = false,
): MediaHistoryEntry {
  return {
    id,
    mediaId: id,
    status,
    score,
    progress: null,
    priority: null,
    isFavorite,
    pinnedRank: null,
    updatedAt: '2026-04-08T00:00:00.000Z',
    selectedPlatform: 'PlayStation 5',
    media: {
      id,
      title,
      category: 'games',
      genres,
      themes: [],
      platforms: ['PlayStation 5'],
    },
  };
}

function makeContext(history: MediaHistoryEntry[]): UserScoringContext {
  return {
    history,
    clusters: [],
    toneProfile: { primaryTone: 'narrative immersion', toneLabels: ['narrative immersion'], confidence: 1 },
    topGenres: [
      { genre: 'role-playing-rpg', weight: 10 },
      { genre: 'adventure', weight: 9 },
      { genre: 'hack-and-slash', weight: 8 },
    ],
    topThemes: [
      { theme: 'narrative-driven worlds', weight: 8 },
      { theme: 'dark fantasy action', weight: 7 },
      { theme: 'cinematic single-player campaigns', weight: 6 },
    ],
    topPlayerStyles: [
      { style: 'single-player narrative immersion', weight: 10 },
      { style: 'franchise continuation focus', weight: 8 },
    ],
    topPlatforms: [{ platform: 'PlayStation 5', weight: 5 }],
    completionRate: 1,
    favoriteRate: 0.5,
    completedFranchiseKeys: new Set<string>(),
    libraryIds: new Set(history.map(h => h.mediaId)),
    avoidedGenreKeys: new Set(['moba', 'real-time-strategy-rts']),
    loveGenreKeys: new Set(['role-playing-rpg', 'adventure', 'hack-and-slash', 'shooter']),
  };
}

describe('scoreBacklogItems games priorities', () => {
  it('prioritizes continuation and suppresses puzzle/indie noise', () => {
    const history: MediaHistoryEntry[] = [
      makeHistoryEntry(1, 'God of War', 'completed', ['Adventure', "Hack and slash/Beat 'em up"], 9, true),
      makeHistoryEntry(2, 'The Witcher 3: Wild Hunt', 'completed', ['Adventure', 'Role-playing (RPG)'], 10, true),
      makeHistoryEntry(3, 'Horizon Zero Dawn: Complete Edition', 'completed', ['Adventure', 'Role-playing (RPG)', 'Shooter'], 9, false),
    ];

    const planned: MediaHistoryEntry[] = [
      makeHistoryEntry(11, 'God of War Ragnarök', 'planned', ['Adventure', "Hack and slash/Beat 'em up", 'Role-playing (RPG)']),
      makeHistoryEntry(12, 'Cyberpunk 2077', 'planned', ['Adventure', 'Role-playing (RPG)', 'Shooter']),
      makeHistoryEntry(13, 'The Room 4: Old Sins', 'planned', ['Adventure', 'Indie', 'Puzzle']),
    ];

    const scored = scoreBacklogItems(planned, makeContext(history), []);

    expect(scored[0].title).toBe('God of War Ragnarök');
    expect(scored[0].franchiseKey).not.toBeNull();

    const cyberpunk = scored.find(item => item.title === 'Cyberpunk 2077');
    const room = scored.find(item => item.title === 'The Room 4: Old Sins');

    expect(cyberpunk).toBeDefined();
    expect(room).toBeDefined();
    expect((cyberpunk?.rawScore ?? 0)).toBeGreaterThan(room?.rawScore ?? 0);
  });
});
