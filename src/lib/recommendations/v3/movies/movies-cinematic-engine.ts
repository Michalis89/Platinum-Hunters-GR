import type { MediaCandidate, MediaHistoryEntry, ScoredItem, UserScoringContext } from '../types';
import { extractFranchiseKey } from '../utils/franchise';
import { getCanonicalKey, normalizeGenres } from '../utils/genre';

export type MovieLaneKey =
  | 'epicFantasyAdventure'
  | 'prestigeReflectiveSciFi'
  | 'emotionalHumanPayoff'
  | 'mythicHeroJourney';

type MovieLaneDefinition = {
  key: MovieLaneKey;
  name: string;
  requiredGenres: string[];
  boostGenres: string[];
  motifTokens: string[];
};

type LaneContribution = {
  title: string;
  score: number;
};

type ContinuationAffinity = 'low' | 'medium' | 'high';
type SemanticCompatibility = {
  tone: number;
  audience: number;
  texture: number;
  world: number;
  emotionalSeriousness: number;
  spectacleStyle: number;
  total: number;
  heroJourneyOnly: boolean;
  animatedFamilyMismatch: boolean;
};

export type MoviesCinematicProfile = {
  coreLanes: Record<MovieLaneKey, number>;
  peripheralLanes: Record<MovieLaneKey, number>;
  normalizedCoreLanes: Record<MovieLaneKey, number>;
  normalizedLanes: Record<MovieLaneKey, number>;
  laneEvidence: Record<MovieLaneKey, string[]>;
  franchiseDepthByKey: Map<string, number>;
  franchiseDepthByFamily: Map<string, number>;
  plannedFranchiseDepthByFamily: Map<string, number>;
  droppedGenrePressure: Set<string>;
  continuationAffinity: ContinuationAffinity;
  continuationModifier: number;
  arthouseAffinity: boolean;
  animationFamilyAffinity: boolean;
  liveActionSeriousAffinity: boolean;
  speculativeWorldAffinity: boolean;
  epicScaleAffinity: boolean;
};

const MOVIE_LANES: MovieLaneDefinition[] = [
  {
    key: 'epicFantasyAdventure',
    name: 'Epic Fantasy Adventure',
    requiredGenres: ['fantasy', 'adventure'],
    boostGenres: ['action', 'drama'],
    motifTokens: ['king', 'ring', 'quest', 'dragon', 'magic', 'legend', 'chronicles'],
  },
  {
    key: 'prestigeReflectiveSciFi',
    name: 'Prestige Reflective Sci-Fi',
    requiredGenres: ['sci-fi-fantasy', 'drama'],
    boostGenres: ['thriller', 'mystery', 'adventure'],
    motifTokens: ['space', 'future', 'matrix', 'interstellar', 'blade', 'arrival', 'time'],
  },
  {
    key: 'emotionalHumanPayoff',
    name: 'Emotional Human Payoff',
    requiredGenres: ['drama'],
    boostGenres: ['biography', 'history', 'family', 'romance'],
    motifTokens: ['life', 'happyness', 'father', 'mother', 'home', 'hope', 'pursuit'],
  },
  {
    key: 'mythicHeroJourney',
    name: 'Mythic Hero Journey',
    requiredGenres: ['adventure'],
    boostGenres: ['fantasy', 'action', 'drama'],
    motifTokens: ['hero', 'chosen', 'return', 'awakens', 'legacy', 'battle', 'war'],
  },
];

const LANE_LABELS: Record<MovieLaneKey, string> = MOVIE_LANES.reduce(
  (acc, lane) => ({ ...acc, [lane.key]: lane.name }),
  {} as Record<MovieLaneKey, string>,
);

const SEQUEL_MARKER_PATTERN =
  /\b(part|chapter|episode|volume|vol\.?|ii|iii|iv|v|2|3|4|5|resurrections?|reloaded|revolutions?|returns?|awakens?|legacy|origins?|final)\b/i;

const CANONICAL_DISCOVERY_BOOSTS: Array<{ pattern: RegExp; boost: number }> = [
  { pattern: /\bblade runner 2049\b/i, boost: 16 },
  { pattern: /\barrival\b/i, boost: 15 },
  { pattern: /\bdune\b/i, boost: 14 },
  { pattern: /\bthe dark knight\b/i, boost: 14 },
  { pattern: /\bgladiator\b/i, boost: 13 },
  { pattern: /\bthe green mile\b/i, boost: 13 },
];

const MASS_FRANCHISE_SPECTACLE_PATTERN =
  /\b(avengers|infinity war|endgame|fast|furious|transformers|justice league|x-men|expendables)\b/i;
const WORLDBUILDING_ATMOSPHERE_PATTERN =
  /\b(avatar|dune|ring|rings|middle-earth|blade runner|arrival|interstellar|chronicles|kingdom)\b/i;
const REFLECTIVE_SCI_FI_PATTERN =
  /\b(arrival|blade runner|interstellar|contact|annihilation|ex machina|children of men|dune)\b/i;

const CANONICAL_BACKLOG_BOOSTS: Array<{ pattern: RegExp; boost: number }> = [
  { pattern: /\bthe matrix resurrections\b/i, boost: 16 },
  { pattern: /\bthe revenant\b/i, boost: 14 },
  { pattern: /\bblood diamond\b/i, boost: 12 },
  { pattern: /\bphenomenon\b/i, boost: 10 },
];

