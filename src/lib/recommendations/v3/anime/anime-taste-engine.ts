import { getCanonicalKey } from '../utils/genre';
import type { MediaHistoryEntry } from '../types';
import type { AnimeTasteComputation, AnimeTasteProfile } from './anime-types';
import { getAnimeFranchiseKey, getAnimeInstallmentNumber } from './anime-normalizers';

const BATTLE_AXIS_GENRES = ['action', 'shounen', 'supernatural', 'adventure', 'martial-arts', 'super-power'];
const PREMIUM_AXIS_GENRES = ['fantasy', 'drama', 'adventure', 'award-winning', 'historical', 'reincarnation', 'isekai'];
const SUSPENSE_AXIS_GENRES = ['suspense', 'psychological', 'mystery', 'time-travel', 'thriller'];

export function buildAnimeTasteProfile(history: MediaHistoryEntry[]): AnimeTasteComputation {
  const genreWeights = new Map<string, number>();
  const negativeGenreWeights = new Map<string, number>();
  const franchiseMomentum = new Map<string, number>();

  let continuationPatternCount = 0;
  let premiumLandmarkBoost = 0;
  const singleTenFavoriteMasterpiece = hasSingleTenFavoriteMasterpiece(history);

  const engagedEntries = history.filter(entry => entry.status === 'completed' || entry.status === 'current');

  for (const entry of history) {
    const weight = tasteWeight(entry);
    if (weight === 0) {
      continue;
    }

    const canonicalGenres = entry.media.genres
      .map(raw => getCanonicalKey(raw))
      .filter((value): value is string => Boolean(value));

    if (weight > 0) {
      for (const genre of canonicalGenres) {
        genreWeights.set(genre, (genreWeights.get(genre) ?? 0) + weight);
      }

      if (entry.status === 'completed' || entry.status === 'current') {
        const franchiseKey = getAnimeFranchiseKey(entry.media.title);
        franchiseMomentum.set(franchiseKey, (franchiseMomentum.get(franchiseKey) ?? 0) + 1);

        const seq = getAnimeInstallmentNumber(entry.media.title);
        if (seq !== null && seq >= 2) {
          continuationPatternCount += 1;
        }
      }

      if (isPremiumLandmark(entry, canonicalGenres)) {
        premiumLandmarkBoost += 4;
        if ((entry.score ?? 0) >= 10 && entry.isFavorite) {
          premiumLandmarkBoost += 8;
        }
      }
      continue;
    }

    for (const genre of canonicalGenres) {
      negativeGenreWeights.set(genre, (negativeGenreWeights.get(genre) ?? 0) + Math.abs(weight));
    }
  }

  const battleAxisWeight = sumAxisWeight(genreWeights, BATTLE_AXIS_GENRES);
  const suspenseAxisWeight = sumAxisWeight(genreWeights, SUSPENSE_AXIS_GENRES);
  const premiumAxisBase = sumAxisWeight(genreWeights, PREMIUM_AXIS_GENRES);
  const premiumAxisWeight = premiumAxisBase + premiumLandmarkBoost;

  const progressionWeight =
    continuationPatternCount * 1.5 +
    Array.from(franchiseMomentum.values()).reduce((sum, count) => sum + Math.max(0, count - 1), 0);

  const qualityBiasWeight = history.reduce((sum, entry) => {
    if (entry.status !== 'completed') {
      return sum;
    }
    let value = 0;
    if ((entry.score ?? 0) >= 9) {
      value += 1.2;
    }
    if (entry.isFavorite) {
      value += 1.1;
    }
    return sum + value;
  }, 0);

  const coreGenres: AnimeTasteProfile['coreGenres'] = [
    { name: 'battle shounen / supernatural action', weight: battleAxisWeight },
    { name: 'prestige fantasy / emotional adventure', weight: premiumAxisWeight },
    { name: 'suspense / psychological pressure', weight: suspenseAxisWeight },
  ]
    .filter(item => item.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3);

  const topThemes: AnimeTasteProfile['topThemes'] = [
    { name: 'arc progression', weight: progressionWeight },
    { name: 'franchise momentum', weight: progressionWeight * 0.88 },
    { name: 'emotional character journeys', weight: premiumAxisWeight * 0.92 },
    { name: 'reflective storytelling', weight: premiumAxisWeight * 0.8 },
    { name: 'psychological suspense', weight: suspenseAxisWeight * 0.9 },
  ]
    .filter(item => item.weight > 0.75)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);

  const viewerStyles: AnimeTasteProfile['viewerStyles'] = [
    { name: 'continuation-first franchise viewer', weight: progressionWeight },
    { name: 'quality-sensitive completion pattern', weight: qualityBiasWeight },
    { name: 'character-payoff focused watcher', weight: premiumAxisWeight * 0.72 },
  ]
    .filter(item => item.weight > 0.7)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 4);

  const premiumSignals: AnimeTasteProfile['premiumSignals'] = [
    { name: '10/10 favorite-led premium lane', weight: premiumLandmarkBoost },
    { name: 'award-winning fantasy / drama affinity', weight: genreWeights.get('award-winning') ?? 0 },
    { name: 'reflective emotional fantasy preference', weight: premiumAxisWeight * 0.6 },
  ]
    .filter(item => item.weight > 0.7)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 4);

  const negativeSignals = Array.from(negativeGenreWeights.entries())
    .filter(([, weight]) => weight > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, weight]) => ({ name, weight }));

  const summary = buildSummary({
    battleAxisWeight,
    premiumAxisWeight,
    suspenseAxisWeight,
    engagedCount: engagedEntries.length,
  });

  const profile: AnimeTasteProfile = {
    summary,
    coreGenres,
    topThemes,
    viewerStyles,
    premiumSignals,
    negativeSignals,
  };

  return {
    profile,
    signals: {
      battleAxisGenres: new Set(BATTLE_AXIS_GENRES),
      premiumAxisGenres: new Set(PREMIUM_AXIS_GENRES),
      suspenseAxisGenres: new Set(SUSPENSE_AXIS_GENRES),
      lovedGenreKeys: new Set(
        Array.from(genreWeights.entries())
          .filter(([, value]) => value >= 2)
          .map(([genre]) => genre),
      ),
      avoidedGenreKeys: new Set(negativeSignals.map(item => item.name)),
      premiumAxisStrength: premiumAxisWeight,
      hasSingleTenFavoriteMasterpiece: singleTenFavoriteMasterpiece,
      topEvidenceTitles: history
        .filter(item => item.status === 'completed')
        .sort((a, b) => scoreSignalStrength(b) - scoreSignalStrength(a))
        .slice(0, 5)
        .map(item => item.media.title),
    },
  };
}

