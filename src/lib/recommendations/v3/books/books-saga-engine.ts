import type { MediaCandidate, MediaHistoryEntry, ScoredItem, UserScoringContext } from '../types';
import { getCanonicalKey } from '../utils/genre';

export type BookAxisKey =
  | 'epicFantasySaga'
  | 'darkHeroJourney'
  | 'forgottenRealmsAffinity'
  | 'longFormCharacterLoyalty'
  | 'mythicAdventureWorldbuilding'
  | 'technicalProgrammingLearning'
  | 'ttrpgSystemsCuriosity';

type BookAxisDefinition = {
  key: BookAxisKey;
  name: string;
  requiredGenres: string[];
  boostGenres: string[];
  motifTokens: string[];
};

type SeriesContinuation = {
  isContinuation: boolean;
  authorAdjacentOnly: boolean;
  familyKey: string;
  orderIndex: number | null;
  expectedNextIndex: number | null;
  distanceFromNext: number | null;
  strength: number;
};

export type BooksSagaProfile = {
  coreAxes: Record<BookAxisKey, number>;
  peripheralAxes: Record<BookAxisKey, number>;
  normalizedCoreAxes: Record<BookAxisKey, number>;
  normalizedAxes: Record<BookAxisKey, number>;
  seriesDepthByFamily: Map<string, number>;
  plannedDepthByFamily: Map<string, number>;
  readOrderByFamily: Map<string, Set<number>>;
  authorAffinity: Map<string, number>;
  technicalAffinity: boolean;
  fantasySagaAffinity: boolean;
  forgottenRealmsAffinity: boolean;
  drizztAffinity: boolean;
};

export type BooksIdentityProfile = {
  summary: string;
  coreAxes: Array<{ name: string; weight: number }>;
  readingSignals: Array<{ name: string; weight: number }>;
};

const BOOK_AXES: BookAxisDefinition[] = [
  {
    key: 'epicFantasySaga',
    name: 'Epic Fantasy Saga',
    requiredGenres: ['fantasy', 'fiction'],
    boostGenres: ['adventure', 'juvenile-fiction'],
    motifTokens: ['legend', 'king', 'realm', 'saga', 'chronicles', 'sword'],
  },
  {
    key: 'darkHeroJourney',
    name: 'Dark Hero Journey',
    requiredGenres: ['fiction'],
    boostGenres: ['fantasy', 'adventure'],
    motifTokens: ['exile', 'hunter', 'night', 'vengeance', 'ghost', 'orc'],
  },
  {
    key: 'forgottenRealmsAffinity',
    name: 'Forgotten Realms / D&D World Affinity',
    requiredGenres: ['fiction'],
    boostGenres: ['fantasy', 'games-activities'],
    motifTokens: ['drizzt', 'drow', 'forgotten', 'realms', 'dungeons', 'dragons'],
  },
  {
    key: 'longFormCharacterLoyalty',
    name: 'Long-form Character Loyalty',
    requiredGenres: ['fiction'],
    boostGenres: ['fantasy', 'adventure'],
    motifTokens: ['homeland', 'exile', 'sojourn', 'legacy', 'companion', 'threshold'],
  },
  {
    key: 'mythicAdventureWorldbuilding',
    name: 'Mythic Adventure Worldbuilding',
    requiredGenres: ['fantasy', 'adventure'],
    boostGenres: ['fiction'],
    motifTokens: ['world', 'mage', 'archmage', 'enclave', 'gauntlgrym', 'neverwinter'],
  },
  {
    key: 'technicalProgrammingLearning',
    name: 'Technical Programming Learning',
    requiredGenres: ['computers'],
    boostGenres: ['technology', 'programming'],
    motifTokens: ['javascript', 'scope', 'closures', 'async', 'performance', 'prototype'],
  },
  {
    key: 'ttrpgSystemsCuriosity',
    name: 'TTRPG Systems Curiosity',
    requiredGenres: ['games-activities'],
    boostGenres: ['computers', 'fiction'],
    motifTokens: ['players', 'handbook', 'rulebook', 'dungeons', 'dragons', 'roleplaying'],
  },
];

const AXIS_LABELS: Record<BookAxisKey, string> = BOOK_AXES.reduce(
  (acc, axis) => ({ ...acc, [axis.key]: axis.name }),
  {} as Record<BookAxisKey, string>,
);

