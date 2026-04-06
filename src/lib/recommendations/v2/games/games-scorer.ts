/**
 * V2 Games Scorer
 *
 * Unified scoring logic with dynamic weights
 */

import { getCanonicalKey } from '../../core/genre-normalization';
import {
  determineGenreWeights,
  getGenrePositionWeight,
  PLATFORM_BOOSTS,
  AVOIDED_GENRE_PENALTIES,
  STRONG_AFFINITY_THRESHOLD,
  SCORING_WEIGHTS,
  MIN_GENRE_AFFINITY,
  getPriorityTier,
} from '../core/scoring-engine';
import {
  getGenreAffinity,
  getThemeAffinity,
  isGenreAvoided,
  isGenreRecent,
} from '../core/preference-analyzer';
import { getGenreQuality } from '../core/genre-quality';
import { getGenreCoverage } from '../core/genre-coverage';
import type {
  UserPreferences,
  ScoredCandidate,
  ScoredBacklogItem,
  UserMediaEntry,
  GenreCoverage,
  PriorityTier,
} from '../types';

const BROAD_GAME_GENRE_KEYS = new Set(['adventure']);
const SERIES_CONNECTOR_TOKENS = new Set(['of', 'the', 'and', 'a', 'an', 'to']);
const TITLE_STOPWORD_TOKENS = new Set([
  'of',
  'the',
  'and',
  'a',
  'an',
  'to',
  'for',
  'in',
  'on',
  'part',
  'episode',
  'edition',
  'remastered',
  'remaster',
  'remake',
  'complete',
  'definitive',
  'ultimate',
  'deluxe',
  'gold',
  'anniversary',
  'directors',
  'cut',
  'game',
]);

type HistorySignalEntry = {
  title: string;
  score: number | null;
  isFavorite: boolean;
  status: UserMediaEntry['status'];
};

/**
 * Score a game (works for both backlog and database items)
 */
export function scoreGame(
  game: {
    mediaId: number;
    title: string;
    cover: string;
    slug: string;
    genres: string[];
    themes: string[];
    platforms: string[];
  },
  preferences: UserPreferences,
  coverageMap: Map<string, GenreCoverage>,
  options: {
    isBacklog?: boolean;
    popularityScore?: number;
  } = {},
): {
  genreScore: number;
  themeScore: number;
  platformBoost: number;
  finalScore: number;
  usedSecondaryPriority: boolean;
  primaryGenre: string;
  secondaryGenre?: string;
  matchedGenres: string[];
} {
  const { isBacklog = false, popularityScore = 0 } = options;

  // Determine dynamic weights based on generic detection
  const primaryGenre = game.genres[0] ?? '';
  const secondaryGenre = game.genres[1];

  const { weights, usedSecondaryPriority } = determineGenreWeights(
    primaryGenre,
    secondaryGenre,
    coverageMap,
    preferences.genreQualities,
  );

  // Calculate genre score with dynamic weights
  const genreScore = calculateGenreScore(game.genres, preferences, weights, coverageMap);

  // Calculate theme score (20% contribution, no penalty if missing)
  const themeScore = calculateThemeScore(game.themes, preferences);

  // Calculate platform boost
  const platformBoost = calculatePlatformBoost(game.platforms, preferences, isBacklog);

  // Combine scores: 80% genre + 20% theme
  let finalScore =
    genreScore * SCORING_WEIGHTS.GENRE_CONTRIBUTION +
    themeScore * SCORING_WEIGHTS.THEME_CONTRIBUTION;

  // Apply platform boost
  finalScore *= platformBoost;

  // Apply smart avoided genre penalty (quality-aware)
  const avoidedPenalty = calculateSmartAvoidedPenalty(game.genres, preferences);
  finalScore *= avoidedPenalty;

  // Apply popularity boost if available (for database items)
  if (popularityScore > 0) {
    const popularityBoost = 1 + Math.min(0.1, popularityScore / 100);
    finalScore *= popularityBoost;
  }

  const matchedGenres = game.genres.filter(g => getGenreAffinity(preferences, g) > 0);

  return {
    genreScore,
    themeScore,
    platformBoost,
    finalScore,
    usedSecondaryPriority,
    primaryGenre: getCanonicalKey(primaryGenre) ?? primaryGenre,
    secondaryGenre: secondaryGenre
      ? (getCanonicalKey(secondaryGenre) ?? secondaryGenre)
      : undefined,
    matchedGenres,
  };
}

/**
 * Calculate genre score with dynamic positional weights
 */