export function buildMoviesCinematicProfile(history: MediaHistoryEntry[]): MoviesCinematicProfile {
  const coreLanes = emptyLaneRecord();
  const peripheralLanes = emptyLaneRecord();
  const peripheralNegative = emptyLaneRecord();
  const laneEvidenceRaw: Record<MovieLaneKey, LaneContribution[]> = {
    epicFantasyAdventure: [],
    prestigeReflectiveSciFi: [],
    emotionalHumanPayoff: [],
    mythicHeroJourney: [],
  };

  const coreSupport = new Map<MovieLaneKey, Set<number>>();
  const peripheralSupport = new Map<MovieLaneKey, Set<number>>();
  for (const lane of MOVIE_LANES) {
    coreSupport.set(lane.key, new Set());
    peripheralSupport.set(lane.key, new Set());
  }

  const franchiseDepthByKey = new Map<string, number>();
  const franchiseDepthByFamily = new Map<string, number>();
  const plannedFranchiseDepthByFamily = new Map<string, number>();
  const droppedGenrePressure = new Set<string>();

  let artySignal = 0;
  let mainstreamSignal = 0;
  let animationFamilySignal = 0;
  let liveActionSeriousSignal = 0;
  let speculativeWorldSignal = 0;
  let epicScaleSignal = 0;

  for (const entry of history) {
    if (entry.status === 'planned') {
      const plannedFamily = deriveMovieFamilyKey(entry.media.title);
      plannedFranchiseDepthByFamily.set(
        plannedFamily,
        (plannedFranchiseDepthByFamily.get(plannedFamily) ?? 0) + 1,
      );
      continue;
    }

    const genres = normalizeGenres(entry.media.genres);
    const titleTokens = tokenizedTitle(entry.media.title);
    const coreWeight = movieCoreTasteWeight(entry);
    const peripheralWeight = moviePeripheralTasteWeight(entry);
    const negativeDrift = movieNegativeDriftWeight(entry);

    const franchiseKey = extractFranchiseKey(entry.media.title);
    franchiseDepthByKey.set(franchiseKey, (franchiseDepthByKey.get(franchiseKey) ?? 0) + 1);

    const familyKey = deriveMovieFamilyKey(entry.media.title);
    franchiseDepthByFamily.set(familyKey, (franchiseDepthByFamily.get(familyKey) ?? 0) + 1);

    if (entry.status === 'dropped') {
      for (const genre of genres) {
        droppedGenrePressure.add(genre);
      }
    }

    if (isArthouseLike(genres, entry.score)) {
      artySignal += 1;
    }
    if (isMainstreamLike(genres, entry.score, entry.isFavorite)) {
      mainstreamSignal += 1;
    }
    if (isAnimationFamilyLike(genres, entry.score, entry.isFavorite)) {
      animationFamilySignal += 1;
    }
    if (isLiveActionSeriousLike(genres, entry.score, entry.isFavorite)) {
      liveActionSeriousSignal += 1;
    }
    if (isSpeculativeWorldLike(genres, entry.score)) {
      speculativeWorldSignal += 1;
    }
    if (isEpicScaleLike(genres, entry.score, entry.isFavorite)) {
      epicScaleSignal += 1;
    }

    for (const lane of MOVIE_LANES) {
      const fit = computeLaneFit(genres, titleTokens, lane);
      if (fit <= 0) {
        continue;
      }

      if (coreWeight > 0) {
        const score = fit * coreWeight;
        coreLanes[lane.key] += score;
        coreSupport.get(lane.key)?.add(entry.mediaId);
        laneEvidenceRaw[lane.key].push({ title: entry.media.title, score: score * 1.3 });
      }

      if (peripheralWeight > 0) {
        const score = fit * peripheralWeight;
        peripheralLanes[lane.key] += score;
        peripheralSupport.get(lane.key)?.add(entry.mediaId);
        if (coreWeight <= 0) {
          laneEvidenceRaw[lane.key].push({ title: entry.media.title, score: score * 0.8 });
        }
      }

      if (negativeDrift > 0) {
        peripheralNegative[lane.key] += fit * negativeDrift;
      }
    }
  }

  // Anti-drift: low-signal peripheral evidence cannot define a lane.
  for (const lane of MOVIE_LANES) {
    const key = lane.key;
    const coreCount = coreSupport.get(key)?.size ?? 0;
    const peripheralCount = peripheralSupport.get(key)?.size ?? 0;

    peripheralLanes[key] = Math.max(0, peripheralLanes[key] - peripheralNegative[key] * 0.85);

    if (coreCount === 0 && peripheralCount <= 1) {
      peripheralLanes[key] *= 0.25;
    } else if (coreCount === 0 && peripheralCount <= 2) {
      peripheralLanes[key] *= 0.5;
    }
  }

  const blended = emptyLaneRecord();
  for (const lane of MOVIE_LANES) {
    const key = lane.key;
    blended[key] = coreLanes[key] * 0.84 + peripheralLanes[key] * 0.16;
  }

  const maxCore = Math.max(...Object.values(coreLanes), 0.001);
  const maxBlended = Math.max(...Object.values(blended), 0.001);

  const normalizedCoreLanes: Record<MovieLaneKey, number> = {
    epicFantasyAdventure: normalizeLane(coreLanes.epicFantasyAdventure, maxCore),
    prestigeReflectiveSciFi: normalizeLane(coreLanes.prestigeReflectiveSciFi, maxCore),
    emotionalHumanPayoff: normalizeLane(coreLanes.emotionalHumanPayoff, maxCore),
    mythicHeroJourney: normalizeLane(coreLanes.mythicHeroJourney, maxCore),
  };

  const normalizedLanes: Record<MovieLaneKey, number> = {
    epicFantasyAdventure: normalizeLane(blended.epicFantasyAdventure, maxBlended),
    prestigeReflectiveSciFi: normalizeLane(blended.prestigeReflectiveSciFi, maxBlended),
    emotionalHumanPayoff: normalizeLane(blended.emotionalHumanPayoff, maxBlended),
    mythicHeroJourney: normalizeLane(blended.mythicHeroJourney, maxBlended),
  };

  const laneEvidence: Record<MovieLaneKey, string[]> = {
    epicFantasyAdventure: topEvidenceTitles(laneEvidenceRaw.epicFantasyAdventure),
    prestigeReflectiveSciFi: topEvidenceTitles(laneEvidenceRaw.prestigeReflectiveSciFi),
    emotionalHumanPayoff: topEvidenceTitles(laneEvidenceRaw.emotionalHumanPayoff),
    mythicHeroJourney: topEvidenceTitles(laneEvidenceRaw.mythicHeroJourney),
  };

  const continuationAffinity = computeContinuationAffinity(franchiseDepthByFamily);
  const continuationModifier =
    continuationAffinity === 'high' ? 0.18 : continuationAffinity === 'medium' ? 0.1 : 0.04;

  return {
    coreLanes,
    peripheralLanes,
    normalizedCoreLanes,
    normalizedLanes,
    laneEvidence,
    franchiseDepthByKey,
    franchiseDepthByFamily,
    plannedFranchiseDepthByFamily,
    droppedGenrePressure,
    continuationAffinity,
    continuationModifier,
    arthouseAffinity: artySignal >= 3 && artySignal > mainstreamSignal,
    animationFamilyAffinity: animationFamilySignal >= 3,
    liveActionSeriousAffinity: liveActionSeriousSignal >= 4,
    speculativeWorldAffinity: speculativeWorldSignal >= 3,
    epicScaleAffinity: epicScaleSignal >= 3,
  };
}

