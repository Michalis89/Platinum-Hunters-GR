/**
 * Backlog Scorer
 *
 * Ranks the user's planned items by how much they want to play/watch them
 * right now. Combines:
 *   - Genre affinity (weighted by loved genres)
 *   - Cluster alignment
 *   - Tone match
 *   - Priority pin
 *   - Favorite-franchise similarity
 *   - Platform preference (games)
 *   - Continuation bonus (if backlog item is next in a franchise)
 */

import type {
  MediaHistoryEntry,
  ToneSignalDefinition,
  UserScoringContext,
  ScoredItem,
} from '../types';
import { normalizeGenres } from '../utils/genre';
import { scoreCandidateAgainstClusters } from './cluster-extractor';
import { matchCandidateTone } from './tone-inferrer';
import { extractBaseTitle, extractFranchiseKey, extractSequenceNumber } from '../utils/franchise';

const PRIORITY_TIER_BOOST: Record<string, number> = {
  CRITICAL: 25,
  HIGH: 15,
  MEDIUM: 5,
  LOW: 0,
};

function priorityTier(priority: number | null): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
  if (priority === null) {return 'LOW';}
  if (priority >= 80) {return 'CRITICAL';}
  if (priority >= 50) {return 'HIGH';}
  if (priority >= 20) {return 'MEDIUM';}
  return 'LOW';
}

/**
 * Score all planned items and return sorted list.
 * Platform filter is applied externally by the adapter if needed.
 */
export function scoreBacklogItems(
  planned: MediaHistoryEntry[],
  ctx: UserScoringContext,
  toneDefinitions: ToneSignalDefinition[],
): ScoredItem[] {
  const { clusters, toneProfile, loveGenreKeys, avoidedGenreKeys } = ctx;
  const coreGenreKeys = new Set(ctx.topGenres.slice(0, 3).map(g => g.genre));

  const scored = planned.map(entry => {
    const genres = normalizeGenres(entry.media.genres);

    const lovedOverlap = genres.filter(g => loveGenreKeys.has(g)).length;
    const coreOverlap = genres.filter(g => coreGenreKeys.has(g)).length;
    const genreScore = genres.length > 0 ? (lovedOverlap / genres.length) * 45 : 15;
    const coreGenreBoost = coreOverlap > 0 ? Math.min(22, coreOverlap * 9) : 0;

    const { score: clusterScore, bestCluster } = scoreCandidateAgainstClusters(
      entry.media.genres,
      clusters,
    );

    const toneMatch = matchCandidateTone(entry.media.genres, toneDefinitions, toneProfile);
    const toneBoost = toneMatch ? 8 : 0;

    const tier = priorityTier(entry.priority);
    const priorityBoost = PRIORITY_TIER_BOOST[tier];

    const hasAvoided = genres.some(g => avoidedGenreKeys.has(g));
    const avoidedPenalty = hasAvoided ? 15 : 0;

    const continuation = detectBacklogContinuation(entry, ctx.history);
    const continuationBonus = continuation ? 22 : 0;
    const franchiseBoost = continuation
      ? favoriteFranchiseSimilarityBoost(entry, ctx.history)
      : franchiseAffinityBoost(entry, ctx.history);

    const narrativeSinglePlayerBoost = isNarrativeSinglePlayerFit(genres) ? 10 : 0;
    const platformBoost = platformPreferenceBoost(entry);
    const noisePenalty = isPuzzleHeavyNoise(genres) ? 12 : 0;

    const rawScore = Math.max(
      0,
      Math.min(
        100,
        genreScore +
          coreGenreBoost +
          clusterScore * 18 +
          toneBoost +
          priorityBoost +
          continuationBonus +
          franchiseBoost +
          narrativeSinglePlayerBoost +
          platformBoost -
          avoidedPenalty -
          noisePenalty,
      ),
    );

    const matchedSignals: string[] = [];
    if (bestCluster) {matchedSignals.push(bestCluster);}
    if (toneMatch) {matchedSignals.push(toneMatch);}
    if (continuation) {matchedSignals.push('next in series');}
    if (franchiseBoost >= 8) {matchedSignals.push('favorite-franchise match');}
    if (narrativeSinglePlayerBoost > 0) {matchedSignals.push('single-player narrative fit');}
    if (tier !== 'LOW') {matchedSignals.push(`${tier.toLowerCase()} priority`);}

    return {
      mediaDbId: entry.mediaId,
      title: entry.media.title,
      cover: entry.media.coverImageLarge || entry.media.coverImageMedium || '',
      slug: titleToSlug(entry.media.title),
      genres: entry.media.genres,
      themes: entry.media.themes ?? [],
      platforms: entry.media.platforms ?? [],
      source: 'backlog' as const,
      rawScore,
      confidence: 1.0,
      clusterMatch: bestCluster,
      toneMatch,
      franchiseKey: continuation?.franchiseKey ?? null,
      matchedSignals,
      reason: '',
    } satisfies ScoredItem;
  });

  const tierOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  return scored.sort((a, b) => {
    const pa = planned.find(e => e.mediaId === a.mediaDbId);
    const pb = planned.find(e => e.mediaId === b.mediaDbId);
    const ta = priorityTier(pa?.priority ?? null);
    const tb = priorityTier(pb?.priority ?? null);
    const tierDiff = tierOrder[ta] - tierOrder[tb];
    if (tierDiff !== 0) {return tierDiff;}
    return b.rawScore - a.rawScore;
  });
}