const DRIZZT_ORDER: Record<string, number> = {
  homeland: 1,
  exile: 2,
  sojourn: 3,
  'the crystal shard': 4,
  'streams of silver': 5,
  "the halfling's gem": 6,
  'the legacy': 7,
  'starless night': 8,
  'siege of darkness': 9,
  'passage to dawn': 10,
  'the silent blade': 11,
  'the spine of the world': 12,
  'sea of swords': 13,
  'servant of the shard': 14,
  'promise of the witch-king': 15,
  'road of the patriarch': 16,
  'the thousand orcs': 17,
  'the lone drow': 18,
  'the two swords': 19,
  'the orc king': 20,
  'the pirate king': 21,
  'the ghost king': 22,
  gauntlgrym: 23,
  neverwinter: 24,
  "charon's claw": 25,
  'the last threshold': 26,
  'the companions': 27,
  'night of the hunter': 28,
  'rise of the king': 29,
  'vengeance of the iron dwarf': 30,
  archmage: 31,
  maestro: 32,
  hero: 33,
  timeless: 34,
  boundless: 35,
  relentless: 36,
  'starlight enclave': 37,
  "glacier's edge": 38,
  "lolth's warrior": 39,
};

function emptyAxisRecord(): Record<BookAxisKey, number> {
  return {
    epicFantasySaga: 0,
    darkHeroJourney: 0,
    forgottenRealmsAffinity: 0,
    longFormCharacterLoyalty: 0,
    mythicAdventureWorldbuilding: 0,
    technicalProgrammingLearning: 0,
    ttrpgSystemsCuriosity: 0,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeAxis(value: number, maxValue: number): number {
  if (maxValue <= 0) {
    return 0;
  }
  return round2(Math.max(0, Math.min(1, value / maxValue)));
}

function canonicalTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizedTitle(title: string): Set<string> {
  return new Set(
    canonicalTitle(title)
      .replace(/'/g, '')
      .split(/\s+/)
      .filter(Boolean),
  );
}

function genreLike(raw: string, expected: string): boolean {
  const key = getCanonicalKey(raw) ?? raw.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  if (key === expected) {
    return true;
  }
  if (expected === 'fiction') {
    return key === 'fiction' || key === 'juvenile-fiction' || key === 'fantasy';
  }
  if (expected === 'games-activities') {
    return key === 'games-activities' || key === 'games' || key === 'board-games';
  }
  if (expected === 'computers') {
    return key === 'computers' || key === 'technology' || key === 'programming';
  }
  return false;
}

function normalizeBookGenres(genres: string[]): string[] {
  const normalized = new Set<string>();
  for (const genre of genres) {
    if (genreLike(genre, 'fiction')) {
      normalized.add('fiction');
    }
    if (genreLike(genre, 'fantasy')) {
      normalized.add('fantasy');
    }
    if (genreLike(genre, 'adventure')) {
      normalized.add('adventure');
    }
    if (genreLike(genre, 'juvenile-fiction')) {
      normalized.add('juvenile-fiction');
    }
    if (genreLike(genre, 'games-activities')) {
      normalized.add('games-activities');
    }
    if (genreLike(genre, 'computers')) {
      normalized.add('computers');
    }
    if (genreLike(genre, 'technology')) {
      normalized.add('technology');
    }
    if (genreLike(genre, 'programming')) {
      normalized.add('programming');
    }
  }
  return Array.from(normalized);
}

function readThemeSignals(entry: MediaHistoryEntry | MediaCandidate | ScoredItem): string[] {
  const topLevelThemes = 'themes' in entry && Array.isArray(entry.themes) ? entry.themes : [];
  const mediaThemes =
    'media' in entry && entry.media && Array.isArray(entry.media.themes) ? entry.media.themes : [];
  return [...topLevelThemes, ...mediaThemes].map(value => value.toLowerCase().trim()).filter(Boolean);
}

function inferAuthorSignals(entry: MediaHistoryEntry | MediaCandidate | ScoredItem): string[] {
  const source = readThemeSignals(entry);
  const isSalvatore = source.some(
    value =>
      value.includes('salvatore') ||
      value.includes('r. a. salvatore') ||
      value.includes('r.a. salvatore') ||
      value.includes('ra salvatore'),
  );
  if (isSalvatore) {
    return ['r-a-salvatore'];
  }
  return [];
}

function deriveSeriesFamily(title: string): string {
  const normalized = canonicalTitle(title);
  if (
    normalized === 'homeland' ||
    normalized === 'exile' ||
    normalized === 'sojourn' ||
    normalized === 'the crystal shard' ||
    normalized === 'streams of silver' ||
    normalized === "the halfling's gem" ||
    normalized === 'the legacy' ||
    normalized === 'starless night' ||
    normalized === 'siege of darkness' ||
    normalized === 'passage to dawn' ||
    normalized === 'the silent blade' ||
    normalized === 'the spine of the world' ||
    normalized === 'sea of swords' ||
    normalized === 'servant of the shard' ||
    normalized === 'promise of the witch-king' ||
    normalized === 'road of the patriarch' ||
    normalized === 'the thousand orcs' ||
    normalized === 'the lone drow' ||
    normalized === 'the two swords' ||
    normalized === 'the orc king' ||
    normalized === 'the pirate king' ||
    normalized === 'the ghost king' ||
    normalized === 'the companions' ||
    normalized === 'night of the hunter' ||
    normalized === 'rise of the king' ||
    normalized === 'vengeance of the iron dwarf' ||
    normalized === 'archmage' ||
    normalized === 'maestro' ||
    normalized === 'hero' ||
    normalized === 'timeless' ||
    normalized === 'boundless' ||
    normalized === 'relentless' ||
    normalized === 'starlight enclave' ||
    normalized === "glacier's edge" ||
    normalized === "lolth's warrior" ||
    normalized.includes('drizzt') ||
    normalized.includes('drow') ||
    normalized.includes('forgotten realms') ||
    normalized.includes('gauntlgrym') ||
    normalized.includes('neverwinter') ||
    normalized.includes("charon's claw")
  ) {
    return 'legend-of-drizzt';
  }
  if (normalized.includes("you don't know js") || normalized.includes('you dont know js')) {
    return 'you-dont-know-js';
  }
  if (normalized.includes("player's handbook") || normalized.includes('d&d')) {
    return 'dnd-core-books';
  }
  return normalized
    .replace(/[:\-].+$/g, '')
    .replace(/\b(book|volume|part)\s+\d+\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 3)
    .join('-');
}

function inferSeriesOrder(title: string, familyKey: string): number | null {
  if (familyKey === 'legend-of-drizzt') {
    const key = canonicalTitle(title);
    return DRIZZT_ORDER[key] ?? null;
  }
  const explicit = canonicalTitle(title).match(/\b(book|volume|part)\s+(\d+)\b/);
  if (explicit) {
    return Number.parseInt(explicit[2], 10);
  }
  return null;
}

function detectContinuation(
  title: string,
  profile: BooksSagaProfile,
  candidateAuthors: string[],
): SeriesContinuation {
  const familyKey = deriveSeriesFamily(title);
  const familyDepth = profile.seriesDepthByFamily.get(familyKey) ?? 0;
  const orderIndex = inferSeriesOrder(title, familyKey);
  const readOrders = profile.readOrderByFamily.get(familyKey) ?? new Set<number>();
  const maxReadOrder = readOrders.size > 0 ? Math.max(...Array.from(readOrders.values())) : null;
  const expectedNextIndex = maxReadOrder !== null ? maxReadOrder + 1 : null;
  const distanceFromNext =
    orderIndex !== null && expectedNextIndex !== null ? Math.abs(orderIndex - expectedNextIndex) : null;
  const authorContinuation =
    candidateAuthors.length > 0 && candidateAuthors.some(author => (profile.authorAffinity.get(author) ?? 0) >= 2);

  if (familyDepth === 0 && !authorContinuation) {
    return {
      isContinuation: false,
      authorAdjacentOnly: false,
      familyKey,
      orderIndex,
      expectedNextIndex,
      distanceFromNext,
      strength: 0,
    };
  }

  let strength = Math.min(1, 0.62 + familyDepth * 0.1);
  if (distanceFromNext === 0) {
    strength += 0.2;
  } else if (distanceFromNext === 1) {
    strength += 0.1;
  } else if (distanceFromNext !== null && distanceFromNext >= 3) {
    strength -= 0.15;
  }
  if (authorContinuation) {
    strength += 0.08;
  }

  const authorAdjacentOnly = familyDepth === 0 && authorContinuation;

  return {
    isContinuation: !authorAdjacentOnly && (strength >= 0.68 || familyDepth >= 2),
    authorAdjacentOnly,
    familyKey,
    orderIndex,
    expectedNextIndex,
    distanceFromNext,
    strength: round2(Math.max(0, Math.min(1, strength))),
  };
}

function axisFit(genres: string[], titleTokens: Set<string>, axis: BookAxisDefinition): number {
  const requiredOverlap = axis.requiredGenres.filter(required => genres.includes(required)).length;
  if (requiredOverlap === 0) {
    return 0;
  }
  const requiredScore = requiredOverlap / axis.requiredGenres.length;
  const boostScore = Math.min(0.32, axis.boostGenres.filter(genre => genres.includes(genre)).length * 0.12);
  const motifScore = Math.min(
    0.24,
    axis.motifTokens.reduce((sum, token) => sum + (titleTokens.has(token) ? 0.08 : 0), 0),
  );
  return Math.min(1, requiredScore + boostScore + motifScore);
}

function coreWeight(entry: MediaHistoryEntry, continuation: SeriesContinuation): number {
  if (entry.status === 'planned' || entry.status === 'dropped') {
    return 0;
  }
  const score = entry.score ?? 0;
  if (entry.isFavorite && score >= 9.5) {
    return 1;
  }
  if (entry.isFavorite && score >= 9) {
    return 0.9;
  }
  if (score >= 9) {
    return 0.78;
  }
  if (entry.status === 'current' && continuation.isContinuation && (entry.progress ?? 0) >= 35) {
    return 0.62;
  }
  if (continuation.isContinuation && score >= 8) {
    return 0.56;
  }
  return 0;
}

function peripheralWeight(entry: MediaHistoryEntry): number {
  if (entry.status === 'planned') {
    return 0;
  }
  const score = entry.score ?? 0;
  if (entry.status === 'current') {
    return (entry.progress ?? 0) >= 30 ? 0.24 : 0.12;
  }
  if (entry.status === 'completed') {
    if (score >= 8 && score < 9) {
      return 0.45;
    }
    if (score >= 6 && score < 8) {
      return 0.16;
    }
    if (score > 0 && score <= 5) {
      return 0.05;
    }
  }
  if (entry.status === 'dropped') {
    return 0.04;
  }
  return 0.08;
}

function negativeDriftWeight(entry: MediaHistoryEntry): number {
  const score = entry.score ?? 0;
  if (entry.status === 'dropped') {
    return score <= 5 ? 0.34 : 0.22;
  }
  if (entry.status === 'current' && (entry.progress ?? 0) < 20) {
    return 0.2;
  }
  if (entry.status === 'completed' && score <= 5.5) {
    return 0.24;
  }
  return 0;
}

function candidateExpressesAxis(
  genres: string[],
  titleTokens: Set<string>,
  axis: BookAxisKey,
): boolean {
  const hasFantasy = genres.includes('fantasy') || genres.includes('adventure') || genres.includes('juvenile-fiction');
  const hasFiction = genres.includes('fiction') || hasFantasy;
  const hasTech = genres.includes('computers') || genres.includes('technology') || genres.includes('programming');
  const hasTtrpg = genres.includes('games-activities');
  const hasFrToken =
    titleTokens.has('drizzt') ||
    titleTokens.has('drow') ||
    titleTokens.has('forgotten') ||
    titleTokens.has('realms') ||
    titleTokens.has('dungeons') ||
    titleTokens.has('dragons') ||
    titleTokens.has('gauntlgrym') ||
    titleTokens.has('neverwinter') ||
    titleTokens.has('lolth');

  switch (axis) {
    case 'epicFantasySaga':
      return hasFantasy || hasFrToken;
    case 'darkHeroJourney':
      return (
        hasFantasy ||
        titleTokens.has('exile') ||
        titleTokens.has('hunter') ||
        titleTokens.has('vengeance') ||
        titleTokens.has('ghost') ||
        titleTokens.has('orc')
      );
    case 'forgottenRealmsAffinity':
      return hasFrToken;
    case 'longFormCharacterLoyalty':
      return (
        hasFiction &&
        (hasFrToken ||
          titleTokens.has('homeland') ||
          titleTokens.has('exile') ||
          titleTokens.has('sojourn') ||
          titleTokens.has('legacy'))
      );
    case 'mythicAdventureWorldbuilding':
      return hasFantasy || hasFrToken || titleTokens.has('mage');
    case 'technicalProgrammingLearning':
      return hasTech || titleTokens.has('javascript') || titleTokens.has('closures') || titleTokens.has('async');
    case 'ttrpgSystemsCuriosity':
      return hasTtrpg || titleTokens.has('handbook') || titleTokens.has('rulebook') || titleTokens.has('roleplaying');
    default:
      return false;
  }
}

function computeCandidateAxisFit(genres: string[], profile: BooksSagaProfile, title: string): Record<BookAxisKey, number> {
  const fit = emptyAxisRecord();
  const tokens = tokenizedTitle(title);
  for (const axis of BOOK_AXES) {
    const rawFit = axisFit(genres, tokens, axis);
    const blended = profile.normalizedCoreAxes[axis.key] * 0.86 + profile.normalizedAxes[axis.key] * 0.14;
    const expressionGate = candidateExpressesAxis(genres, tokens, axis.key) ? 1 : 0.24;
    fit[axis.key] = round2(rawFit * blended * expressionGate);
  }
  return fit;
}

function dominantAxisCount(axisScores: Record<BookAxisKey, number>): number {
  return Object.values(axisScores).filter(score => score >= 0.25).length;
}

function thematicSimilarity(axisScores: Record<BookAxisKey, number>): number {
  const values = Object.values(axisScores).sort((a, b) => b - a);
  const first = values[0] ?? 0;
  const second = values[1] ?? 0;
  return round2(Math.min(1, first * 0.68 + second * 0.32));
}

export function buildBooksSagaProfile(history: MediaHistoryEntry[]): BooksSagaProfile {
  const coreAxes = emptyAxisRecord();
  const peripheralAxes = emptyAxisRecord();
  const peripheralNegative = emptyAxisRecord();
  const seriesDepthByFamily = new Map<string, number>();
  const plannedDepthByFamily = new Map<string, number>();
  const readOrderByFamily = new Map<string, Set<number>>();
  const authorAffinity = new Map<string, number>();
  let technicalSignals = 0;
  let fantasySignals = 0;
  let forgottenSignals = 0;
  let drizztSignals = 0;

  for (const entry of history) {
    const familyKey = deriveSeriesFamily(entry.media.title);
    const order = inferSeriesOrder(entry.media.title, familyKey);
    if (entry.status === 'planned') {
      plannedDepthByFamily.set(familyKey, (plannedDepthByFamily.get(familyKey) ?? 0) + 1);
      continue;
    }
    seriesDepthByFamily.set(familyKey, (seriesDepthByFamily.get(familyKey) ?? 0) + 1);
    if (order !== null) {
      const set = readOrderByFamily.get(familyKey) ?? new Set<number>();
      set.add(order);
      readOrderByFamily.set(familyKey, set);
    }

    const authors = inferAuthorSignals(entry);
    for (const author of authors) {
      authorAffinity.set(author, (authorAffinity.get(author) ?? 0) + 1);
    }

    const genres = normalizeBookGenres(entry.media.genres);
    const continuation = detectContinuation(entry.media.title, {
      coreAxes,
      peripheralAxes,
      normalizedCoreAxes: emptyAxisRecord(),
      normalizedAxes: emptyAxisRecord(),
      seriesDepthByFamily,
      plannedDepthByFamily,
      readOrderByFamily,
      authorAffinity,
      technicalAffinity: false,
      fantasySagaAffinity: false,
      forgottenRealmsAffinity: false,
      drizztAffinity: false,
    }, authors);
    const tokens = tokenizedTitle(entry.media.title);
    const core = coreWeight(entry, continuation);
    const peripheral = peripheralWeight(entry);
    const drift = negativeDriftWeight(entry);

    if (genres.includes('computers')) {
      technicalSignals += 1;
    }
    if (genres.includes('fantasy') || genres.includes('fiction')) {
      fantasySignals += 1;
    }
    if (familyKey === 'legend-of-drizzt' || tokens.has('forgotten') || tokens.has('realms')) {
      forgottenSignals += 1;
    }
    if (familyKey === 'legend-of-drizzt' || tokens.has('drizzt') || tokens.has('drow')) {
      drizztSignals += 1;
    }

    for (const axis of BOOK_AXES) {
      const fit = axisFit(genres, tokens, axis);
      if (fit <= 0) {
        continue;
      }

      if (core > 0) {
        coreAxes[axis.key] += fit * core;
      }
      if (peripheral > 0) {
        peripheralAxes[axis.key] += fit * peripheral;
      }
      if (drift > 0) {
        peripheralNegative[axis.key] += fit * drift;
      }
    }
  }

  for (const axis of BOOK_AXES) {
    const key = axis.key;
    peripheralAxes[key] = Math.max(0, peripheralAxes[key] - peripheralNegative[key] * 0.9);
    if (coreAxes[key] === 0) {
      peripheralAxes[key] *= 0.42;
    }
  }

  const blended = emptyAxisRecord();
  for (const axis of BOOK_AXES) {
    blended[axis.key] = coreAxes[axis.key] * 0.82 + peripheralAxes[axis.key] * 0.18;
  }

  const maxCore = Math.max(...Object.values(coreAxes), 0.001);
  const maxBlend = Math.max(...Object.values(blended), 0.001);
  const normalizedCoreAxes = Object.fromEntries(
    Object.entries(coreAxes).map(([key, value]) => [key, normalizeAxis(value, maxCore)]),
  ) as Record<BookAxisKey, number>;
  const normalizedAxes = Object.fromEntries(
    Object.entries(blended).map(([key, value]) => [key, normalizeAxis(value, maxBlend)]),
  ) as Record<BookAxisKey, number>;

  return {
    coreAxes,
    peripheralAxes,
    normalizedCoreAxes,
    normalizedAxes,
    seriesDepthByFamily,
    plannedDepthByFamily,
    readOrderByFamily,
    authorAffinity,
    technicalAffinity: technicalSignals >= 2 && technicalSignals >= fantasySignals,
    fantasySagaAffinity: fantasySignals >= 2,
    forgottenRealmsAffinity: forgottenSignals >= 2,
    drizztAffinity: drizztSignals >= 2,
  };
}

export function filterBooksCandidates(
  candidates: MediaCandidate[],
  ctx: UserScoringContext,
  profile: BooksSagaProfile,
): MediaCandidate[] {
  const filtered = candidates.filter(candidate => {
    const title = candidate.title.trim();
    if (!title) {
      return false;
    }

    const genres = normalizeBookGenres(candidate.genres);
    if (genres.length === 0) {
      return false;
    }

    const authors = inferAuthorSignals(candidate);
    const continuation = detectContinuation(title, profile, authors);
    const axisScores = computeCandidateAxisFit(genres, profile, title);
    const dominant = dominantAxisCount(axisScores);
    const similarity = thematicSimilarity(axisScores);
    const familyDepth = profile.seriesDepthByFamily.get(continuation.familyKey) ?? 0;
    const authorMatch = authors.some(author => (profile.authorAffinity.get(author) ?? 0) >= 2);
    const fantasyFit =
      axisScores.epicFantasySaga >= 0.24 ||
      axisScores.forgottenRealmsAffinity >= 0.24 ||
      axisScores.mythicAdventureWorldbuilding >= 0.24;
    const technicalFit =
      axisScores.technicalProgrammingLearning >= 0.24 ||
      axisScores.ttrpgSystemsCuriosity >= 0.24;
    const strongProfileFit = profile.technicalAffinity ? technicalFit : fantasyFit;

    const qualityFloor = continuation.isContinuation || authorMatch ? 36 : 48;
    if (candidate.popularityScore < qualityFloor) {
      return false;
    }

    if (!continuation.isContinuation && !authorMatch && !strongProfileFit) {
      return false;
    }

    if (dominant === 0 && similarity < 0.44) {
      return false;
    }

    if (profile.fantasySagaAffinity && !profile.technicalAffinity) {
      if (!fantasyFit && familyDepth === 0 && !authorMatch) {
        return false;
      }
    }

    if (profile.technicalAffinity && !profile.fantasySagaAffinity) {
      if (!technicalFit && !continuation.isContinuation) {
        return false;
      }
    }

    if (
      !continuation.isContinuation &&
      !authorMatch &&
      familyDepth === 0 &&
      !genres.some(genre => ctx.loveGenreKeys.has(genre))
    ) {
      return false;
    }

    const plannedDepth = profile.plannedDepthByFamily.get(continuation.familyKey) ?? 0;
    if (plannedDepth >= 2 && continuation.isContinuation) {
      return false;
    }

    if (continuation.authorAdjacentOnly && similarity < 0.58) {
      return false;
    }

    return true;
  });

  if (filtered.length > 0) {
    return filtered;
  }

  return candidates.filter(candidate => {
    const genres = normalizeBookGenres(candidate.genres);
    if (candidate.title.trim().length === 0 || genres.length === 0) {
      return false;
    }
    if (profile.fantasySagaAffinity && !profile.technicalAffinity) {
      return genres.includes('fantasy') || genres.includes('adventure') || genres.includes('juvenile-fiction');
    }
    if (profile.technicalAffinity && !profile.fantasySagaAffinity) {
      return genres.includes('computers') || genres.includes('games-activities');
    }
    return true;
  });
}

export function scoreBooksBacklogItem(
  entry: MediaHistoryEntry,
  ctx: UserScoringContext,
  profile: BooksSagaProfile,
): number {
  const genres = normalizeBookGenres(entry.media.genres);
  const authors = inferAuthorSignals(entry);
  const continuation = detectContinuation(entry.media.title, profile, authors);
  const axisScores = computeCandidateAxisFit(genres, profile, entry.media.title);
  const similarity = thematicSimilarity(axisScores);
  const dominant = dominantAxisCount(axisScores);
  const authorMatch = authors.some(author => (profile.authorAffinity.get(author) ?? 0) >= 2);
  const chronologyBoost =
    continuation.distanceFromNext === 0 ? 14 : continuation.distanceFromNext === 1 ? 8 : 0;

  const score = Math.max(
    0,
    Math.min(
      100,
        18 +
        similarity * 34 +
        dominant * 8 +
        (continuation.isContinuation ? 18 + continuation.strength * 16 : continuation.authorAdjacentOnly ? 5 : 0) +
        (authorMatch ? 10 : 0) +
        chronologyBoost +
        (profile.drizztAffinity && continuation.familyKey === 'legend-of-drizzt' ? 10 : 0) +
        (Number.isFinite(ctx.favoriteRate) ? ctx.favoriteRate * 4 : 0),
    ),
  );

  return score;
}

export function scoreBooksDiscoveryCandidate(
  candidate: MediaCandidate,
  baseScore: number,
  profile: BooksSagaProfile,
): number {
  const genres = normalizeBookGenres(candidate.genres);
  const authors = inferAuthorSignals(candidate);
  const continuation = detectContinuation(candidate.title, profile, authors);
  const axisScores = computeCandidateAxisFit(genres, profile, candidate.title);
  const dominant = dominantAxisCount(axisScores);
  const similarity = thematicSimilarity(axisScores);
  const authorMatch = authors.some(author => (profile.authorAffinity.get(author) ?? 0) >= 2);
  const worldFit =
    axisScores.forgottenRealmsAffinity >= 0.24 ||
    axisScores.epicFantasySaga >= 0.24 ||
    axisScores.mythicAdventureWorldbuilding >= 0.24;
  const technicalFit =
    axisScores.technicalProgrammingLearning >= 0.24 || axisScores.ttrpgSystemsCuriosity >= 0.24;
  const qualityBoost = Math.min(14, Math.sqrt(Math.max(0, candidate.popularityScore)) * 1.5);
  const chronologyBoost =
    continuation.distanceFromNext === 0 ? 12 : continuation.distanceFromNext === 1 ? 7 : 0;
  const weakGenericFictionPenalty =
    genres.includes('fiction') && !worldFit && !authorMatch && !continuation.isContinuation ? 24 : 0;
  const mismatchPenalty =
    profile.technicalAffinity && !profile.fantasySagaAffinity
      ? technicalFit
        ? 0
        : 14
      : worldFit || continuation.isContinuation || authorMatch
        ? 0
        : 14;

  const score = Math.max(
    0,
    Math.min(
      100,
        16 +
        qualityBoost +
        similarity * 30 +
        dominant * 8 +
        (continuation.isContinuation ? 20 + continuation.strength * 14 : continuation.authorAdjacentOnly ? 6 : 0) +
        (authorMatch ? 12 : 0) +
        chronologyBoost -
        weakGenericFictionPenalty -
        mismatchPenalty -
        (candidate.popularityScore < 46 ? 12 : 0),
    ),
  );

  return Math.max(score, baseScore * 0.36);
}

export function calibrateBooksConfidence(item: ScoredItem, profile: BooksSagaProfile): number {
  const genres = normalizeBookGenres(item.genres);
  const continuation = detectContinuation(item.title, profile, inferAuthorSignals(item));
  const axisScores = computeCandidateAxisFit(genres, profile, item.title);
  const strongest = Math.max(...Object.values(axisScores));
  const dominant = dominantAxisCount(axisScores);
  const similarity = thematicSimilarity(axisScores);
  const directSaga = continuation.isContinuation && continuation.distanceFromNext === 0;
  const authorMatch = inferAuthorSignals(item).some(author => (profile.authorAffinity.get(author) ?? 0) >= 2);

  if (directSaga && strongest >= 0.5) {
    return round2(0.9 + Math.min(0.08, continuation.strength * 0.06));
  }
  if ((continuation.isContinuation || authorMatch) && !continuation.authorAdjacentOnly && strongest >= 0.38 && similarity >= 0.5) {
    return round2(0.75 + Math.min(0.14, strongest * 0.2));
  }
  if (dominant >= 1 && strongest >= 0.28 && similarity >= 0.42) {
    return round2(0.6 + Math.min(0.14, strongest * 0.22));
  }
  return round2(Math.max(0.38, Math.min(0.58, item.confidence * 0.68)));
}

function topTwoAxisLabels(axisScores: Record<BookAxisKey, number>): [string, string] {
  const ordered = Object.entries(axisScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([axis]) => AXIS_LABELS[axis as BookAxisKey].toLowerCase());
  return [ordered[0] ?? 'core books taste', ordered[1] ?? 'series continuity'];
}

export function buildBooksReason(item: ScoredItem, profile: BooksSagaProfile): string {
  const continuation = detectContinuation(item.title, profile, inferAuthorSignals(item));
  const genres = normalizeBookGenres(item.genres);
  const axisScores = computeCandidateAxisFit(genres, profile, item.title);
  const tokens = tokenizedTitle(item.title);
  const authorMatch = inferAuthorSignals(item).some(author => (profile.authorAffinity.get(author) ?? 0) >= 2);

  if (continuation.isContinuation && continuation.familyKey === 'legend-of-drizzt') {
    if (continuation.distanceFromNext === 0) {
      return "Continues Drizzt's arc in chronological order and deepens the Forgotten Realms mythology you strongly favor.";
    }
    return "Strong Drizzt/Forgotten Realms continuation with high character-arc and worldbuilding alignment.";
  }

  if (continuation.isContinuation) {
    return 'Direct saga continuation aligned with your long-form character loyalty and series-order preferences.';
  }

  if (authorMatch && !continuation.authorAdjacentOnly) {
    return 'Strong same-author storytelling match with high saga/world continuity fit.';
  }

  if (
    axisScores.technicalProgrammingLearning >= 0.24 ||
    axisScores.ttrpgSystemsCuriosity >= 0.24
  ) {
    return 'Matches your technical learning and systems-curiosity reading preferences.';
  }

  if (
    axisScores.forgottenRealmsAffinity >= 0.24 &&
    candidateExpressesAxis(genres, tokens, 'forgottenRealmsAffinity')
  ) {
    return 'Matches your Forgotten Realms worldbuilding and long-form character continuity preferences.';
  }

  const topTwo = topTwoAxisLabels(axisScores);
  if (dominantAxisCount(axisScores) >= 2) {
    return `Matches your ${topTwo[0]} and ${topTwo[1]} preferences.`;
  }
  return 'Fits your core books taste with moderate saga/thematic overlap.';
}

export function buildBooksIdentityProfile(history: MediaHistoryEntry[]): BooksIdentityProfile {
  const profile = buildBooksSagaProfile(history);
  const coreAxes = Object.entries(profile.normalizedAxes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([axis, weight]) => ({
      name: AXIS_LABELS[axis as BookAxisKey],
      weight: Math.round(weight * 100),
    }));

  const drizztDepth = profile.seriesDepthByFamily.get('legend-of-drizzt') ?? 0;
  const readingSignals = [
    { name: 'Series Continuation Loyalty', weight: Math.round(Math.min(100, drizztDepth * 18 + 18)) },
    {
      name: 'Author Affinity Strength',
      weight: Math.round(Math.min(100, (profile.authorAffinity.get('r-a-salvatore') ?? 0) * 20 + 10)),
    },
    { name: 'Chronology Alignment', weight: profile.drizztAffinity ? 88 : 52 },
    { name: 'World Continuity Focus', weight: profile.forgottenRealmsAffinity ? 86 : 50 },
  ];

  const lead = coreAxes[0]?.name.toLowerCase() ?? 'saga-driven fiction';
  const summary = `Your books identity is ${lead}, with strong series-order and world-continuity reading behavior.`;

  return { summary, coreAxes, readingSignals };
}

export function toBooksQualityScore(
  rating: string | number | null | undefined,
  voteCount: string | number | null | undefined,
  popularity: string | number | null | undefined,
  hasGenres: boolean,
  hasThemes: boolean,
): number {
  const ratingNum =
    typeof rating === 'number' ? rating : typeof rating === 'string' ? Number.parseFloat(rating) : 0;
  const voteNum =
    typeof voteCount === 'number'
      ? voteCount
      : typeof voteCount === 'string'
        ? Number.parseFloat(voteCount)
        : 0;
  const popNum =
    typeof popularity === 'number'
      ? popularity
      : typeof popularity === 'string'
        ? Number.parseFloat(popularity)
        : 0;

  const ratingComponent =
    Number.isFinite(ratingNum) && ratingNum > 0 ? Math.max(0, Math.min(55, ((ratingNum - 5) / 5) * 55)) : 0;
  const voteComponent =
    Number.isFinite(voteNum) && voteNum > 0 ? Math.max(0, Math.min(25, (Math.log10(voteNum + 1) / 5) * 25)) : 0;
  const popularityComponent =
    Number.isFinite(popNum) && popNum > 0 ? Math.max(0, Math.min(12, (Math.min(popNum, 100) / 100) * 12)) : 0;
  const metadataBaseline = hasGenres ? 18 : hasThemes ? 12 : 0;

  return Math.round(Math.max(0, Math.min(100, ratingComponent + voteComponent + popularityComponent + metadataBaseline)));
}