export function filterMoviesCandidates(
  candidates: MediaCandidate[],
  ctx: UserScoringContext,
  profile: MoviesCinematicProfile,
): MediaCandidate[] {
  const filtered = candidates.filter(candidate => {
    if (!candidate.title.trim()) {
      return false;
    }

    const genres = normalizeGenres(candidate.genres);
    if (genres.length === 0) {
      return false;
    }

    const continuation = detectMovieContinuation(candidate.title, profile);
    const laneFit = computeCandidateLaneFit(genres, profile);
    const semantic = deriveSemanticCompatibility(genres, laneFit, profile);
    const thematicSimilarity = computeThematicSimilarity(laneFit);
    const dominantMatches = countDominantClusterMatches(laneFit);
    const familyKey = deriveMovieFamilyKey(candidate.title);

    const minPopularity = continuation.isDirect
      ? 36
      : profile.arthouseAffinity
        ? 32
        : 48;

    if (candidate.popularityScore <= 0 || candidate.popularityScore < minPopularity) {
      return false;
    }

    if (!continuation.isDirect && semantic.total < 0.4) {
      return false;
    }

    if (semantic.audience < 0.35 || semantic.world < 0.32) {
      return false;
    }

    if (dominantMatches === 0 && thematicSimilarity < 0.34) {
      return false;
    }

    if (dominantMatches < 2 && thematicSimilarity < 0.46 && candidate.popularityScore < 60) {
      return false;
    }

    if (!profile.arthouseAffinity && candidate.popularityScore < 44 && !continuation.isDirect) {
      return false;
    }

    if (semantic.heroJourneyOnly) {
      return false;
    }

    if (semantic.animatedFamilyMismatch && !continuation.isDirect) {
      return false;
    }

    const backlogDepth = profile.plannedFranchiseDepthByFamily.get(familyKey) ?? 0;
    if (backlogDepth >= 2 && continuation.isDirect) {
      return false;
    }

    const inLibraryFamily = profile.franchiseDepthByFamily.get(familyKey) ?? 0;
    if (inLibraryFamily === 0 && dominantMatches === 0) {
      return false;
    }

    if (
      hasNoCoreOverlap(genres, ctx.loveGenreKeys) &&
      !continuation.isDirect &&
      thematicSimilarity < 0.5
    ) {
      return false;
    }

    return true;
  });

  // Keep fallback safety to avoid empty results for sparse users.
  return filtered.length >= 16
    ? filtered
    : candidates.filter(
        c => c.popularityScore >= 55 && normalizeGenres(c.genres).length > 0 && c.title.trim().length > 0,
      );
}

