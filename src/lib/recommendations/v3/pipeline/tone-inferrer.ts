/**
 * Tone Inferrer
 *
 * Infers a ToneProfile from the user's favorites and high-rated completions.
 *
 * Tone labels are defined by each adapter (ToneSignalDefinition[]).
 * The inferrer scores how strongly the user's best items match each tone label.
 *
 * High-confidence tone signals:
 *   - Favorited items (regardless of score)
 *   - Completed items with score >= 8
 *
 * Low-confidence tone signals:
 *   - Completed items with score >= 6
 */

import type {
  MediaHistoryEntry,
  ToneSignalDefinition,
  ToneProfile,
  ExtractedCluster,
} from '../types';
import { normalizeGenres } from '../utils/genre';

type ToneScore = {
  label: string;
  score: number;
};

function isToneEligible(entry: MediaHistoryEntry, minScore: number): boolean {
  if (entry.isFavorite) {return true;}
  if (entry.status !== 'completed') {return false;}
  return entry.score !== null && entry.score >= minScore;
}

function entryToneWeight(entry: MediaHistoryEntry): number {
  let w = 1.0;
  if (entry.isFavorite) {w *= 1.8;}
  if (entry.score !== null) {
    if (entry.score >= 9) {w *= 1.5;}
    else if (entry.score >= 7) {w *= 1.2;}
  }
  return w;
}

/**
 * Infer tone profile from user history and cluster evidence.
 */
export function inferToneProfile(
  history: MediaHistoryEntry[],
  clusters: ExtractedCluster[],
  toneDefinitions: ToneSignalDefinition[],
): ToneProfile {
  if (toneDefinitions.length === 0) {
    return { primaryTone: 'varied', toneLabels: [], confidence: 0 };
  }

  const toneScores = new Map<string, number>();

  for (const def of toneDefinitions) {
    let score = 0;
    const eligibleGenreSignals = normalizeGenres(def.genreSignals);

    for (const entry of history) {
      if (!isToneEligible(entry, def.minScore)) {continue;}

      const genres = normalizeGenres(entry.media.genres);
      const genreOverlap = genres.filter(g => eligibleGenreSignals.includes(g)).length;
      if (genreOverlap === 0) {continue;}

      const matchFrac = genreOverlap / eligibleGenreSignals.length;
      score += matchFrac * entryToneWeight(entry);
    }

    // Boost from cluster alignment
    for (const cluster of clusters) {
      if (def.clusterSignals.includes(cluster.prototype.name)) {
        score += cluster.weight * 3; // cluster match is a strong signal
      }
    }

    if (score > 0) {
      toneScores.set(def.toneLabel, score);
    }
  }

  if (toneScores.size === 0) {
    return buildSparseToneProfile(history);
  }

  const sorted: ToneScore[] = Array.from(toneScores.entries())
    .map(([label, score]) => ({ label, score }))
    .sort((a, b) => b.score - a.score);

  const top = sorted.slice(0, 4);

  // Confidence: how much history evidence we have
  const eligibleCount = history.filter(
    e => e.isFavorite || (e.status === 'completed' && e.score !== null && e.score >= 7),
  ).length;
  const confidence = Math.min(1, eligibleCount / 10);

  return {
    primaryTone: top[0].label,
    toneLabels: top.map(t => t.label),
    confidence,
  };
}

/**
 * Fallback tone profile for sparse libraries.
 */
function buildSparseToneProfile(history: MediaHistoryEntry[]): ToneProfile {
  const completed = history.filter(e => e.status === 'completed').length;
  if (completed === 0) {
    return { primaryTone: 'undetermined', toneLabels: [], confidence: 0 };
  }
  return {
    primaryTone: 'mixed',
    toneLabels: ['varied taste'],
    confidence: Math.min(0.3, completed / 10),
  };
}

/**
 * Match a candidate's genres against the tone profile labels.
 * Returns the best matching tone label, or null.
 */
export function matchCandidateTone(
  candidateGenres: string[],
  toneDefinitions: ToneSignalDefinition[],
  toneProfile: ToneProfile,
): string | null {
  const normalized = normalizeGenres(candidateGenres);

  let best: string | null = null;
  let bestScore = 0;

  for (const def of toneDefinitions) {
    if (!toneProfile.toneLabels.includes(def.toneLabel)) {continue;}
    if (!toneLabelFitsCandidate(def.toneLabel, normalized)) {continue;}

    const signals = normalizeGenres(def.genreSignals);
    const overlap = normalized.filter(g => signals.includes(g)).length;
    if (overlap === 0) {continue;}

    const score = overlap / signals.length;
    if (score < 0.34) {continue;}
    if (score > bestScore) {
      bestScore = score;
      best = def.toneLabel;
    }
  }

  return best;
}

function toneLabelFitsCandidate(toneLabel: string, normalizedGenres: string[]): boolean {
  const guards: Array<{ token: RegExp; requiredGenres: string[] }> = [
    { token: /horror/i, requiredGenres: ['horror'] },
    { token: /sitcom|comfort/i, requiredGenres: ['comedy'] },
    { token: /procedural/i, requiredGenres: ['crime', 'mystery'] },
    { token: /mystery/i, requiredGenres: ['mystery'] },
    { token: /prestige.*drama|drama/i, requiredGenres: ['drama'] },
  ];

  for (const guard of guards) {
    if (!guard.token.test(toneLabel)) {continue;}
    const hasRequired = guard.requiredGenres.some(g => normalizedGenres.includes(g));
    if (!hasRequired) {return false;}
  }

  return true;
}