function calculateGenreScore(
  genres: string[],
  preferences: UserPreferences,
  weights: { primary: number; secondary: number; tertiary: number },
  coverageMap: Map<string, GenreCoverage>,
): number {
  if (genres.length === 0) {
    return 0;
  }

  let totalScore = 0;
  let totalWeight = 0;

  for (let i = 0; i < genres.length; i++) {
    const genre = genres[i];
    const affinity = getGenreAffinity(preferences, genre);

    if (affinity === 0) {
      continue;
    }

    const positionWeight = getGenrePositionWeight(i, weights);
    const coverageDampening = getCoverageDampening(genre, coverageMap);
    const broadGenreDampening = isBroadGameGenre(genre) ? 0.2 : 1.0;
    const effectiveWeight = positionWeight * coverageDampening * broadGenreDampening;

    // Add recency bonus
    const isRecent = isGenreRecent(preferences, genre);
    const recencyMultiplier = isRecent ? SCORING_WEIGHTS.RECENCY_MULTIPLIER : 1.0;

    totalScore += affinity * effectiveWeight * recencyMultiplier;
    totalWeight += effectiveWeight;
  }

  return totalWeight > 0 ? totalScore / totalWeight : 0;
}

/**
 * Calculate theme score
 */
function calculateThemeScore(themes: string[], preferences: UserPreferences): number {
  if (themes.length === 0) {
    return 0; // No penalty for missing themes
  }

  let totalScore = 0;
  let count = 0;

  for (const theme of themes) {
    const affinity = getThemeAffinity(preferences, theme);
    if (affinity > 0) {
      totalScore += affinity;
      count += 1;
    }
  }

  return count > 0 ? totalScore / count : 0;
}

/**
 * Calculate platform boost
 */
function calculatePlatformBoost(
  platforms: string[],
  preferences: UserPreferences,
  _isBacklog: boolean,
): number {
  if (platforms.length === 0 || !preferences.favoritePlatform) {
    return PLATFORM_BOOSTS.NONE;
  }

  const normalizedPlatforms = new Set(platforms.map(normalizePlatformFamily).filter(Boolean));
  const favoritePlatform = normalizePlatformFamily(preferences.favoritePlatform ?? '');
  const secondFavoritePlatform = normalizePlatformFamily(preferences.secondFavoritePlatform ?? '');

  if (favoritePlatform && normalizedPlatforms.has(favoritePlatform)) {
    return PLATFORM_BOOSTS.FAVORITE;
  }

  if (secondFavoritePlatform && normalizedPlatforms.has(secondFavoritePlatform)) {
    return PLATFORM_BOOSTS.SECOND_FAVORITE;
  }

  return PLATFORM_BOOSTS.NONE;
}

function normalizePlatformFamily(value: string): string {
  const normalized = value.toLowerCase().trim();
  if (!normalized) {
    return '';
  }
  if (
    normalized.includes('android') ||
    normalized.includes('ios') ||
    normalized.includes('iphone') ||
    normalized.includes('ipad') ||
    normalized.includes('mobile')
  ) {
    return 'mobile';
  }
  if (
    normalized.includes('pc') ||
    normalized.includes('windows') ||
    normalized.includes('linux') ||
    normalized.includes('mac') ||
    normalized.includes('steam')
  ) {
    return 'pc';
  }
  if (normalized.includes('playstation') || normalized.startsWith('ps')) {
    return 'playstation';
  }
  if (normalized.includes('xbox')) {
    return 'xbox';
  }
  if (
    normalized.includes('switch') ||
    normalized.includes('nintendo') ||
    normalized.includes('wii') ||
    normalized.includes('3ds') ||
    normalized.includes('ds')
  ) {
    return 'nintendo';
  }
  return normalized;
}

/**
 * Calculate smart avoided genre penalty
 * Considers:
 * - Position (primary vs secondary/tertiary)
 * - Quality signal of avoided genre
 * - Affinity strength of primary genre
 */