export function scoreMoviesBacklogItem(
  entry: MediaHistoryEntry,
  ctx: UserScoringContext,
  profile: MoviesCinematicProfile,
): number {
  const genres = normalizeGenres(entry.media.genres);
  const laneFit = computeCandidateLaneFit(genres, profile);
  const continuation = detectMovieContinuation(entry.media.title, profile);
  const semantic = deriveSemanticCompatibility(genres, laneFit, profile);

  const canonicalBoost = canonicalBoostForTitle(entry.media.title, CANONICAL_BACKLOG_BOOSTS);
  const dominantMatchBoost = countDominantClusterMatches(laneFit) * 9;
  const thematicBoost = computeThematicSimilarity(laneFit) * 34;
  const continuationBoost = continuation.isDirect
    ? (12 + continuation.strength * 10) * (1 + profile.continuationModifier)
    : 0;
  const affinityBoost = continuation.isDirect ? continuationAffinityBoost(profile.continuationAffinity) : 0;
  const semanticBoost = semantic.total * 16;
  const droppedPenalty = computeDroppedPressurePenalty(genres, profile.droppedGenrePressure);
  const driftPenalty = weakLaneDriftPenalty(laneFit);
  const lowSignalPenalty = countDominantClusterMatches(laneFit) === 0 ? 9 : 0;
  const toneMismatchPenalty = semantic.total < 0.48 ? 12 : 0;
  const heroJourneyOnlyPenalty = semantic.heroJourneyOnly ? 20 : 0;
  const audiencePenalty = semantic.animatedFamilyMismatch ? 26 : 0;

  const score = Math.max(
    0,
    Math.min(
      100,
      22 +
        canonicalBoost +
        dominantMatchBoost +
        thematicBoost +
        semanticBoost +
        continuationBoost +
        affinityBoost -
        droppedPenalty -
        driftPenalty -
        lowSignalPenalty -
        toneMismatchPenalty -
        heroJourneyOnlyPenalty -
        audiencePenalty,
    ),
  );

  const favoriteRateBoost = Number.isFinite(ctx.favoriteRate) ? ctx.favoriteRate * 4 : 0;
  return Math.min(100, score + favoriteRateBoost);
}

export function scoreMoviesDiscoveryCandidate(
  candidate: MediaCandidate,
  baseScore: number,
  profile: MoviesCinematicProfile,
): number {
  const genres = normalizeGenres(candidate.genres);
  const laneFit = computeCandidateLaneFit(genres, profile);
  const continuation = detectMovieContinuation(candidate.title, profile);
  const semantic = deriveSemanticCompatibility(genres, laneFit, profile);

  const dominantMatches = countDominantClusterMatches(laneFit);
  const thematicSimilarity = computeThematicSimilarity(laneFit);
  const canonicalBoost = canonicalBoostForTitle(candidate.title, CANONICAL_DISCOVERY_BOOSTS);

  const continuationBoost = continuation.isDirect
    ? (10 + continuation.strength * 8) * (1 + profile.continuationModifier)
    : 0;
  const qualityBoost = Math.min(16, Math.sqrt(Math.max(0, candidate.popularityScore)) * 1.55);
  const dominantBoost = dominantMatches * 8;
  const thematicBoost = thematicSimilarity * 28;
  const semanticBoost = semantic.total * 24;
  const canonicalLaneBoost = canonicalBoost > 0 && dominantMatches > 0 ? canonicalBoost : 0;
  const orderingBonus = computeMoviesOrderingBonus(candidate, genres, laneFit, semantic);
  const orderingTieBreaker = computeMoviesOrderingTieBreaker(candidate.title);

  const qualityPenalty = candidate.popularityScore < 50 ? 18 : 0;
  const trustPenalty = candidate.popularityScore < 60 && dominantMatches < 2 ? 12 : 0;
  const thinFitPenalty = dominantMatches === 0 ? 16 : 0;
  const driftPenalty = weakLaneDriftPenalty(laneFit);
  const toneMismatchPenalty = Math.max(0, (0.55 - semantic.total) * 38);
  const audiencePenalty = semantic.animatedFamilyMismatch ? 34 : 0;
  const worldMismatchPenalty = semantic.world < 0.45 ? 14 : 0;
  const heroJourneyOnlyPenalty = semantic.heroJourneyOnly ? 26 : 0;
  const weakTrustPenalty = isWeakTrustDiscoveryCandidate(candidate, continuation.isDirect, dominantMatches)
    ? 24
    : 0;

  const movieScore = Math.max(
    0,
    Math.min(
      100,
      20 +
        continuationBoost +
        qualityBoost +
        dominantBoost +
        thematicBoost +
        semanticBoost +
        canonicalLaneBoost +
        orderingBonus +
        orderingTieBreaker +
        qualityPenalty -
        trustPenalty -
        thinFitPenalty -
        driftPenalty -
        toneMismatchPenalty -
        audiencePenalty -
        worldMismatchPenalty -
        heroJourneyOnlyPenalty -
        weakTrustPenalty,
    ),
  );

  return Math.max(movieScore, baseScore * 0.38);
}

