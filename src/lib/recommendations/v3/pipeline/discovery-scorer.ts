/**
 * Discovery Scorer
 *
 * Scores DB candidates for the "possible next" discovery slots.
 *
 * Score components (all in 0-100 space):
 *   - Cluster alignment (up to 35)
 *   - Tone match (up to 20)
 *   - Loved-genre overlap (up to 20)
 *   - Popularity signal (up to 10)
 *   - Avoided-genre penalty (up to -25)
 */

import type {
  MediaCandidate,
  ScoredItem,
  UserScoringContext,
  ToneSignalDefinition,
} from '../types';
import { normalizeGenres } from '../utils/genre';
import { scoreCandidateAgainstClusters } from './cluster-extractor';
import { matchCandidateTone } from './tone-inferrer';

const MIN_SCORE_THRESHOLD = 25;

export function scoreDiscoveryCandidates(
  candidates: MediaCandidate[],
  ctx: UserScoringContext,
  toneDefinitions: ToneSignalDefinition[],
): ScoredItem[] {
  const { clusters, toneProfile, loveGenreKeys, avoidedGenreKeys } = ctx;
  const coreGenreKeys = new Set(ctx.topGenres.slice(0, 3).map(g => g.genre));

  const scored: ScoredItem[] = [];

  for (const candidate of candidates) {
    const genres = normalizeGenres(candidate.genres);

    const { score: clusterAffinity, bestCluster } = scoreCandidateAgainstClusters(
      candidate.genres,
      clusters,
    );
    const clusterScore = clusterAffinity * 35;

    const toneMatch = matchCandidateTone(candidate.genres, toneDefinitions, toneProfile);
    const toneScore = toneMatch ? 20 : 0;

    const lovedCount = genres.filter(g => loveGenreKeys.has(g)).length;
    const lovedScore = genres.length > 0 ? Math.min(20, (lovedCount / genres.length) * 25) : 0;
    const coreCount = genres.filter(g => coreGenreKeys.has(g)).length;
    const coreScore = coreCount > 0 ? Math.min(18, coreCount * 6) : 0;

    const popularityScore = Math.min(10, (candidate.popularityScore / 100) * 10);

    const avoidedCount = genres.filter(g => avoidedGenreKeys.has(g)).length;
    const avoidedPenalty = avoidedCount > 0 ? Math.min(25, avoidedCount * 15) : 0;
    const puzzleNoisePenalty =
      genres.includes('puzzle') && genres.includes('indie') && coreCount === 0 ? 18 : 0;
    const multiplayerPenalty =
      genres.includes('moba') || genres.includes('real-time-strategy-rts') ? 22 : 0;

    const rawScore = Math.max(
      0,
      Math.min(
        100,
        clusterScore +
          toneScore +
          lovedScore +
          coreScore +
          popularityScore -
          avoidedPenalty -
          puzzleNoisePenalty -
          multiplayerPenalty,
      ),
    );

    if (rawScore < MIN_SCORE_THRESHOLD && clusterScore < 10 && lovedScore < 8 && coreScore < 8) {continue;}

    const confidence = Math.min(
      0.95,
      Math.max(0.3, clusterAffinity * 0.6 + (toneMatch ? 0.2 : 0) + popularityScore / 100),
    );

    const matchedSignals: string[] = [];
    if (bestCluster) {matchedSignals.push(bestCluster);}
    if (toneMatch) {matchedSignals.push(toneMatch);}
    if (lovedCount > 0) {matchedSignals.push(`${lovedCount} loved genre${lovedCount > 1 ? 's' : ''}`);}
    if (coreCount > 0) {matchedSignals.push(`${coreCount} core genre${coreCount > 1 ? 's' : ''}`);}

    scored.push({
      mediaDbId: candidate.id,
      title: candidate.title,
      cover: candidate.cover,
      slug: candidate.slug,
      genres: candidate.genres,
      themes: candidate.themes,
      platforms: candidate.platforms,
      source: 'discovery',
      rawScore,
      confidence,
      clusterMatch: bestCluster,
      toneMatch,
      franchiseKey: null,
      matchedSignals,
      reason: '',
    });
  }

  return scored.sort((a, b) => b.rawScore - a.rawScore);
}

/**
 * Select diverse discovery items with a strict first pass (max 1 per cluster),
 * then fill remaining slots from fallback ranking.
 */
export function selectDiverseDiscovery(
  scored: ScoredItem[],
  limit: number,
): ScoredItem[] {
  const clusterCounts = new Map<string, number>();
  const selected: ScoredItem[] = [];
  const fallback: ScoredItem[] = [];
  const MAX_PER_CLUSTER_PRIMARY_PASS = 1;

  for (const item of scored) {
    const cluster = item.clusterMatch ?? '__none__';
    const count = clusterCounts.get(cluster) ?? 0;

    if (count < MAX_PER_CLUSTER_PRIMARY_PASS) {
      selected.push(item);
      clusterCounts.set(cluster, count + 1);
      if (selected.length === limit) {break;}
    } else {
      fallback.push(item);
    }
  }

  if (selected.length < limit) {
    for (const item of fallback) {
      selected.push(item);
      if (selected.length === limit) {break;}
    }
  }

  return selected;
}
