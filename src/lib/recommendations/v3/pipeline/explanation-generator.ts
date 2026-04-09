/**
 * Explanation Generator
 *
 * Produces human-readable `reason` strings for each ScoredItem.
 *
 * Principle: explanations must be source-aware and signal-specific.
 * Evidence titles are only used when their genre profile actually overlaps
 * the candidate, to avoid invalid tone/title mappings.
 */

import type { ScoredItem, ExtractedCluster, UserScoringContext } from '../types';
import { extractFranchiseKey } from '../utils/franchise';
import { getCanonicalKey, normalizeGenres } from '../utils/genre';

/** Generate explanations for all items in-place. Returns mutated array. */
export function generateExplanations(
  items: ScoredItem[],
  ctx: UserScoringContext,
  clusters: ExtractedCluster[],
): ScoredItem[] {
  return items.map(item => ({
    ...item,
    reason: buildReason(item, ctx, clusters),
  }));
}

function buildReason(
  item: ScoredItem,
  ctx: UserScoringContext,
  clusters: ExtractedCluster[],
): string {
  const candidateGenres = normalizeGenres(item.genres);

  // 1. Continuation
  if (item.franchiseKey !== null) {
    const previous = ctx.history
      .filter(
        h =>
          (h.status === 'completed' || h.status === 'current') &&
          extractFranchiseKey(h.media.title) === item.franchiseKey,
      )
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

    if (previous.length > 0) {
      const prevTitle = previous[0].media.title;
      if (previous[0].status === 'current') {
        return `Direct continuation from ${prevTitle}, which you are currently playing`;
      }
      return `Continues your franchise momentum after completing ${prevTitle}`;
    }
    return `Next entry in a franchise you have already invested in`;
  }

  // 2. Cluster match
  if (item.clusterMatch !== null) {
    const cluster = clusters.find(c => c.prototype.name === item.clusterMatch);
    if (cluster && cluster.weight > 0.25) {
      const evidence = pickValidatedEvidenceTitles(candidateGenres, cluster.evidenceTitles, ctx);
      if (evidence.length >= 2) {
        return `Matches your high-confidence ${item.clusterMatch} signal from ${evidence.join(' and ')}`;
      }
      if (evidence.length === 1) {
        return `Aligned with ${item.clusterMatch} patterns you rated highly in ${evidence[0]}`;
      }
      return `Strong ${item.clusterMatch} match based on your history`;
    }
  }

  // 3. Tone match
  if (item.toneMatch !== null && toneLabelFitsCandidate(item.toneMatch, candidateGenres)) {
    const topFavoritesWithTone = ctx.history
      .filter(
        h =>
          h.isFavorite ||
          (h.status === 'completed' && h.score !== null && h.score >= 8),
      )
      .slice(0, 2)
      .map(h => h.media.title);

    if (topFavoritesWithTone.length >= 2) {
      return `Fits the ${item.toneMatch} tone you gravitate toward`;
    }
    return `Matches the ${item.toneMatch} tone in your favorites`;
  }

  // 4. Loved-genre overlap
  const lovedGenres = item.genres.filter(g => {
    const normalized = getCanonicalKey(g);
    return normalized ? ctx.loveGenreKeys.has(normalized) : false;
  });

  if (lovedGenres.length >= 2) {
    return `Combines ${lovedGenres.slice(0, 2).join(' and ')} - two of your strongest genres`;
  }
  if (lovedGenres.length === 1) {
    return `Strong ${lovedGenres[0]} match from your taste history`;
  }

  // 5. Source-aware fallback
  if (item.source === 'backlog') {
    return `Ready to start - a solid fit for your current taste`;
  }
  if (item.source === 'discovery') {
    if (item.genres.length > 0) {
      return `Discovery pick - ${item.genres.slice(0, 2).join(' & ')} aligns with your history`;
    }
    return `Discovery pick based on your play patterns`;
  }

  return `Recommended based on your overall taste profile`;
}

/**
 * Generate a one-line taste profile summary from clusters and tone.
 */
export function generateTasteSummary(
  clusters: ExtractedCluster[],
  toneLabel: string,
  category: string,
): string {
  if (clusters.length === 0) {
    return `Your ${category} taste is still forming - explore more to refine recommendations`;
  }

  const topCluster = clusters[0];
  const secondCluster = clusters[1];

  if (secondCluster && secondCluster.weight > 0.3) {
    return `${topCluster.prototype.name} and ${secondCluster.prototype.name} - ${toneLabel}`;
  }

  return `${topCluster.prototype.name} - ${toneLabel}`;
}

function pickValidatedEvidenceTitles(
  candidateGenres: string[],
  clusterEvidenceTitles: string[],
  ctx: UserScoringContext,
): string[] {
  const minOverlap = candidateGenres.length >= 3 ? 2 : 1;
  const evidenceSet = new Set(clusterEvidenceTitles);

  return ctx.history
    .filter(h => h.status === 'completed' || h.status === 'current')
    .filter(h => evidenceSet.size === 0 || evidenceSet.has(h.media.title))
    .filter(h => {
      const signals = normalizeGenres(h.media.genres);
      const overlap = signals.filter(g => candidateGenres.includes(g)).length;
      return overlap >= minOverlap;
    })
    .sort((a, b) => scoreEvidence(b) - scoreEvidence(a))
    .slice(0, 3)
    .map(h => h.media.title);
}

function scoreEvidence(entry: UserScoringContext['history'][number]): number {
  let score = 0;
  if (entry.isFavorite) {score += 2;}
  if (entry.score !== null) {score += entry.score / 10;}
  if (entry.status === 'completed') {score += 1;}
  return score;
}

function toneLabelFitsCandidate(toneLabel: string, candidateGenres: string[]): boolean {
  const guards: Array<{ token: RegExp; requiredGenres: string[] }> = [
    { token: /horror/i, requiredGenres: ['horror'] },
    { token: /sitcom|comfort/i, requiredGenres: ['comedy'] },
    { token: /procedural/i, requiredGenres: ['crime', 'mystery'] },
    { token: /mystery/i, requiredGenres: ['mystery'] },
    { token: /prestige.*drama|drama/i, requiredGenres: ['drama'] },
  ];

  for (const guard of guards) {
    if (!guard.token.test(toneLabel)) {continue;}
    const hasRequired = guard.requiredGenres.some(g => candidateGenres.includes(g));
    if (!hasRequired) {return false;}
  }

  return true;
}
