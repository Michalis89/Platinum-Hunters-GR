import type { MediaCandidate, MediaHistoryEntry, ScoredItem } from '../../types';
import {
  buildMoviesCinematicProfile,
  buildMoviesReason,
  calibrateMoviesConfidence,
  filterMoviesCandidates,
  scoreMoviesBacklogItem,
  scoreMoviesDiscoveryCandidate,
} from '../movies-cinematic-engine';

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
    updatedAt: '2026-04-08T00:00:00.000Z',
    media: {
      id: params.id,
      title: params.title,
      category: 'movies',
      genres: params.genres,
    },
  };
}

function candidate(id: number, title: string, genres: string[], popularityScore = 70): MediaCandidate {
  return {
    id,
    title,
    slug: `movie-${id}`,
    cover: '',
    category: 'movies',
    genres,
    themes: [],
    platforms: [],
    popularityScore,
  };
}

function scoredFromCandidate(
  input: MediaCandidate,
  source: ScoredItem['source'],
  franchiseKey: string | null,
): ScoredItem {
  return {
    mediaDbId: input.id,
    title: input.title,
    cover: input.cover,
    slug: input.slug,
    genres: input.genres,
    themes: [],
    platforms: [],
    source,
    rawScore: 90,
    confidence: 0.95,
    clusterMatch: null,
    toneMatch: null,
    franchiseKey,
    matchedSignals: [],
    reason: '',
  };
}