function calculateSmartAvoidedPenalty(genres: string[], preferences: UserPreferences): number {
  if (genres.length === 0) {
    return 1.0; // No penalty
  }

  let penalty = 1.0;

  // Get primary genre affinity
  const primaryAffinity = getGenreAffinity(preferences, genres[0]);

  for (let i = 0; i < genres.length; i++) {
    const genre = genres[i];
    const isAvoided = isGenreAvoided(preferences, genre);

    if (!isAvoided) {
      continue;
    }

    // Get quality signal for this avoided genre
    const quality = getGenreQuality(genre, preferences.genreQualities);
    const qualityScore = quality?.qualityScore ?? 0;

    if (i === 0) {
      // Primary genre is avoided
      // Only apply hard penalty if no strong loved genre exists
      const hasStrongLovedGenre = genres.some(
        g => getGenreAffinity(preferences, g) >= STRONG_AFFINITY_THRESHOLD,
      );

      if (!hasStrongLovedGenre) {
        penalty *= AVOIDED_GENRE_PENALTIES.PRIMARY_HARD;
      }
    } else {
      // Secondary/tertiary avoided genre
      // Apply smart penalty based on primary affinity + quality

      if (primaryAffinity >= STRONG_AFFINITY_THRESHOLD) {
        // Primary is strongly loved - trust the combination
        if (qualityScore < 0.4) {
          penalty *= AVOIDED_GENRE_PENALTIES.SECONDARY_TRUSTED;
        }
        // else: no penalty at all - fully trusted
      } else if (qualityScore >= 0.4) {
        // Avoided genre has decent quality
        penalty *= AVOIDED_GENRE_PENALTIES.SECONDARY_DECENT_QUALITY;
      } else {
        // Avoided genre has poor quality
        penalty *= AVOIDED_GENRE_PENALTIES.SECONDARY_POOR_QUALITY;
      }
    }
  }

  return penalty;
}

/**
 * Score backlog items with priority tiers
 */
export function scoreBacklogItems(
  backlogEntries: UserMediaEntry[],
  preferences: UserPreferences,
  coverageMap: Map<string, GenreCoverage>,
): ScoredBacklogItem[] {
  const scoredItems: ScoredBacklogItem[] = [];

  for (const entry of backlogEntries) {
    if (entry.status !== 'planned') {
      continue;
    }

    const scoring = scoreGame(
      {
        mediaId: entry.mediaId,
        title: entry.media.title,
        cover: entry.media.coverImageLarge || entry.media.coverImageMedium || '',
        slug: titleToSlug(entry.media.title),
        genres: entry.media.genres,
        themes: entry.media.themes ?? [],
        platforms: entry.media.platforms ?? [],
      },
      preferences,
      coverageMap,
      { isBacklog: true },
    );

    const priorityTier = getPriorityTier(entry.priority);
    const hasSpecificMatch = scoring.matchedGenres.some(genre => !isBroadGameGenre(genre));
    if (!hasSpecificMatch && (entry.priority ?? 0) < 80) {
      continue;
    }
    const reason = generateBacklogReason(entry, scoring, preferences);

    scoredItems.push({
      entry,
      priorityTier,
      genreScore: scoring.genreScore,
      platformBoost: scoring.platformBoost,
      finalScore: scoring.finalScore,
      reason,
      usedSecondaryPriority: scoring.usedSecondaryPriority,
    });
  }

  // Sort by priority tier first, then score
  return sortByPriorityAndScore(scoredItems);
}

/**
 * Score database games and apply diversity injection
 */
export function scoreDatabaseGames(
  games: Array<{
    id: number;
    title: string;
    coverImageLarge?: string;
    coverImageMedium?: string;
    slug: string;
    genres: string[];
    themes: string[];
    platforms: string[];
    popularityScore?: number;
  }>,
  preferences: UserPreferences,
  coverageMap: Map<string, GenreCoverage>,
  history: HistorySignalEntry[] = [],
): ScoredCandidate[] {
  // Filter by minimum genre affinity
  const candidates = games.filter(game => {
    const matchedGenres = game.genres.filter(
      g => getGenreAffinity(preferences, g) >= MIN_GENRE_AFFINITY,
    );
    if (matchedGenres.length === 0) {
      return false;
    }
    // Reject games that only match broad genres (e.g. Adventure).
    return matchedGenres.some(genre => !isBroadGameGenre(genre));
  });

  // Score each candidate
  const scored = candidates.map(game => {
    const scoring = scoreGame(
      {
        mediaId: game.id,
        title: game.title,
        cover: game.coverImageLarge || game.coverImageMedium || '',
        slug: game.slug,
        genres: game.genres,
        themes: game.themes,
        platforms: game.platforms,
      },
      preferences,
      coverageMap,
      { popularityScore: game.popularityScore },
    );

    const matchReason = generateMatchReason(game, scoring, preferences, coverageMap, history);

    return {
      mediaId: game.id,
      title: game.title,
      cover: game.coverImageLarge || game.coverImageMedium || '',
      slug: game.slug,
      category: 'games' as const,
      genres: game.genres,
      themes: game.themes,
      platforms: game.platforms,
      genreScore: scoring.genreScore,
      themeScore: scoring.themeScore,
      platformBoost: scoring.platformBoost,
      finalScore: scoring.finalScore,
      primaryGenre: scoring.primaryGenre,
      secondaryGenre: scoring.secondaryGenre,
      usedSecondaryPriority: scoring.usedSecondaryPriority,
      matchedGenres: scoring.matchedGenres,
      matchReason,
    };
  });

  // Sort by final score
  const sorted = scored.sort((a, b) => b.finalScore - a.finalScore);

  // Apply diversity injection
  return applyDiversityInjection(sorted);
}