function detectBacklogContinuation(
  entry: MediaHistoryEntry,
  history: MediaHistoryEntry[],
): { franchiseKey: string } | null {
  const franchiseKey = extractFranchiseKey(entry.media.title);
  const seqNum = extractSequenceNumber(entry.media.title);

  if (seqNum !== null && seqNum > 1) {
    const prevCompleted = history.some(
      h =>
        h.status === 'completed' &&
        extractFranchiseKey(h.media.title) === franchiseKey &&
        (extractSequenceNumber(h.media.title) ?? 1) === seqNum - 1,
    );
    if (prevCompleted) {return { franchiseKey };}
  }

  const candidateBase = extractBaseTitle(entry.media.title);
  const explicitContinuationMarkers = [
    /\bragnar[o�]k\b/i,
    /\bforbidden west\b/i,
    /\bphantom liberty\b/i,
    /\brebirth\b/i,
    /\bdirector'?s cut\b/i,
    /\bscholar of the first sin\b/i,
  ];

  if (!explicitContinuationMarkers.some(pattern => pattern.test(candidateBase))) {
    return null;
  }

  const hasSeriesHistory = history.some(h => {
    if (h.status === 'planned') {
      return false;
    }
    const historyFranchise = extractFranchiseKey(h.media.title);
    if (historyFranchise === franchiseKey) {
      return true;
    }
    const historyBase = extractBaseTitle(h.media.title);
    return (
      candidateBase.startsWith(historyBase) ||
      historyBase.startsWith(candidateBase) ||
      candidateBase.includes(historyBase)
    );
  });

  return hasSeriesHistory ? { franchiseKey } : null;
}

function favoriteFranchiseSimilarityBoost(entry: MediaHistoryEntry, history: MediaHistoryEntry[]): number {
  const key = extractFranchiseKey(entry.media.title);
  const score = history.reduce((acc, h) => {
    if (extractFranchiseKey(h.media.title) !== key) {return acc;}
    if (h.isFavorite) {return acc + 9;}
    if (h.status === 'completed' && (h.score ?? 0) >= 8) {return acc + 5;}
    if (h.status === 'current') {return acc + 3;}
    return acc;
  }, 0);

  return Math.min(16, score);
}

function franchiseAffinityBoost(entry: MediaHistoryEntry, history: MediaHistoryEntry[]): number {
  const key = extractFranchiseKey(entry.media.title);
  const completedCount = history.filter(
    h => h.status === 'completed' && extractFranchiseKey(h.media.title) === key,
  ).length;
  return completedCount >= 2 ? 6 : 0;
}

function isNarrativeSinglePlayerFit(genres: string[]): boolean {
  const hasCore =
    genres.includes('role-playing-rpg') ||
    genres.includes('adventure') ||
    genres.includes('hack-and-slash');
  const hasMultiplayerSignals =
    genres.includes('moba') || genres.includes('real-time-strategy-rts');
  return hasCore && !hasMultiplayerSignals;
}

function isPuzzleHeavyNoise(genres: string[]): boolean {
  const hasPuzzle = genres.includes('puzzle');
  const hasCoreNarrative =
    genres.includes('role-playing-rpg') ||
    genres.includes('hack-and-slash') ||
    genres.includes('shooter');
  const indieOnly = genres.includes('indie') && !hasCoreNarrative;
  return hasPuzzle && indieOnly;
}

function platformPreferenceBoost(entry: MediaHistoryEntry): number {
  const platforms = [entry.selectedPlatform ?? '', ...(entry.media.platforms ?? [])]
    .join(' ')
    .toLowerCase();
  if (platforms.includes('playstation 5') || platforms.includes('ps5')) {return 6;}
  if (platforms.includes('playstation 4') || platforms.includes('ps4')) {return 3;}
  if (platforms.includes('pc')) {return 1;}
  return 0;
}

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}
