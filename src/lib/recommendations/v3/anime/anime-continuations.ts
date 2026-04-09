import type { MediaCandidate, MediaHistoryEntry } from '../types';
import {
  getAnimeFranchiseKey,
  getAnimeInstallmentNumber,
  isLowValueDerivative,
} from './anime-normalizers';

export type AnimeContinuationMatch = {
  franchiseKey: string;
  confidence: number;
  immediateNext: boolean;
  previousTitle?: string;
  previousStatus?: 'completed' | 'current';
  matchedSignals: string[];
};

export function findBacklogContinuation(
  entry: MediaHistoryEntry,
  history: MediaHistoryEntry[],
): AnimeContinuationMatch | null {
  return detectContinuation(entry.media.title, history);
}

export function findExternalContinuation(
  candidate: MediaCandidate,
  history: MediaHistoryEntry[],
): AnimeContinuationMatch | null {
  return detectContinuation(candidate.title, history);
}

function detectContinuation(
  title: string,
  history: MediaHistoryEntry[],
): AnimeContinuationMatch | null {
  const franchiseKey = getAnimeFranchiseKey(title);
  const engaged = history.filter(item => {
    if (item.status !== 'completed' && item.status !== 'current') {
      return false;
    }
    return getAnimeFranchiseKey(item.media.title) === franchiseKey;
  });

  if (engaged.length === 0) {
    return null;
  }

  const targetSeq = getAnimeInstallmentNumber(title);
  const rankedHistory = engaged
    .map(item => ({
      item,
      seq: getAnimeInstallmentNumber(item.media.title) ?? 1,
    }))
    .sort((a, b) => b.seq - a.seq);

  const maxSeen = rankedHistory[0]?.seq ?? 1;
  const previousTitle = rankedHistory[0]?.item.media.title;
  const previousStatus = rankedHistory[0]?.item.status as 'completed' | 'current' | undefined;

  if (targetSeq !== null && targetSeq > 1) {
    if (targetSeq === maxSeen + 1) {
      return {
        franchiseKey,
        confidence: 0.96,
        immediateNext: true,
        previousTitle,
        previousStatus,
        matchedSignals: ['direct season continuation', 'franchise momentum'],
      };
    }

    if (targetSeq > maxSeen + 1) {
      return {
        franchiseKey,
        confidence: 0.68,
        immediateNext: false,
        previousTitle,
        previousStatus,
        matchedSignals: ['franchise continuation', 'skip-ahead risk'],
      };
    }

    return null;
  }

  if (isLowValueDerivative(title)) {
    return {
      franchiseKey,
      confidence: 0.65,
      immediateNext: false,
      previousTitle,
      previousStatus,
      matchedSignals: ['franchise tie', 'derivative continuation'],
    };
  }

  return null;
}