/**
 * Generate backlog recommendation reason
 */
function generateBacklogReason(
  entry: UserMediaEntry,
  scoring: {
    genreScore: number;
    usedSecondaryPriority: boolean;
    primaryGenre: string;
    secondaryGenre?: string;
    matchedGenres: string[];
  },
  _preferences: UserPreferences,
): string {
  const priority = entry.priority ?? 0;
  const specificMatchedGenres = scoring.matchedGenres.filter(genre => !isBroadGameGenre(genre));

  if (priority >= 80) {
    return 'High priority in your backlog';
  }

  if (
    scoring.usedSecondaryPriority &&
    scoring.secondaryGenre &&
    !isBroadGameGenre(scoring.secondaryGenre)
  ) {
    return `Perfect ${formatGenreLabel(scoring.secondaryGenre)} match from your backlog`;
  }

  // Show multiple genres when applicable
  if (specificMatchedGenres.length >= 2) {
    const topGenres = specificMatchedGenres
      .slice(0, 2)
      .map(genre => formatGenreLabel(genre))
      .join(' & ');
    return `Combines ${topGenres} - your top genres`;
  }

  if (scoring.genreScore >= 80 && specificMatchedGenres.length === 1) {
    return `Perfect ${formatGenreLabel(specificMatchedGenres[0])} match from your backlog`;
  }

  return 'Ready to start from your backlog';
}

/**
 * Generate database match reason
 */
function generateMatchReason(
  game: { title: string; genres: string[] },
  scoring: {
    genreScore: number;
    usedSecondaryPriority: boolean;
    primaryGenre: string;
    secondaryGenre?: string;
    matchedGenres: string[];
  },
  preferences: UserPreferences,
  coverageMap: Map<string, GenreCoverage>,
  history: HistorySignalEntry[],
): string {
  const relatedHistory = findRelatedLovedGame(game.title, history);
  if (relatedHistory) {
    if (relatedHistory.score !== null && relatedHistory.score >= 8) {
      return `Because you rated ${relatedHistory.title} ${relatedHistory.score}/10`;
    }
    return `Because you loved ${relatedHistory.title}`;
  }

  const specificMatchedGenres = scoring.matchedGenres.filter(
    genre => !isGenericGenre(genre, coverageMap) && !isBroadGameGenre(genre),
  );

  if (scoring.usedSecondaryPriority && scoring.secondaryGenre) {
    return `Strong ${formatGenreLabel(scoring.secondaryGenre)} focus - perfect for you`;
  }

  if (specificMatchedGenres.length === 1 && scoring.genreScore >= 80) {
    return `Perfect ${formatGenreLabel(specificMatchedGenres[0])} match`;
  }

  if (specificMatchedGenres.length >= 2 && scoring.genreScore >= 70) {
    const topGenres = specificMatchedGenres
      .slice(0, 2)
      .map(genre => formatGenreLabel(genre))
      .join(' & ');
    return `Combines ${topGenres} - your top genres`;
  }

  const hasRecentGenre = game.genres.some(
    g => isGenreRecent(preferences, g) && !isBroadGameGenre(g),
  );
  if (hasRecentGenre) {
    return 'Matches your recent gaming interests';
  }

  return 'Strong match based on your taste';
}

function getCoverageDampening(genre: string, coverageMap: Map<string, GenreCoverage>): number {
  const coverage = getGenreCoverage(genre, coverageMap)?.coverage ?? 0;

  if (coverage <= 0.2) {
    return 1.0;
  }
  if (coverage >= 0.6) {
    return 0.45;
  }

  // Smoothly downweight broad genres before they become fully generic.
  return Math.max(0.55, 1 - coverage * 1.1);
}

function isGenericGenre(genre: string, coverageMap: Map<string, GenreCoverage>): boolean {
  return getGenreCoverage(genre, coverageMap)?.isGeneric ?? false;
}