describe('movies cinematic engine', () => {
  const history: MediaHistoryEntry[] = [
    historyEntry({
      id: 1,
      title: 'The Lord of the Rings: The Fellowship of the Ring',
      status: 'completed',
      genres: ['Adventure', 'Fantasy', 'Drama'],
      score: 10,
      favorite: true,
    }),
    historyEntry({
      id: 2,
      title: 'The Lord of the Rings: The Two Towers',
      status: 'completed',
      genres: ['Adventure', 'Fantasy', 'Drama'],
      score: 10,
      favorite: true,
    }),
    historyEntry({
      id: 3,
      title: 'Interstellar',
      status: 'completed',
      genres: ['Science Fiction', 'Drama', 'Adventure'],
      score: 10,
      favorite: true,
    }),
    historyEntry({
      id: 4,
      title: 'The Pursuit of Happyness',
      status: 'completed',
      genres: ['Drama', 'Biography'],
      score: 10,
      favorite: true,
    }),
    historyEntry({
      id: 5,
      title: 'The Matrix',
      status: 'completed',
      genres: ['Science Fiction', 'Action'],
      score: 8.5,
    }),
    historyEntry({
      id: 6,
      title: 'The Matrix Reloaded',
      status: 'completed',
      genres: ['Science Fiction', 'Action'],
      score: 7.5,
    }),
    historyEntry({
      id: 7,
      title: 'A Random Horror Entry',
      status: 'completed',
      genres: ['Horror', 'Thriller'],
      score: 4,
    }),
  ];

  it('builds core-heavy identity lanes and keeps low-score drift peripheral', () => {
    const profile = buildMoviesCinematicProfile(history);

    expect(profile.normalizedLanes.epicFantasyAdventure).toBeGreaterThan(0.6);
    expect(profile.normalizedLanes.prestigeReflectiveSciFi).toBeGreaterThan(0.5);
    expect(profile.normalizedLanes.emotionalHumanPayoff).toBeGreaterThan(0.5);
    expect(profile.peripheralLanes.mythicHeroJourney).toBeLessThan(profile.coreLanes.mythicHeroJourney);
  });

  it('treats continuation as modifier, not primary axis', () => {
    const profile = buildMoviesCinematicProfile(history);

    const matrixResurrections = historyEntry({
      id: 100,
      title: 'The Matrix Resurrections',
      status: 'planned',
      genres: ['Science Fiction', 'Action'],
    });
    const randomComedy = historyEntry({
      id: 101,
      title: 'Random Comedy Night',
      status: 'planned',
      genres: ['Comedy'],
    });

    const matrixScore = scoreMoviesBacklogItem(
      matrixResurrections,
      { history, favoriteRate: 0 } as unknown as Parameters<typeof scoreMoviesBacklogItem>[1],
      profile,
    );
    const comedyScore = scoreMoviesBacklogItem(
      randomComedy,
      { history, favoriteRate: 0 } as unknown as Parameters<typeof scoreMoviesBacklogItem>[1],
      profile,
    );

    expect(matrixScore).toBeGreaterThan(comedyScore);
    expect(matrixScore).toBeGreaterThan(55);
  });

  it('keeps confidence high for direct continuation but below hard 1.0', () => {
    const profile = buildMoviesCinematicProfile(history);
    const continuationCandidate = candidate(
      200,
      'The Matrix Resurrections',
      ['Science Fiction', 'Action', 'Adventure'],
    );
    const eliteDiscovery = candidate(
      201,
      'Blade Runner 2049',
      ['Science Fiction', 'Drama', 'Thriller'],
    );

    const continuationItem = scoredFromCandidate(continuationCandidate, 'discovery', 'matrix');
    const eliteDiscoveryItem = scoredFromCandidate(eliteDiscovery, 'discovery', null);

    const continuationConfidence = calibrateMoviesConfidence(continuationItem, profile);
    const eliteConfidence = calibrateMoviesConfidence(eliteDiscoveryItem, profile);

    expect(continuationConfidence).toBeLessThan(1);
    expect(continuationConfidence).toBeGreaterThanOrEqual(0.85);
    expect(eliteConfidence).toBeLessThanOrEqual(continuationConfidence);
  });

  it('uses cleaned explanation language without cinematic bridge phrasing', () => {
    const profile = buildMoviesCinematicProfile(history);
    const item = scoredFromCandidate(
      candidate(300, 'Arrival', ['Science Fiction', 'Drama', 'Mystery']),
      'discovery',
      null,
    );

    const reason = buildMoviesReason(item, profile);
    const score = scoreMoviesDiscoveryCandidate(
      candidate(300, 'Arrival', ['Science Fiction', 'Drama', 'Mystery']),
      40,
      profile,
    );

    expect(reason.toLowerCase()).toContain('match for your');
    expect(reason.toLowerCase()).not.toContain('cinematic scale');
    expect(reason.toLowerCase()).not.toContain('bridge');
    expect(score).toBeGreaterThan(60);
  });

  it('strictly filters low-trust candidates before ranking', () => {
    const profile = buildMoviesCinematicProfile(history);

    const filtered = filterMoviesCandidates(
      [
        candidate(400, 'Popular Core Match', ['Science Fiction', 'Drama'], 78),
        candidate(401, 'Obscure Weak Match', ['Comedy'], 25),
        candidate(402, 'Metadata Missing', [], 80),
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
        favoriteRate: 0,
        completedFranchiseKeys: new Set(),
        libraryIds: new Set(),
        avoidedGenreKeys: new Set(),
        loveGenreKeys: new Set(['sci-fi-fantasy', 'drama', 'fantasy', 'adventure']),
      },
      profile,
    );

    expect(filtered.some(item => item.id === 400)).toBe(true);
    expect(filtered.some(item => item.id === 401)).toBe(false);
    expect(filtered.some(item => item.id === 402)).toBe(false);
  });

  it('calibrates avatar/zootopia/revenant/frankenstein/bourne with stricter semantics', () => {
    const profile = buildMoviesCinematicProfile(history);
    const avatar = candidate(600, 'Avatar', ['Science Fiction', 'Adventure', 'Action'], 88);
    const zootopia = candidate(601, 'Zootopia', ['Animation', 'Family', 'Comedy'], 84);
    const revenant = candidate(602, 'The Revenant', ['Drama', 'Adventure', 'Western'], 80);
    const frankenstein = candidate(603, 'Frankenstein', ['Horror', 'Science Fiction', 'Drama'], 64);
    const bourne = candidate(604, 'The Bourne Identity', ['Action', 'Thriller'], 78);

    const avatarScore = scoreMoviesDiscoveryCandidate(avatar, 40, profile);
    const zootopiaScore = scoreMoviesDiscoveryCandidate(zootopia, 40, profile);
    const revenantScore = scoreMoviesDiscoveryCandidate(revenant, 40, profile);
    const frankensteinScore = scoreMoviesDiscoveryCandidate(frankenstein, 40, profile);
    const bourneScore = scoreMoviesDiscoveryCandidate(bourne, 40, profile);

    const avatarConfidence = calibrateMoviesConfidence(scoredFromCandidate(avatar, 'discovery', null), profile);
    const zootopiaConfidence = calibrateMoviesConfidence(scoredFromCandidate(zootopia, 'discovery', null), profile);
    const revenantReason = buildMoviesReason(scoredFromCandidate(revenant, 'discovery', null), profile).toLowerCase();
    const bourneReason = buildMoviesReason(scoredFromCandidate(bourne, 'discovery', null), profile).toLowerCase();
    const frankensteinReason = buildMoviesReason(
      scoredFromCandidate(frankenstein, 'discovery', null),
      profile,
    ).toLowerCase();

    expect(avatarScore).toBeGreaterThan(revenantScore);
    expect(revenantScore).toBeGreaterThan(zootopiaScore);
    expect(frankensteinScore).toBeLessThan(avatarScore);
    expect(bourneScore).toBeLessThan(avatarScore);

    expect(avatarConfidence).toBeGreaterThanOrEqual(0.75);
    expect(zootopiaConfidence).toBeLessThan(0.6);

    expect(revenantReason).not.toContain('epic fantasy adventure');
    expect(bourneReason).not.toContain('prestige reflective sci-fi');
    expect(frankensteinReason).not.toContain('epic fantasy adventure');
  });

  it('micro-tunes ordering toward prestige/worldbuilding over generic spectacle', () => {
    const profile = buildMoviesCinematicProfile(history);
    const avatar = candidate(700, 'Avatar', ['Science Fiction', 'Adventure', 'Action'], 88);
    const infinityWar = candidate(
      701,
      'Avengers: Infinity War',
      ['Science Fiction', 'Action', 'Adventure'],
      97,
    );
    const arrival = candidate(702, 'Arrival', ['Science Fiction', 'Drama', 'Mystery'], 84);
    const johnWick = candidate(703, 'John Wick: Chapter 2', ['Action', 'Thriller'], 83);

    const avatarScore = scoreMoviesDiscoveryCandidate(avatar, 40, profile);
    const infinityWarScore = scoreMoviesDiscoveryCandidate(infinityWar, 40, profile);
    const arrivalScore = scoreMoviesDiscoveryCandidate(arrival, 40, profile);
    const johnWickScore = scoreMoviesDiscoveryCandidate(johnWick, 40, profile);

    expect(avatarScore).toBeGreaterThan(infinityWarScore);
    expect(arrivalScore).toBeGreaterThan(johnWickScore);
  });
});
