/**
 * V2 Preference Analyzer
 *
 * Builds user preferences with enhanced quality signals
 */

import { getCanonicalKey } from '../../core/genre-normalization';
import {
  SCORING_WEIGHTS,
  getRatingBoost,
  isRecent,
  AVOIDED_GENRE_THRESHOLD,
} from './scoring-engine';
import { buildGenreQualitySignals } from './genre-quality';
import type { UserPreferences, UserMediaEntry, UserGenreAffinity, AvoidedGenre } from '../types';

/**
 * Build user preferences from data
 */
export function buildUserPreferences(
  genreAffinities: UserGenreAffinity[],
  mediaHistory: UserMediaEntry[],
  favoritePlatform: string | null = null,
  secondFavoritePlatform: string | null = null,
): UserPreferences {
  // Build genre affinities map
  const genreAffinitiesMap = new Map<string, UserGenreAffinity>();
  for (const affinity of genreAffinities) {
    const canonicalKey = getCanonicalKey(affinity.genre);
    if (canonicalKey) {
      genreAffinitiesMap.set(canonicalKey, {
        ...affinity,
        signalRatio: affinity.itemCount > 0 ? affinity.strongSignalCount / affinity.itemCount : 0,
      });
    }
  }

  // Build genre quality signals
  const genreQualities = buildGenreQualitySignals(mediaHistory);

  // Build theme affinities
  const themeAffinitiesMap = buildThemeAffinities(mediaHistory);

  // Build avoided genres with new rule
  const avoidedGenresMap = buildAvoidedGenres(mediaHistory);

  // Build recent genres
  const recentGenres = buildRecentGenres(mediaHistory);

  return {
    genreAffinities: genreAffinitiesMap,
    genreQualities,
    themeAffinities: themeAffinitiesMap,
    avoidedGenres: avoidedGenresMap,
    favoritePlatform,
    secondFavoritePlatform,
    recentGenres,
  };
}

/**
 * Build theme affinities from media history
 */
function buildThemeAffinities(mediaHistory: UserMediaEntry[]): Map<string, number> {
  const themeWeights = new Map<string, number>();
  const themeCounts = new Map<string, number>();

  for (const entry of mediaHistory) {
    if (entry.status !== 'completed' && entry.status !== 'current') {
      continue;
    }

    const themes = entry.media.themes ?? [];
    if (themes.length === 0) {
      continue;
    }

    let weight = SCORING_WEIGHTS.STATUS_WEIGHTS[entry.status];

    if (entry.score) {
      weight += getRatingBoost(entry.score) / 100;
    }

    if (entry.isFavorite) {
      weight += SCORING_WEIGHTS.FAVORITE_BONUS / 100;
    }

    if (entry.status === 'completed' && isRecent(entry.updatedAt)) {
      weight *= SCORING_WEIGHTS.RECENCY_MULTIPLIER;
    }

    for (const theme of themes) {
      const canonicalKey = getCanonicalKey(theme);
      if (!canonicalKey) {
        continue;
      }

      const currentWeight = themeWeights.get(canonicalKey) ?? 0;
      const currentCount = themeCounts.get(canonicalKey) ?? 0;

      themeWeights.set(canonicalKey, currentWeight + weight);
      themeCounts.set(canonicalKey, currentCount + 1);
    }
  }

  const themeAffinities = new Map<string, number>();
  for (const [theme, totalWeight] of themeWeights.entries()) {
    const count = themeCounts.get(theme) ?? 1;
    const avgWeight = totalWeight / count;
    const affinityScore = Math.min(100, avgWeight * 20);
    themeAffinities.set(theme, affinityScore);
  }

  return themeAffinities;
}

/**
 * Build avoided genres with new rule:
 * dropped >= 3 AND completed / (completed + dropped) < 0.4
 */
function buildAvoidedGenres(mediaHistory: UserMediaEntry[]): Map<string, AvoidedGenre> {
  const genreStats = new Map<
    string,
    {
      droppedCount: number;
      completedCount: number;
    }
  >();

  for (const entry of mediaHistory) {
    if (entry.status !== 'dropped' && entry.status !== 'completed') {
      continue;
    }

    const genres = entry.media.genres ?? [];

    for (const genre of genres) {
      const canonicalKey = getCanonicalKey(genre);
      if (!canonicalKey) {
        continue;
      }

      const stats = genreStats.get(canonicalKey) ?? {
        droppedCount: 0,
        completedCount: 0,
      };

      if (entry.status === 'dropped') {
        stats.droppedCount += 1;
      } else if (entry.status === 'completed') {
        stats.completedCount += 1;
      }

      genreStats.set(canonicalKey, stats);
    }
  }

  const avoidedGenres = new Map<string, AvoidedGenre>();

  for (const [genre, stats] of genreStats.entries()) {
    const totalInteracted = stats.droppedCount + stats.completedCount;
    if (totalInteracted === 0) {
      continue;
    }

    const completionRatio = stats.completedCount / totalInteracted;

    // Check if genre is avoided:
    // dropped >= 3 AND completionRatio < 0.4
    const isAvoided =
      stats.droppedCount >= AVOIDED_GENRE_THRESHOLD.MIN_DROPPED &&
      completionRatio < AVOIDED_GENRE_THRESHOLD.MAX_COMPLETION_RATIO;

    if (isAvoided) {
      avoidedGenres.set(genre, {
        genre,
        droppedCount: stats.droppedCount,
        completedCount: stats.completedCount,
        completionRatio,
        isAvoided: true,
      });
    }
  }

  return avoidedGenres;
}

/**
 * Build set of genres from recent completions (last 90 days)
 */
function buildRecentGenres(mediaHistory: UserMediaEntry[]): Set<string> {
  const recentGenres = new Set<string>();

  for (const entry of mediaHistory) {
    if (entry.status !== 'completed') {
      continue;
    }

    if (!isRecent(entry.updatedAt)) {
      continue;
    }

    const genres = entry.media.genres ?? [];
    for (const genre of genres) {
      const canonicalKey = getCanonicalKey(genre);
      if (canonicalKey) {
        recentGenres.add(canonicalKey);
      }
    }
  }

  return recentGenres;
}

/**
 * Get affinity score for a genre
 */
export function getGenreAffinity(preferences: UserPreferences, genre: string): number {
  const canonicalKey = getCanonicalKey(genre);
  if (!canonicalKey) {
    return 0;
  }
  return preferences.genreAffinities.get(canonicalKey)?.score ?? 0;
}

/**
 * Get affinity score for a theme
 */
export function getThemeAffinity(preferences: UserPreferences, theme: string): number {
  const canonicalKey = getCanonicalKey(theme);
  if (!canonicalKey) {
    return 0;
  }
  return preferences.themeAffinities.get(canonicalKey) ?? 0;
}

/**
 * Check if a genre is avoided
 */
export function isGenreAvoided(preferences: UserPreferences, genre: string): boolean {
  const canonicalKey = getCanonicalKey(genre);
  if (!canonicalKey) {
    return false;
  }
  const avoided = preferences.avoidedGenres.get(canonicalKey);
  return avoided?.isAvoided ?? false;
}

/**
 * Check if a genre is recent
 */
export function isGenreRecent(preferences: UserPreferences, genre: string): boolean {
  const canonicalKey = getCanonicalKey(genre);
  if (!canonicalKey) {
    return false;
  }
  return preferences.recentGenres.has(canonicalKey);
}
