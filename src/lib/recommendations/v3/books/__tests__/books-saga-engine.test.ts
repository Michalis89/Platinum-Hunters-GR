import type { MediaCandidate, MediaHistoryEntry, ScoredItem } from '../../types';
import {
  buildBooksReason,
  buildBooksSagaProfile,
  calibrateBooksConfidence,
  filterBooksCandidates,
  scoreBooksBacklogItem,
  scoreBooksDiscoveryCandidate,
} from '../books-saga-engine';

function historyEntry(params: {
  id: number;
  title: string;
  status: MediaHistoryEntry['status'];
  genres: string[];
  score?: number | null;
  favorite?: boolean;
  progress?: number | null;
  themes?: string[];
}): MediaHistoryEntry {
  return {
    id: params.id,
    mediaId: params.id,
    status: params.status,
    score: params.score ?? null,
    progress: params.progress ?? null,
    priority: null,
    isFavorite: params.favorite ?? false,
    pinnedRank: null,
    updatedAt: '2026-04-09T00:00:00.000Z',
    media: {
      id: params.id,
      title: params.title,
      category: 'books',
      genres: params.genres,
      themes: params.themes ?? [],
    },
  };
}

function candidate(
  id: number,
  title: string,
  genres: string[],
  popularityScore: number,
  themes: string[] = [],
): MediaCandidate {
  return {
    id,
    title,
    slug: `book-${id}`,
    cover: '',
    category: 'books',
    genres,
    themes,
    platforms: [],
    popularityScore,
  };
}

function scored(item: MediaCandidate): ScoredItem {
  return {
    mediaDbId: item.id,
    title: item.title,
    cover: item.cover,
    slug: item.slug,
    genres: item.genres,
    themes: item.themes,
    platforms: [],
    source: 'discovery',
    rawScore: 82,
    confidence: 0.82,
    clusterMatch: null,
    toneMatch: null,
    franchiseKey: null,
    matchedSignals: [],
    reason: '',
  };
}

describe('books saga engine', () => {
  const history: MediaHistoryEntry[] = [
    historyEntry({
      id: 1,
      title: 'Homeland',
      status: 'completed',
      genres: ['Fiction', 'Fantasy'],
      score: 10,
      favorite: true,
      themes: ['R. A. Salvatore'],
    }),
    historyEntry({
      id: 2,
      title: 'Exile',
      status: 'current',
      genres: ['Fiction', 'Fantasy'],
      score: 9,
      progress: 45,
      themes: ['R. A. Salvatore'],
    }),
    historyEntry({
      id: 3,
      title: "You Don't Know JS: Scope & Closures",
      status: 'planned',
      genres: ['Computers'],
    }),
  ];

  it('builds strong drizzt/forgotten-realms affinity from core history', () => {
    const profile = buildBooksSagaProfile(history);
    expect(profile.normalizedAxes.forgottenRealmsAffinity).toBeGreaterThan(0.5);
    expect(profile.normalizedAxes.longFormCharacterLoyalty).toBeGreaterThan(0.45);
    expect(profile.drizztAffinity).toBe(true);
  });

  it('filters generic fiction and keeps saga continuation', () => {
    const profile = buildBooksSagaProfile(history);
    const filtered = filterBooksCandidates(
      [
        candidate(10, 'Sojourn', ['Fiction', 'Fantasy'], 72, ['R. A. Salvatore']),
        candidate(11, 'Emma', ['Fiction'], 68, []),
      ],
      {
        history,
        clusters: [],
        toneProfile: { primaryTone: 'x', toneLabels: [], confidence: 0.5 },
        topGenres: [],
        topThemes: [],
        topPlayerStyles: [],
        topPlatforms: [],
        completionRate: 0,
        favoriteRate: 0.4,
        completedFranchiseKeys: new Set(),
        libraryIds: new Set(),
        avoidedGenreKeys: new Set(),
        loveGenreKeys: new Set(['fiction', 'fantasy']),
      },
      profile,
    );

    expect(filtered.some(item => item.title === 'Sojourn')).toBe(true);
    expect(filtered.some(item => item.title === 'Emma')).toBe(false);
  });

  it('prioritizes chronology continuation over random fiction', () => {
    const profile = buildBooksSagaProfile(history);
    const sojourn = candidate(20, 'Sojourn', ['Fiction', 'Fantasy'], 74, ['R. A. Salvatore']);
    const random = candidate(21, 'The Cottage', ['Fiction'], 70);

    const sojournScore = scoreBooksDiscoveryCandidate(sojourn, 30, profile);
    const randomScore = scoreBooksDiscoveryCandidate(random, 30, profile);

    expect(sojournScore).toBeGreaterThan(randomScore);
    expect(sojournScore).toBeGreaterThan(75);
  });

  it('produces saga-native reason and confidence bands', () => {
    const profile = buildBooksSagaProfile(history);
    const sojourn = candidate(30, 'Sojourn', ['Fiction', 'Fantasy'], 74, ['R. A. Salvatore']);
    const item = scored(sojourn);
    const reason = buildBooksReason(item, profile).toLowerCase();
    const confidence = calibrateBooksConfidence(item, profile);

    expect(reason).toContain('drizzt');
    expect(confidence).toBeGreaterThanOrEqual(0.75);
  });

  it('does not treat author adjacency alone as direct saga continuation', () => {
    const profile = buildBooksSagaProfile(history);
    const unrelatedByAuthor = candidate(
      31,
      'Northern Lights',
      ['Fiction'],
      72,
      ['R. A. Salvatore'],
    );
    const reason = buildBooksReason(scored(unrelatedByAuthor), profile).toLowerCase();
    expect(reason).not.toContain('direct saga continuation');
  });

  it('boosts backlog continuation picks with chronology adjacency', () => {
    const profile = buildBooksSagaProfile(history);
    const backlog = historyEntry({
      id: 40,
      title: 'Sojourn',
      status: 'planned',
      genres: ['Fiction', 'Fantasy'],
      themes: ['R. A. Salvatore'],
    });
    const score = scoreBooksBacklogItem(
      backlog,
      { history, favoriteRate: 0.4 } as unknown as Parameters<typeof scoreBooksBacklogItem>[1],
      profile,
    );
    expect(score).toBeGreaterThan(80);
  });
});