export function calibrateMoviesConfidence(
  item: ScoredItem,
  profile: MoviesCinematicProfile,
): number {
  const genres = normalizeGenres(item.genres);
  const laneFit = computeCandidateLaneFit(genres, profile);
  const continuation = detectMovieContinuation(item.title, profile);
  const semantic = deriveSemanticCompatibility(genres, laneFit, profile);

  const strongest = Math.max(...Object.values(laneFit));
  const dominantMatches = countDominantClusterMatches(laneFit);
  const thematicSimilarity = computeThematicSimilarity(laneFit);

  const hasNearObviousFit =
    dominantMatches >= 3 && strongest >= 0.56 && semantic.total >= 0.78 && thematicSimilarity >= 0.68;
  const hasStrongFit =
    dominantMatches >= 2 && strongest >= 0.44 && semantic.total >= 0.62 && thematicSimilarity >= 0.54;
  const hasDefendableFit =
    dominantMatches >= 1 && strongest >= 0.32 && semantic.total >= 0.48 && thematicSimilarity >= 0.42;

  if (semantic.heroJourneyOnly || semantic.animatedFamilyMismatch) {
    return roundConfidence(Math.max(0.46, Math.min(0.59, item.confidence * 0.68)));
  }

  if (continuation.isDirect && continuation.strength >= 0.9 && semantic.total >= 0.7) {
    return roundConfidence(0.9 + Math.min(0.06, continuation.strength * 0.04));
  }

  if (hasNearObviousFit) {
    return roundConfidence(0.9 + Math.min(0.06, (strongest - 0.56) * 0.35));
  }

  if (hasStrongFit) {
    return roundConfidence(0.75 + Math.min(0.14, (strongest - 0.44) * 0.55));
  }

  if (hasDefendableFit) {
    return roundConfidence(0.6 + Math.min(0.14, (strongest - 0.32) * 0.58));
  }

  return roundConfidence(Math.max(0.42, Math.min(0.59, item.confidence * 0.72)));
}

export function buildMoviesReason(item: ScoredItem, profile: MoviesCinematicProfile): string {
  const genres = normalizeGenres(item.genres);
  const continuation = detectMovieContinuation(item.title, profile);
  const laneFit = computeCandidateLaneFit(genres, profile);
  const semantic = deriveSemanticCompatibility(genres, laneFit, profile);

  const dominantMatches = countDominantClusterMatches(laneFit);
  const topTwo = topTwoExpressedLaneLabels(genres, laneFit);
  const highConfidence = item.confidence >= 0.84 || item.rawScore >= 82;

  if (continuation.isDirect) {
    return `Direct continuation of your ${profile.continuationAffinity} franchise loyalty patterns.`;
  }

  if (semantic.animatedFamilyMismatch) {
    return 'Lower priority because it is more family-animation oriented than your core movie preferences.';
  }

  if (semantic.heroJourneyOnly) {
    return 'Partial fit on adventure arc, but missing your stronger prestige/speculative/emotional signals.';
  }

  if (dominantMatches >= 2 && highConfidence) {
    return `Strong match for your ${topTwo[0]} and ${topTwo[1]} preferences.`;
  }

  if (dominantMatches >= 2) {
    return `Matches your ${topTwo[0]} and ${topTwo[1]} preferences.`;
  }

  const dominantLane = pickDominantExpressedLane(genres, laneFit);
  if (dominantLane) {
    return `Matches your ${LANE_LABELS[dominantLane].toLowerCase()} preferences.`;
  }

  return 'Fits your core movie taste with moderate thematic overlap.';
}

export function movieIdentitySignalsForProfile(
  profile: MoviesCinematicProfile,
): Array<{ name: string; weight: number }> {
  const ordered = Object.entries(profile.normalizedLanes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([laneKey, weight]) => ({
      name: LANE_LABELS[laneKey as MovieLaneKey],
      weight: Math.round(weight * 100),
    }));

  ordered.push({
    name: `Selective Franchise Loyalty (${profile.continuationAffinity})`,
    weight: profile.continuationAffinity === 'high' ? 82 : profile.continuationAffinity === 'medium' ? 62 : 42,
  });

  return ordered;
}

function emptyLaneRecord(): Record<MovieLaneKey, number> {
  return {
    epicFantasyAdventure: 0,
    prestigeReflectiveSciFi: 0,
    emotionalHumanPayoff: 0,
    mythicHeroJourney: 0,
  };
}

function computeLaneFit(genres: string[], titleTokens: Set<string>, lane: MovieLaneDefinition): number {
  const required = normalizeGenres(lane.requiredGenres);
  const boosts = normalizeGenres(lane.boostGenres);
  const requiredOverlap = genres.filter(genre => required.includes(genre)).length;
  if (requiredOverlap === 0) {
    return 0;
  }

  const requiredScore = requiredOverlap / required.length;
  const boostScore = Math.min(0.32, genres.filter(genre => boosts.includes(genre)).length * 0.11);
  const motifScore = Math.min(
    0.2,
    lane.motifTokens.reduce((acc, token) => acc + (titleTokens.has(token) ? 0.08 : 0), 0),
  );

  return Math.min(1, requiredScore + boostScore + motifScore);
}

function computeCandidateLaneFit(
  genres: string[],
  profile: MoviesCinematicProfile,
): Record<MovieLaneKey, number> {
  const fit = emptyLaneRecord();

  const emptyTokens = new Set<string>();
  for (const lane of MOVIE_LANES) {
    const laneFit = computeLaneFit(genres, emptyTokens, lane);
    const blendedWeight = profile.normalizedCoreLanes[lane.key] * 0.86 + profile.normalizedLanes[lane.key] * 0.14;
    fit[lane.key] = roundConfidence(laneFit * blendedWeight);
  }

  return fit;
}