function isBroadGameGenre(genre: string): boolean {
  const canonical = getCanonicalKey(genre) ?? genre.toLowerCase().trim();
  return BROAD_GAME_GENRE_KEYS.has(canonical);
}

function formatGenreLabel(genre: string): string {
  const normalized = (getCanonicalKey(genre) ?? genre).toLowerCase().trim();
  if (
    normalized === 'role-playing-rpg' ||
    normalized === 'role-playing-game' ||
    normalized === 'rpg'
  ) {
    return 'RPG';
  }
  if (
    normalized === 'turn-based' ||
    normalized === 'turn-based-strategy-tbs' ||
    normalized === 'tbs'
  ) {
    return 'Turn-based';
  }
  return normalized
    .split('-')
    .filter(Boolean)
    .map(token => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

function findRelatedLovedGame(
  candidateTitle: string,
  history: HistorySignalEntry[],
): HistorySignalEntry | null {
  if (!candidateTitle || history.length === 0) {
    return null;
  }

  const candidateSlug = titleToSlug(candidateTitle);
  const candidateSeriesKey = extractSeriesKey(candidateSlug);
  const candidateTokens = extractMeaningfulTitleTokens(candidateSlug);

  let best: { entry: HistorySignalEntry; score: number } | null = null;

  for (const entry of history) {
    if (entry.status !== 'completed') {
      continue;
    }
    const isStrongSignal =
      entry.isFavorite || (typeof entry.score === 'number' && entry.score >= 8);
    if (!isStrongSignal) {
      continue;
    }

    const entrySlug = titleToSlug(entry.title);
    const entrySeriesKey = extractSeriesKey(entrySlug);
    const entryTokens = extractMeaningfulTitleTokens(entrySlug);

    let relationScore = 0;
    if (candidateSeriesKey && entrySeriesKey && candidateSeriesKey === entrySeriesKey) {
      relationScore += 3;
    }

    const sharedTokens = countSharedTokens(candidateTokens, entryTokens);
    if (sharedTokens >= 2) {
      relationScore += 2;
    } else if (sharedTokens === 1) {
      relationScore += 1;
    }

    if (relationScore < 3) {
      continue;
    }

    const strength = relationScore + (entry.isFavorite ? 0.75 : 0) + (entry.score ?? 0) / 20;
    if (!best || strength > best.score) {
      best = { entry, score: strength };
    }
  }

  return best?.entry ?? null;
}

function extractSeriesKey(slug: string): string {
  const tokens = slug.split('-').filter(Boolean);
  if (tokens.length < 2) {
    return '';
  }

  const keyTokens = [tokens[0], tokens[1]];
  if (SERIES_CONNECTOR_TOKENS.has(tokens[1]) && tokens.length >= 3) {
    keyTokens.push(tokens[2]);
  }

  return keyTokens.join('-');
}

function extractMeaningfulTitleTokens(slug: string): Set<string> {
  const tokens = slug.split('-').filter(Boolean);
  const meaningful = tokens.filter(token => {
    if (!token || TITLE_STOPWORD_TOKENS.has(token)) {
      return false;
    }
    if (/^\d+$/.test(token)) {
      return false;
    }
    return token.length > 2;
  });
  return new Set(meaningful);
}

function countSharedTokens(a: Set<string>, b: Set<string>): number {
  let count = 0;
  for (const token of a) {
    if (b.has(token)) {
      count += 1;
    }
  }
  return count;
}

/**
 * Sort backlog by priority tier then score
 */
function sortByPriorityAndScore(items: ScoredBacklogItem[]): ScoredBacklogItem[] {
  const tierOrder: Record<PriorityTier, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };

  return items.sort((a, b) => {
    const tierDiff = tierOrder[a.priorityTier] - tierOrder[b.priorityTier];
    if (tierDiff !== 0) {
      return tierDiff;
    }
    return b.finalScore - a.finalScore;
  });
}

/**
 * Apply diversity injection
 */
function applyDiversityInjection(ranked: ScoredCandidate[]): ScoredCandidate[] {
  if (ranked.length <= 2) {
    return ranked;
  }

  const result: ScoredCandidate[] = [];
  result.push(...ranked.slice(0, 2)); // Top 2: pure accuracy

  const remaining = ranked.slice(2);

  for (const game of remaining) {
    const last2Primary = result.slice(-2).map(g => g.primaryGenre);
    if (last2Primary.length === 2 && last2Primary.every(g => g === game.primaryGenre)) {
      continue;
    }
    result.push(game);
    if (result.length >= ranked.length) {
      break;
    }
  }

  return result;
}

/**
 * Convert title to slug
 */
function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
