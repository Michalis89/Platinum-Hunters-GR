/**
 * Continuation Detector
 *
 * Identifies candidates that are strict next-in-line continuations.
 * Loose same-franchise matching is intentionally rejected.
 */

import type { MediaCandidate, ContinuationPattern, MediaHistoryEntry } from '../types';
import {
  extractFranchiseKey,
  extractSequenceNumber,
  buildFranchiseMembership,
  type FranchiseMembership,
} from '../utils/franchise';

export type ContinuationCandidate = {
  candidate: MediaCandidate;
  franchiseKey: string;
  confidence: number;
  tier: 'high' | 'medium';
  reason: string;
};

/**
 * Detect continuation candidates from a list of DB candidates.
 */
export function detectContinuationCandidates(
  candidates: MediaCandidate[],
  history: MediaHistoryEntry[],
  extraPatterns: ContinuationPattern[] = [],
): ContinuationCandidate[] {
  const membership = buildFranchiseMembership(
    history.map(e => ({ title: e.media.title, status: e.status })),
  );

  const results: ContinuationCandidate[] = [];

  for (const candidate of candidates) {
    const detection = detectContinuation(candidate, membership, extraPatterns);
    if (detection) {
      results.push(detection);
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}

function detectContinuation(
  candidate: MediaCandidate,
  membership: Map<string, FranchiseMembership>,
  extraPatterns: ContinuationPattern[],
): ContinuationCandidate | null {
  const franchiseKey = extractFranchiseKey(candidate.title);
  const seqNum = extractSequenceNumber(candidate.title);

  const mem = membership.get(franchiseKey);
  if (mem && seqNum !== null && seqNum > 1) {
    const prevNum = seqNum - 1;

    if (mem.maxCompletedNumber === prevNum) {
      return {
        candidate,
        franchiseKey,
        confidence: 0.92,
        tier: 'high',
        reason: `Direct next installment after what you've completed`,
      };
    }

    if (prevNum === 1 && mem.hasCurrent && mem.maxCompletedNumber < 1) {
      return {
        candidate,
        franchiseKey,
        confidence: 0.75,
        tier: 'medium',
        reason: `Direct follow-up to what you're currently in`,
      };
    }
  }

  return checkExtraPatterns(candidate, franchiseKey, extraPatterns, membership);
}

function checkExtraPatterns(
  candidate: MediaCandidate,
  franchiseKey: string,
  patterns: ContinuationPattern[],
  membership: Map<string, FranchiseMembership>,
): ContinuationCandidate | null {
  const mem = membership.get(franchiseKey);
  if (!mem || (mem.maxCompletedNumber < 1 && !mem.hasCurrent)) {
    return null;
  }

  for (const { pattern, weight } of patterns) {
    if (!pattern.test(candidate.title)) {continue;}

    // Extra patterns are treated as medium-confidence continuation only.
    return {
      candidate,
      franchiseKey,
      confidence: Math.min(0.78, Math.max(0.65, weight)),
      tier: 'medium',
      reason: `Likely immediate continuation of a series you're actively tracking`,
    };
  }

  return null;
}
