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
import type {
  UserPreferences,
  ScoredCandidate,
  ScoredBacklogItem,
  UserMediaEntry,
  GenreCoverage,
  PriorityTier,
} from '../types';

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
  const genreScore = calculateGenreScore(game.genres, preferences, weights);

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

    // Add recency bonus
    const isRecent = isGenreRecent(preferences, genre);
    const recencyMultiplier = isRecent ? SCORING_WEIGHTS.RECENCY_MULTIPLIER : 1.0;

    totalScore += affinity * positionWeight * recencyMultiplier;
    totalWeight += positionWeight;
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

  const normalizedPlatforms = platforms.map(p => p.toLowerCase().trim());
  const favoritePlatform = preferences.favoritePlatform?.toLowerCase().trim();
  const secondFavoritePlatform = preferences.secondFavoritePlatform?.toLowerCase().trim();

  if (favoritePlatform && normalizedPlatforms.includes(favoritePlatform)) {
    return PLATFORM_BOOSTS.FAVORITE;
  }

  if (secondFavoritePlatform && normalizedPlatforms.includes(secondFavoritePlatform)) {
    return PLATFORM_BOOSTS.SECOND_FAVORITE;
  }

  return PLATFORM_BOOSTS.NONE;
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
): ScoredCandidate[] {
  // Filter by minimum genre affinity
  const candidates = games.filter(game =>
    game.genres.some(g => getGenreAffinity(preferences, g) >= MIN_GENRE_AFFINITY),
  );

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

    const matchReason = generateMatchReason(game, scoring, preferences);

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

  if (priority >= 80) {
    return 'High priority in your backlog';
  }

  if (scoring.usedSecondaryPriority && scoring.secondaryGenre) {
    return `Perfect ${scoring.secondaryGenre} match from your backlog`;
  }

  if (scoring.genreScore >= 80) {
    return `Perfect ${scoring.primaryGenre} match from your backlog`;
  }

  if (scoring.matchedGenres.length >= 2) {
    const topGenres = scoring.matchedGenres.slice(0, 2).join(' & ');
    return `${topGenres} - combines your favorite genres`;
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
): string {
  if (scoring.usedSecondaryPriority && scoring.secondaryGenre) {
    return `Strong ${scoring.secondaryGenre} focus - perfect for you`;
  }

  if (scoring.matchedGenres.length === 1 && scoring.genreScore >= 80) {
    return `Perfect ${scoring.matchedGenres[0]} match`;
  }

  if (scoring.matchedGenres.length >= 2 && scoring.genreScore >= 70) {
    const topGenres = scoring.matchedGenres.slice(0, 2).join(' & ');
    return `Combines ${topGenres} - your top genres`;
  }

  const hasRecentGenre = game.genres.some(g => isGenreRecent(preferences, g));
  if (hasRecentGenre) {
    return 'Matches your recent gaming interests';
  }

  return 'Strong match based on your taste';
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
