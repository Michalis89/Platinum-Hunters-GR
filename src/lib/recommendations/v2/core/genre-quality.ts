/**
 * Genre Quality Signal Calculator
 *
 * Calculates quality score for each genre based on user's history:
 * - Completion rate (50%)
 * - Average rating normalized (30%)
 * - Favorite rate (20%)
 */

import { getCanonicalKey } from '../../core/genre-normalization';
import type { UserMediaEntry, GenreQualitySignal } from '../types';

/**
 * Build genre quality signals from user's media history
 *
 * @param mediaHistory - User's media entries
 * @returns Map of canonical genre key -> quality signal
 */
export function buildGenreQualitySignals(
  mediaHistory: UserMediaEntry[],
): Map<string, GenreQualitySignal> {
  // Collect stats for each genre
  const genreStats = new Map<
    string,
    {
      completedCount: number;
      currentCount: number;
      droppedCount: number;
      favoriteCount: number;
      ratings: number[];
    }
  >();

  for (const entry of mediaHistory) {
    // Only consider completed, current, and dropped for quality
    // (planned items don't tell us about quality)
    if (entry.status === 'planned') {
      continue;
    }

    const genres = entry.media.genres ?? [];

    for (const genre of genres) {
      const canonicalKey = getCanonicalKey(genre);
      if (!canonicalKey) {
        continue;
      }

      const stats = genreStats.get(canonicalKey) ?? {
        completedCount: 0,
        currentCount: 0,
        droppedCount: 0,
        favoriteCount: 0,
        ratings: [],
      };

      if (entry.status === 'completed') {
        stats.completedCount += 1;
      } else if (entry.status === 'current') {
        stats.currentCount += 1;
      } else if (entry.status === 'dropped') {
        stats.droppedCount += 1;
      }

      if (entry.isFavorite) {
        stats.favoriteCount += 1;
      }

      if (entry.score !== null) {
        stats.ratings.push(entry.score);
      }

      genreStats.set(canonicalKey, stats);
    }
  }

  // Calculate quality signals
  const qualitySignals = new Map<string, GenreQualitySignal>();

  for (const [genre, stats] of genreStats.entries()) {
    const totalItems = stats.completedCount + stats.currentCount + stats.droppedCount;

    if (totalItems === 0) {
      continue;
    }

    // Completion rate: completed / (completed + current + dropped)
    const completionRate = totalItems > 0 ? stats.completedCount / totalItems : 0;

    // Average rating
    const avgRating =
      stats.ratings.length > 0
        ? stats.ratings.reduce((sum, r) => sum + r, 0) / stats.ratings.length
        : null;

    // Normalized average rating (0-1)
    const normalizedAvgRating = avgRating !== null ? avgRating / 10 : 0;

    // Favorite rate: favorites / total_items
    const favoriteRate = totalItems > 0 ? stats.favoriteCount / totalItems : 0;

    // Quality score = 0.5 * completionRate + 0.3 * normalizedAvgRating + 0.2 * favoriteRate
    const qualityScore = 0.5 * completionRate + 0.3 * normalizedAvgRating + 0.2 * favoriteRate;

    qualitySignals.set(genre, {
      genre,
      completionRate,
      avgRating,
      normalizedAvgRating,
      favoriteRate,
      qualityScore,
      totalItems,
      completedItems: stats.completedCount,
      favoriteItems: stats.favoriteCount,
    });
  }

  return qualitySignals;
}

/**
 * Get quality signal for a genre
 */
export function getGenreQuality(
  genre: string,
  qualitySignals: Map<string, GenreQualitySignal>,
): GenreQualitySignal | null {
  const canonicalKey = getCanonicalKey(genre);
  if (!canonicalKey) {
    return null;
  }

  return qualitySignals.get(canonicalKey) ?? null;
}

/**
 * Compare quality between two genres
 * Returns true if genre1 has higher quality than genre2
 */
export function hasHigherQuality(
  genre1: string,
  genre2: string,
  qualitySignals: Map<string, GenreQualitySignal>,
): boolean {
  const quality1 = getGenreQuality(genre1, qualitySignals);
  const quality2 = getGenreQuality(genre2, qualitySignals);

  // If one doesn't have quality data, the other wins
  if (!quality1 && quality2) {
    return false;
  }
  if (quality1 && !quality2) {
    return true;
  }
  if (!quality1 && !quality2) {
    return false;
  }

  return quality1!.qualityScore > quality2!.qualityScore;
}

/**
 * Check if a genre has "strong quality signal"
 * Strong means: qualityScore >= 0.6 AND totalItems >= 3
 */
export function hasStrongQualitySignal(
  genre: string,
  qualitySignals: Map<string, GenreQualitySignal>,
): boolean {
  const quality = getGenreQuality(genre, qualitySignals);
  if (!quality) {
    return false;
  }

  return quality.qualityScore >= 0.6 && quality.totalItems >= 3;
}
