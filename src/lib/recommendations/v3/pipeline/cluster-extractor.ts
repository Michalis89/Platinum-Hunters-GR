/**
 * Taste Cluster Extractor
 *
 * Given the user's media history and a set of cluster prototypes (provided
 * by the category adapter), produces weighted ExtractedCluster objects that
 * describe the user's taste at a cluster level rather than raw genre level.
 *
 * Scoring algorithm per item per prototype:
 *   1. Compute requiredOverlap = intersection(item.genres, prototype.requiredGenres)
 *   2. If requiredOverlap < prototype.minRequiredMatch → skip item
 *   3. baseScore = requiredOverlap / requiredGenres.length
 *   4. boostScore += 0.15 per boost genre present (capped at 0.3)
 *   5. penaltyScore -= 0.2 per penalty genre present (capped at -0.4)
 *   6. itemContrib = clamp(baseScore + boostScore + penaltyScore, 0, 1)
 *   7. Weight by status+score+favorite multiplier
 *
 * Cluster weight = Σ(weightedItemContribs) / maxPossibleWeight
 * Clamped to [0, 1].
 */

import type { MediaHistoryEntry, ClusterPrototype, ExtractedCluster } from '../types';
import { normalizeGenres } from '../utils/genre';

const STATUS_WEIGHT: Record<string, number> = {
  completed: 1.5,
  current: 1.0,
  planned: 0.1,
  dropped: -0.3,
};

function itemWeight(entry: MediaHistoryEntry): number {
  let w = STATUS_WEIGHT[entry.status] ?? 0;
  if (w <= 0) {return w;} // preserve negative for dropped

  // Rating boost
  if (entry.score !== null) {
    if (entry.score >= 9) {w *= 1.5;}
    else if (entry.score >= 7) {w *= 1.2;}
    else if (entry.score <= 4) {w *= 0.6;}
  }

  // Favorite bonus
  if (entry.isFavorite) {w *= 1.4;}

  return w;
}

/**
 * Score a single history entry against a prototype.
 * Returns a contribution value in [0, 1], or negative if dropped+penalty.
 */
function scoreItemAgainstPrototype(
  genres: string[],
  prototype: ClusterPrototype,
  weight: number,
): number {
  const required = normalizeGenres(prototype.requiredGenres);
  const boost = normalizeGenres(prototype.boostGenres);
  const penalty = normalizeGenres(prototype.penaltyGenres ?? []);

  const overlap = genres.filter(g => required.includes(g)).length;
  if (overlap < prototype.minRequiredMatch) {return 0;}

  const baseScore = required.length > 0 ? overlap / required.length : 0;

  const boostCount = genres.filter(g => boost.includes(g)).length;
  const boostScore = Math.min(0.3, boostCount * 0.15);

  const penaltyCount = genres.filter(g => penalty.includes(g)).length;
  const penaltyScore = Math.min(0.4, penaltyCount * 0.2);

  const itemContrib = Math.max(0, Math.min(1, baseScore + boostScore - penaltyScore));
  return itemContrib * weight;
}

/**
 * Extract taste clusters from user history against a set of prototypes.
 *
 * Returns clusters sorted descending by weight, only those with weight > 0.05.
 */
export function extractClusters(
  history: MediaHistoryEntry[],
  prototypes: ClusterPrototype[],
): ExtractedCluster[] {
  const results: ExtractedCluster[] = [];

  for (const prototype of prototypes) {
    // Skip if library too small for this cluster
    const minSize = prototype.minLibrarySize ?? 1;
    const eligibleHistory = history.filter(
      e => e.status === 'completed' || e.status === 'current',
    );
    if (eligibleHistory.length < minSize) {continue;}

    let totalContrib = 0;
    let maxPossible = 0;
    const evidenceItems: Array<{ title: string; contrib: number }> = [];

    for (const entry of eligibleHistory) {
      const genres = normalizeGenres(entry.media.genres);
      const w = itemWeight(entry);
      if (w === 0) {continue;}

      const maxW = w; // theoretical max contribution for this item
      maxPossible += maxW;

      const contrib = scoreItemAgainstPrototype(genres, prototype, w);
      totalContrib += contrib;

      if (contrib > 0.3 * w) {
        evidenceItems.push({ title: entry.media.title, contrib });
      }
    }

    // Handle dropped items as negative evidence
    for (const entry of history.filter(e => e.status === 'dropped')) {
      const genres = normalizeGenres(entry.media.genres);
      const w = Math.abs(itemWeight(entry)); // already negative, use abs for scoring
      const contrib = scoreItemAgainstPrototype(genres, prototype, w);
      totalContrib -= contrib * 0.5; // apply half the penalty
    }

    const weight = maxPossible > 0 ? Math.max(0, totalContrib / maxPossible) : 0;

    if (weight > 0.05) {
      evidenceItems.sort((a, b) => b.contrib - a.contrib);
      results.push({
        prototype,
        weight: Math.min(1, weight),
        evidenceTitles: evidenceItems.slice(0, 3).map(e => e.title),
      });
    }
  }

  return results.sort((a, b) => b.weight - a.weight);
}

/**
 * Score a candidate's genres against the user's extracted clusters.
 * Returns 0–1 cluster affinity score.
 */
export function scoreCandidateAgainstClusters(
  candidateGenres: string[],
  clusters: ExtractedCluster[],
): { score: number; bestCluster: string | null } {
  const normalized = normalizeGenres(candidateGenres);
  let best = 0;
  let bestCluster: string | null = null;

  for (const cluster of clusters) {
    const required = normalizeGenres(cluster.prototype.requiredGenres);
    const overlap = normalized.filter(g => required.includes(g)).length;
    if (overlap < cluster.prototype.minRequiredMatch) {continue;}

    const matchScore = (overlap / required.length) * cluster.weight;
    if (matchScore > best) {
      best = matchScore;
      bestCluster = cluster.prototype.name;
    }
  }

  return { score: Math.min(1, best), bestCluster };
}