function deriveSemanticCompatibility(
  genres: string[],
  laneFit: Record<MovieLaneKey, number>,
  profile: MoviesCinematicProfile,
): SemanticCompatibility {
  const isAnimatedFamily = genres.includes('animation') || genres.includes('family');
  const isComedyFirst = genres.includes('comedy') && !genres.includes('drama');
  const isSpeculativeWorld = genres.includes('sci-fi-fantasy') || genres.includes('fantasy');
  const isEpicScale = genres.includes('adventure') && (genres.includes('action') || isSpeculativeWorld);
  const isSerious = genres.includes('drama') || genres.includes('thriller') || genres.includes('history');
  const isPrestige = isSerious && (genres.includes('mystery') || genres.includes('biography'));
  const hasMythicTexture = isSpeculativeWorld && genres.includes('adventure');

  const tone =
    laneFit.prestigeReflectiveSciFi * 0.42 +
    laneFit.emotionalHumanPayoff * 0.35 +
    laneFit.epicFantasyAdventure * 0.23;
  const audience = isAnimatedFamily
    ? profile.animationFamilyAffinity
      ? 0.7
      : 0.2
    : profile.liveActionSeriousAffinity
      ? 0.82
      : 0.68;
  const texture = hasMythicTexture ? 0.82 : isPrestige ? 0.72 : isComedyFirst ? 0.38 : 0.56;
  const world = isSpeculativeWorld
    ? profile.speculativeWorldAffinity
      ? 0.86
      : 0.52
    : profile.speculativeWorldAffinity
      ? 0.44
      : 0.7;
  const emotionalSeriousness = isSerious ? 0.82 : isComedyFirst ? 0.36 : 0.52;
  const spectacleStyle = isEpicScale
    ? profile.epicScaleAffinity
      ? 0.84
      : 0.58
    : profile.epicScaleAffinity
      ? 0.46
      : 0.68;

  const total = roundConfidence(
    tone * 0.24 +
      audience * 0.16 +
      texture * 0.16 +
      world * 0.18 +
      emotionalSeriousness * 0.14 +
      spectacleStyle * 0.12,
  );

  const heroJourneyOnly =
    laneFit.mythicHeroJourney >= 0.26 &&
    laneFit.epicFantasyAdventure < 0.22 &&
    laneFit.prestigeReflectiveSciFi < 0.2 &&
    laneFit.emotionalHumanPayoff < 0.22;

  return {
    tone: roundConfidence(tone),
    audience: roundConfidence(audience),
    texture: roundConfidence(texture),
    world: roundConfidence(world),
    emotionalSeriousness: roundConfidence(emotionalSeriousness),
    spectacleStyle: roundConfidence(spectacleStyle),
    total,
    heroJourneyOnly,
    animatedFamilyMismatch: isAnimatedFamily && !profile.animationFamilyAffinity,
  };
}

function detectMovieContinuation(
  title: string,
  profile: MoviesCinematicProfile,
): { isDirect: boolean; strength: number; franchiseKey: string } {
  const franchiseKey = extractFranchiseKey(title);
  const familyKey = deriveMovieFamilyKey(title);
  const depth = Math.max(
    profile.franchiseDepthByKey.get(franchiseKey) ?? 0,
    profile.franchiseDepthByFamily.get(familyKey) ?? 0,
  );

  if (depth <= 0) {
    return { isDirect: false, strength: 0, franchiseKey };
  }

  const hasSequelMarker = SEQUEL_MARKER_PATTERN.test(title);
  if (depth >= 2 && (hasSequelMarker || !looksLikeBaseTitle(title))) {
    return { isDirect: true, strength: Math.min(1, 0.84 + depth * 0.04), franchiseKey };
  }
  if (depth >= 1 && hasSequelMarker) {
    return { isDirect: true, strength: Math.min(0.94, 0.76 + depth * 0.05), franchiseKey };
  }

  return { isDirect: false, strength: 0, franchiseKey };
}

function movieCoreTasteWeight(entry: MediaHistoryEntry): number {
  if (entry.status === 'dropped' || entry.status === 'planned') {
    return 0;
  }

  const score = entry.score ?? 0;

  if (entry.isFavorite && score >= 10) {
    return 1;
  }
  if (entry.isFavorite && score >= 9) {
    return 0.86;
  }
  if (score >= 9) {
    return 0.75;
  }
  if (score >= 8.5) {
    return 0.45;
  }

  return 0;
}

function moviePeripheralTasteWeight(entry: MediaHistoryEntry): number {
  if (entry.status === 'planned') {
    return 0;
  }

  if (entry.status === 'current') {
    return 0.18;
  }

  const score = entry.score ?? 0;

  if (entry.status === 'completed') {
    if (entry.isFavorite && score >= 10) {
      return 0.2;
    }
    if (entry.isFavorite && score >= 9) {
      return 0.18;
    }
    if (score >= 9) {
      return 0.14;
    }
    if (score >= 8 && score < 9) {
      return 0.45;
    }
    if (score >= 6 && score < 8) {
      return 0.15;
    }
    if (score > 0 && score <= 5) {
      return 0.05;
    }
  }

  if (entry.status === 'dropped') {
    return 0.05;
  }

  return 0.08;
}