function buildSummary(input: {
  battleAxisWeight: number;
  premiumAxisWeight: number;
  suspenseAxisWeight: number;
  engagedCount: number;
}): string {
  if (input.engagedCount === 0) {
    return 'Your anime identity is still forming from completed and in-progress titles.';
  }

  if (input.suspenseAxisWeight >= 4) {
    return 'Your anime identity combines battle shounen momentum with a premium fantasy lane and a secondary suspense axis.';
  }

  return 'Your anime identity is battle shounen momentum plus a premium fantasy lane focused on emotional character journeys.';
}

function tasteWeight(entry: MediaHistoryEntry): number {
  if (entry.status === 'planned') {
    return 0;
  }

  if (entry.status === 'current') {
    return 0.7;
  }

  if (entry.status === 'completed') {
    let weight = 1;
    if (entry.score !== null) {
      if (entry.score >= 9) {
        weight += 2;
      } else if (entry.score >= 8) {
        weight += 1;
      }
    }

    if (entry.isFavorite) {
      weight += 3;
    }

    return weight;
  }

  if (entry.status === 'dropped') {
    let weight = -1;
    if (entry.score !== null && entry.score <= 5) {
      weight -= 1;
    }
    return weight;
  }

  return 0;
}

function sumAxisWeight(map: Map<string, number>, keys: string[]): number {
  return keys.reduce((sum, key) => sum + (map.get(key) ?? 0), 0);
}

function isPremiumLandmark(entry: MediaHistoryEntry, canonicalGenres: string[]): boolean {
  if (entry.status !== 'completed') {
    return false;
  }

  const hasFantasy = canonicalGenres.includes('fantasy');
  const hasDramaOrAdventure = canonicalGenres.includes('drama') || canonicalGenres.includes('adventure');
  if (!hasFantasy || !hasDramaOrAdventure) {
    return false;
  }

  return entry.isFavorite || (entry.score ?? 0) >= 9;
}

function scoreSignalStrength(entry: MediaHistoryEntry): number {
  return (entry.score ?? 0) + (entry.isFavorite ? 3 : 0);
}

function hasSingleTenFavoriteMasterpiece(history: MediaHistoryEntry[]): boolean {
  const unique = new Set(
    history
      .filter(entry => entry.status === 'completed')
      .filter(entry => entry.isFavorite)
      .filter(entry => (entry.score ?? 0) >= 10)
      .map(entry => entry.media.title.trim().toLowerCase()),
  );

  return unique.size === 1;
}
