/**
 * V2 Scoring Engine
 *
 * Dynamic, data-driven scoring with adaptive weights
 */

import type { GenreWeights, GenreCoverage, GenreQualitySignal } from '../types';
import { isGenreGeneric } from './genre-coverage';
import { hasHigherQuality, hasStrongQualitySignal } from './genre-quality';

/**
 * Core scoring weights
 */
export const SCORING_WEIGHTS = {
  // Genre contributes 80% of the score
  GENRE_CONTRIBUTION: 0.8,

  // Themes contribute 20% boost (no penalty if missing)
  THEME_CONTRIBUTION: 0.2,

  // Default genre position weights (when primary is NOT generic)
  DEFAULT_GENRE_WEIGHTS: {
    PRIMARY: 0.55,
    SECONDARY: 0.3,
    TERTIARY: 0.15,
  },

  // Adjusted weights when primary genre is generic
  GENERIC_PRIMARY_WEIGHTS: {
    PRIMARY: 0.3,
    SECONDARY: 0.5,
    TERTIARY: 0.2,
  },

  // Status weights (for building user preferences)
  STATUS_WEIGHTS: {
    completed: 1.5,
    current: 1.0,
    planned: 0.2,
  },

  // Rating boosts (added as flat bonus)
  RATING_BOOSTS: {
    HIGH: 20, // 8-10 rating
    MEDIUM: 10, // 6-7 rating
  },

  // Favorite bonus (flat addition to score)
  FAVORITE_BONUS: 50,

  // Recency multiplier (for games completed in last 90 days)
  RECENCY_MULTIPLIER: 1.2,
} as const;

/**
 * Platform boost multipliers
 */
export const PLATFORM_BOOSTS = {
  FAVORITE: 1.2, // +20% if game is on user's favorite platform
  SECOND_FAVORITE: 1.08, // +8% if game is on 2nd favorite platform
  NONE: 1.0, // No boost
} as const;

/**
 * Avoided genre threshold
 * dropped >= 3 AND completion_ratio < 0.4
 */
export const AVOIDED_GENRE_THRESHOLD = {
  MIN_DROPPED: 3,
  MAX_COMPLETION_RATIO: 0.4,
} as const;

/**
 * Avoided genre penalties (smart, quality-aware)
 */
export const AVOIDED_GENRE_PENALTIES = {
  // Primary genre is avoided AND no strong loved genre
  PRIMARY_HARD: 0.5, // 50% penalty

  // Secondary/tertiary avoided with poor quality (<0.4)
  SECONDARY_POOR_QUALITY: 0.6, // 40% penalty

  // Secondary/tertiary avoided with decent quality (>=0.4)
  SECONDARY_DECENT_QUALITY: 0.8, // 20% penalty

  // Secondary/tertiary avoided BUT primary is strongly loved (>=70)
  SECONDARY_TRUSTED: 0.95, // 5% penalty only
} as const;

/**
 * Strong affinity threshold (for trusted combinations).
 * Calibrated for the multiplicative scoring algorithm: ~5 completed
 * high-rated games in a single genre yields a score around 8–10.
 */
export const STRONG_AFFINITY_THRESHOLD = 8.0;

/**
 * Recommendation limits
 */
export const RECOMMENDATION_LIMITS = {
  TOTAL: 4,
  BACKLOG: 2,
  DATABASE: 2,
  DATABASE_FALLBACK: 4,
} as const;

/**
 * Minimum affinity score for database recommendations.
 * Calibrated for the multiplicative scoring algorithm in genre-affinity.ts.
 * A score of 3.0 represents approximately 2 completed games in a single genre
 * (2 × 1.5 baseWeight), the minimum to pass meetsDefaultEvidence.
 */
export const MIN_GENRE_AFFINITY = 3.0;

/**
 * Minimum popularity gate (users who tracked the game)
 */
export const MIN_POPULARITY = 3;

/**
 * Recency window in days
 */
export const RECENCY_WINDOW_DAYS = 90;

/**
 * Determine genre weights based on primary genre genericness
 *
 * @param primaryGenre - The primary genre
 * @param secondaryGenre - The secondary genre (if exists)
 * @param coverageMap - Genre coverage data
 * @param qualitySignals - Genre quality signals
 * @returns Genre weights to use
 */