function movieNegativeDriftWeight(entry: MediaHistoryEntry): number {
  if (entry.status !== 'completed' && entry.status !== 'dropped') {
    return 0;
  }

  const score = entry.score ?? 0;
  if (entry.status === 'dropped') {
    return score <= 5 ? 0.42 : 0.24;
  }

  if (score <= 4) {
    return 0.36;
  }
  if (score <= 5.5) {
    return 0.28;
  }

  return 0;
}

function computeDroppedPressurePenalty(genres: string[], droppedPressure: Set<string>): number {
  if (droppedPressure.size === 0) {
    return 0;
  }
  const overlap = genres.filter(genre => droppedPressure.has(genre)).length;
  return overlap > 0 ? Math.min(16, overlap * 7) : 0;
}

function weakLaneDriftPenalty(laneFit: Record<MovieLaneKey, number>): number {
  const dominant = countDominantClusterMatches(laneFit);
  if (dominant >= 2) {
    return 0;
  }
  const weak = Object.values(laneFit).filter(v => v > 0 && v < 0.2).length;
  return weak >= 2 ? 8 : weak === 1 ? 4 : 0;
}

function hasNoCoreOverlap(genres: string[], loveGenreKeys: Set<string>): boolean {
  if (loveGenreKeys.size === 0) {
    return false;
  }
  return !genres.some(genre => loveGenreKeys.has(genre));
}

function continuationAffinityBoost(affinity: ContinuationAffinity): number {
  if (affinity === 'high') {
    return 8;
  }
  if (affinity === 'medium') {
    return 4;
  }
  return 1;
}

function isWeakTrustDiscoveryCandidate(
  candidate: MediaCandidate,
  isContinuation: boolean,
  dominantMatches: number,
): boolean {
  if (isContinuation) {
    return false;
  }
  if (candidate.popularityScore >= 62) {
    return false;
  }
  return dominantMatches < 2;
}

function computeMoviesOrderingBonus(
  candidate: MediaCandidate,
  genres: string[],
  laneFit: Record<MovieLaneKey, number>,
  semantic: SemanticCompatibility,
): number {
  const worldbuildingBonus =
    semantic.world >= 0.74 && semantic.texture >= 0.7
      ? 4.8
      : semantic.world >= 0.68 && semantic.texture >= 0.64
        ? 2.4
        : 0;
  const mythicAtmosphereBonus =
    laneFit.epicFantasyAdventure >= 0.26 && semantic.texture >= 0.7 ? 2.8 : 0;
  const reflectiveSciFiBonus =
    laneFit.prestigeReflectiveSciFi >= 0.28 && semantic.tone >= 0.58 ? 3.4 : 0;
  const philosophicalAtmosphereBonus =
    semantic.tone >= 0.62 && semantic.world >= 0.66 ? 2.2 : 0;

  const titleBonus =
    (WORLDBUILDING_ATMOSPHERE_PATTERN.test(candidate.title) ? 1.8 : 0) +
    (REFLECTIVE_SCI_FI_PATTERN.test(candidate.title) ? 1.4 : 0);

  const isGenericSpectacle =
    MASS_FRANCHISE_SPECTACLE_PATTERN.test(candidate.title) ||
    (genres.includes('action') &&
      genres.includes('adventure') &&
      !genres.includes('drama') &&
      semantic.tone < 0.58 &&
      semantic.world < 0.66);

  const genericSpectaclePenalty = isGenericSpectacle ? 4.2 : 0;
  const popularityBiasPenalty = candidate.popularityScore > 85
    ? Math.min(2.8, (candidate.popularityScore - 85) * 0.18)
    : 0;

  return (
    worldbuildingBonus +
    mythicAtmosphereBonus +
    reflectiveSciFiBonus +
    philosophicalAtmosphereBonus +
    titleBonus -
    genericSpectaclePenalty -
    popularityBiasPenalty
  );
}

function computeMoviesOrderingTieBreaker(title: string): number {
  const lowered = title.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < lowered.length; i += 1) {
    hash = (hash * 31 + lowered.charCodeAt(i)) % 997;
  }
  // Keep this tiny so it only resolves near ties.
  return hash / 10000;
}

function canonicalBoostForTitle(
  title: string,
  boosts: Array<{ pattern: RegExp; boost: number }>,
): number {
  const match = boosts.find(entry => entry.pattern.test(title));
  return match?.boost ?? 0;
}

function computeThematicSimilarity(laneFit: Record<MovieLaneKey, number>): number {
  const ordered = Object.values(laneFit).sort((a, b) => b - a);
  const first = ordered[0] ?? 0;
  const second = ordered[1] ?? 0;
  return roundConfidence(Math.min(1, first * 0.65 + second * 0.35));
}

function countDominantClusterMatches(laneFit: Record<MovieLaneKey, number>): number {
  return Object.values(laneFit).filter(v => v >= 0.25).length;
}

function normalizeLane(value: number, maxValue: number): number {
  return roundConfidence(Math.max(0, Math.min(1, value / maxValue)));
}

function topEvidenceTitles(evidence: LaneContribution[]): string[] {
  const deduped = new Map<string, number>();
  for (const entry of evidence) {
    deduped.set(entry.title, Math.max(deduped.get(entry.title) ?? 0, entry.score));
  }
  return Array.from(deduped.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([title]) => title);
}

function roundConfidence(value: number): number {
  return Math.round(value * 100) / 100;
}