export function determineGenreWeights(
  primaryGenre: string | undefined,
  secondaryGenre: string | undefined,
  coverageMap: Map<string, GenreCoverage>,
  qualitySignals: Map<string, GenreQualitySignal>,
): { weights: GenreWeights; usedSecondaryPriority: boolean } {
  // If no primary genre, use default
  if (!primaryGenre) {
    return {
      weights: {
        primary: SCORING_WEIGHTS.DEFAULT_GENRE_WEIGHTS.PRIMARY,
        secondary: SCORING_WEIGHTS.DEFAULT_GENRE_WEIGHTS.SECONDARY,
        tertiary: SCORING_WEIGHTS.DEFAULT_GENRE_WEIGHTS.TERTIARY,
      },
      usedSecondaryPriority: false,
    };
  }

  // Check if primary genre is generic
  const isPrimaryGeneric = isGenreGeneric(primaryGenre, coverageMap);

  // If primary is NOT generic, use default weights
  if (!isPrimaryGeneric) {
    return {
      weights: {
        primary: SCORING_WEIGHTS.DEFAULT_GENRE_WEIGHTS.PRIMARY,
        secondary: SCORING_WEIGHTS.DEFAULT_GENRE_WEIGHTS.SECONDARY,
        tertiary: SCORING_WEIGHTS.DEFAULT_GENRE_WEIGHTS.TERTIARY,
      },
      usedSecondaryPriority: false,
    };
  }

  // Primary IS generic - check if we should flip weights
  // Flip if: secondary genre has stronger quality signal
  if (secondaryGenre) {
    const secondaryHasStrongSignal = hasStrongQualitySignal(secondaryGenre, qualitySignals);
    const secondaryHasHigherQuality = hasHigherQuality(
      secondaryGenre,
      primaryGenre,
      qualitySignals,
    );

    if (secondaryHasStrongSignal || secondaryHasHigherQuality) {
      return {
        weights: {
          primary: SCORING_WEIGHTS.GENERIC_PRIMARY_WEIGHTS.PRIMARY,
          secondary: SCORING_WEIGHTS.GENERIC_PRIMARY_WEIGHTS.SECONDARY,
          tertiary: SCORING_WEIGHTS.GENERIC_PRIMARY_WEIGHTS.TERTIARY,
        },
        usedSecondaryPriority: true,
      };
    }
  }

  // Primary is generic but secondary doesn't override - still use adjusted weights
  return {
    weights: {
      primary: SCORING_WEIGHTS.GENERIC_PRIMARY_WEIGHTS.PRIMARY,
      secondary: SCORING_WEIGHTS.GENERIC_PRIMARY_WEIGHTS.SECONDARY,
      tertiary: SCORING_WEIGHTS.GENERIC_PRIMARY_WEIGHTS.TERTIARY,
    },
    usedSecondaryPriority: false,
  };
}

/**
 * Get genre position weight
 */
export function getGenrePositionWeight(position: number, weights: GenreWeights): number {
  if (position === 0) {
    return weights.primary;
  }
  if (position === 1) {
    return weights.secondary;
  }
  return weights.tertiary;
}

/**
 * Calculate rating boost
 */
export function getRatingBoost(rating: number | null): number {
  if (rating === null) {
    return 0;
  }

  if (rating >= 8) {
    return SCORING_WEIGHTS.RATING_BOOSTS.HIGH;
  }
  if (rating >= 6) {
    return SCORING_WEIGHTS.RATING_BOOSTS.MEDIUM;
  }
  return 0;
}

/**
 * Check if a timestamp is within recency window
 */
export function isRecent(timestamp: string, windowDays: number = RECENCY_WINDOW_DAYS): boolean {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= windowDays;
}

/**
 * Get priority tier for a priority value
 */
export function getPriorityTier(priority: number | null): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
  if (priority === null) {
    return 'LOW';
  }

  if (priority >= 80) {
    return 'CRITICAL';
  }
  if (priority >= 50) {
    return 'HIGH';
  }
  if (priority >= 20) {
    return 'MEDIUM';
  }
  return 'LOW';
}