function pickDominantExpressedLane(
  genres: string[],
  laneFit: Record<MovieLaneKey, number>,
): MovieLaneKey | null {
  const ordered = Object.entries(laneFit).sort((a, b) => b[1] - a[1]);
  for (const [lane, value] of ordered) {
    if (value < 0.2) {
      return null;
    }
    if (candidateExpressesLane(genres, lane as MovieLaneKey)) {
      return lane as MovieLaneKey;
    }
  }
  return null;
}

function topTwoExpressedLaneLabels(
  genres: string[],
  laneFit: Record<MovieLaneKey, number>,
): [string, string] {
  const ordered = Object.entries(laneFit)
    .sort((a, b) => b[1] - a[1])
    .filter(([lane]) => candidateExpressesLane(genres, lane as MovieLaneKey))
    .slice(0, 2)
    .map(([lane]) => LANE_LABELS[lane as MovieLaneKey].toLowerCase());

  if (ordered.length < 2) {
    return [ordered[0] ?? 'core movie taste', 'reflective storytelling'];
  }

  return [ordered[0], ordered[1]];
}

function candidateExpressesLane(genres: string[], lane: MovieLaneKey): boolean {
  switch (lane) {
    case 'epicFantasyAdventure':
      return genres.includes('fantasy') && genres.includes('adventure');
    case 'prestigeReflectiveSciFi':
      return genres.includes('sci-fi-fantasy') && (genres.includes('drama') || genres.includes('thriller'));
    case 'emotionalHumanPayoff':
      return genres.includes('drama') || genres.includes('biography') || genres.includes('history');
    case 'mythicHeroJourney':
      return (
        genres.includes('adventure') &&
        (genres.includes('fantasy') ||
          genres.includes('sci-fi-fantasy') ||
          genres.includes('action') ||
          genres.includes('drama'))
      );
    default:
      return false;
  }
}

function looksLikeBaseTitle(title: string): boolean {
  const baseLikePattern = /\b(the|a|an)\s+[a-z0-9' -]+$/i;
  if (!SEQUEL_MARKER_PATTERN.test(title) && baseLikePattern.test(title)) {
    return true;
  }
  const tokenCount = title.trim().split(/\s+/).length;
  return tokenCount <= 3 && !/\d/.test(title);
}

function deriveMovieFamilyKey(title: string): string {
  const lowered = title.toLowerCase();
  const stripped = lowered
    .replace(/[:\-]\s*.+$/g, '')
    .replace(SEQUEL_MARKER_PATTERN, '')
    .replace(/\b(the|a|an|movie|film)\b/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!stripped) {
    return extractFranchiseKey(title);
  }
  return stripped.split(' ').slice(0, 3).join('-');
}

function tokenizedTitle(title: string): Set<string> {
  const tokens = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  return new Set(tokens);
}

function computeContinuationAffinity(franchiseDepthByFamily: Map<string, number>): ContinuationAffinity {
  let repeatedFamilies = 0;
  let heavyFamilies = 0;

  for (const depth of franchiseDepthByFamily.values()) {
    if (depth >= 2) {
      repeatedFamilies += 1;
    }
    if (depth >= 3) {
      heavyFamilies += 1;
    }
  }

  if (heavyFamilies >= 2 || repeatedFamilies >= 4) {
    return 'high';
  }
  if (repeatedFamilies >= 2) {
    return 'medium';
  }
  return 'low';
}

function isArthouseLike(genres: string[], score: number | null): boolean {
  return (
    (genres.includes('drama') && genres.includes('mystery')) ||
    (genres.includes('drama') && (score ?? 0) >= 9.5)
  );
}

function isMainstreamLike(genres: string[], score: number | null, isFavorite: boolean): boolean {
  const genreSignal = genres.includes('action') || genres.includes('adventure') || genres.includes('fantasy');
  if (!genreSignal) {
    return false;
  }
  return isFavorite || (score ?? 0) >= 8;
}

function isAnimationFamilyLike(genres: string[], score: number | null, isFavorite: boolean): boolean {
  if (!(genres.includes('animation') || genres.includes('family'))) {
    return false;
  }
  return isFavorite || (score ?? 0) >= 8;
}

function isLiveActionSeriousLike(genres: string[], score: number | null, isFavorite: boolean): boolean {
  const seriousGenres =
    genres.includes('drama') || genres.includes('thriller') || genres.includes('history') || genres.includes('biography');
  const animatedFamily = genres.includes('animation') || genres.includes('family');
  if (!seriousGenres || animatedFamily) {
    return false;
  }
  return isFavorite || (score ?? 0) >= 8;
}

function isSpeculativeWorldLike(genres: string[], score: number | null): boolean {
  if (!(genres.includes('sci-fi-fantasy') || genres.includes('fantasy'))) {
    return false;
  }
  return (score ?? 0) >= 7;
}

function isEpicScaleLike(genres: string[], score: number | null, isFavorite: boolean): boolean {
  if (!genres.includes('adventure')) {
    return false;
  }
  const scaleSignal = genres.includes('fantasy') || genres.includes('sci-fi-fantasy') || genres.includes('action');
  if (!scaleSignal) {
    return false;
  }
  return isFavorite || (score ?? 0) >= 8;
}

export function movieLaneNames(): Record<MovieLaneKey, string> {
  return { ...LANE_LABELS };
}

export function normalizeMovieGenreKey(raw: string): string | null {
  return getCanonicalKey(raw);
}
