import { extractBaseTitle } from '../utils/franchise';
import {
  extractMainlineSequence,
  normalizeFranchiseFamilyKey,
  normalizeGameIdentityKey,
} from './games-normalizers';
import type { GameCandidate, GameHistoryEntry } from './games-types';

export type ContinuationMatch = {
  franchiseKey: string;
  confidence: number;
  matchedSignals: string[];
};

const CONTINUATION_MARKERS: RegExp[] = [
  /\bragnarok\b|\bragnark\b/i,
  /\bforbidden west\b/i,
  /\bphantom liberty\b/i,
  /\brebirth\b/i,
  /\bdirector'?s cut\b/i,
  /\bscholar of the first sin\b/i,
  /\bexpansion\b/i,
  /\bdlc\b/i,
];

const KNOWN_FOLLOWUPS: Array<{
  from: RegExp[];
  to: RegExp[];
  family: string;
  familyAnchors: RegExp[];
}> = [
  {
    family: 'god-of-war',
    from: [/\bgod of war\b/i],
    to: [/\bragnarok\b|\bragnark\b/i],
    familyAnchors: [/\bgod of war\b/i],
  },
  {
    family: 'horizon',
    from: [/\bhorizon\b.*\bzero dawn\b/i],
    to: [/\bhorizon\b.*\bforbidden west\b/i],
    familyAnchors: [/\bhorizon\b/i],
  },
  {
    family: 'dark-souls',
    from: [/\bdark souls\b.*\bremastered\b/i, /\bdark souls\b(?!.*\b2\b|\bii\b|\b3\b|\biii\b)/i],
    to: [/\bdark souls\b.*\b2\b/i, /\bdark souls\b.*\bii\b/i],
    familyAnchors: [/\bdark souls\b/i],
  },
  {
    family: 'final-fantasy-7',
    from: [/\bfinal fantasy vii\b/i, /\bfinal fantasy 7\b/i],
    to: [/\brebirth\b/i],
    familyAnchors: [/\bfinal fantasy\b/i, /\bff7\b/i],
  },
];

function findKnownFollowupMatch(
  candidateTitle: string,
  history: GameHistoryEntry[],
): { family: string; matchedSignals: string[] } | null {
  const candidateFamily = normalizeFranchiseFamilyKey(candidateTitle);

  for (const rule of KNOWN_FOLLOWUPS) {
    const hasPredecessor = history.some(entry => {
      if (entry.status !== 'completed' && entry.status !== 'current') {
        return false;
      }
      return rule.from.some(pattern => pattern.test(entry.media.title));
    });
    if (!hasPredecessor) {
      continue;
    }

    if (!rule.to.some(pattern => pattern.test(candidateTitle))) {
      continue;
    }

    const familyAligned =
      candidateFamily === rule.family ||
      rule.familyAnchors.some(pattern => pattern.test(candidateTitle));
    if (!familyAligned) {
      continue;
    }

    return {
      family: rule.family,
      matchedSignals: ['known direct follow-up', 'predecessor found in history'],
    };
  }

  return null;
}

export function findBacklogContinuation(
  backlogEntry: GameHistoryEntry,
  history: GameHistoryEntry[],
): ContinuationMatch | null {
  const franchiseKey = normalizeFranchiseFamilyKey(backlogEntry.media.title);
  const sequence = extractMainlineSequence(backlogEntry.media.title);
  const completed = history.filter(h => h.status === 'completed');
  const completedOrCurrent = history.filter(h => h.status === 'completed' || h.status === 'current');

  const known = findKnownFollowupMatch(backlogEntry.media.title, history);
  if (known) {
    return {
      franchiseKey: known.family,
      confidence: 0.97,
      matchedSignals: known.matchedSignals,
    };
  }

  if (sequence !== null && sequence > 1) {
    const maxCompletedSequence = completed
      .filter(item => normalizeFranchiseFamilyKey(item.media.title) === franchiseKey)
      .reduce((max, item) => Math.max(max, extractMainlineSequence(item.media.title) ?? 1), 0);
    const previousCompleted = maxCompletedSequence > 0 && maxCompletedSequence < sequence;

    if (previousCompleted) {
      return {
        franchiseKey,
        confidence: 0.94,
        matchedSignals: ['direct sequel continuation', 'completed prior entry'],
      };
    }
  }

  const normalizedTitle = extractBaseTitle(backlogEntry.media.title);
  const candidateIdentity = normalizeGameIdentityKey(normalizedTitle);
  const hasMarker = CONTINUATION_MARKERS.some(marker => marker.test(normalizedTitle));
  if (!hasMarker) {
    return null;
  }

  const hasFranchiseHistory = completedOrCurrent.some(item => {
    const sameFamily = normalizeFranchiseFamilyKey(item.media.title) === franchiseKey;
    if (sameFamily) {
      return true;
    }

    const itemBase = extractBaseTitle(item.media.title);
    const itemIdentity = normalizeGameIdentityKey(itemBase);
    return (
      normalizedTitle.includes(itemBase) ||
      itemBase.includes(normalizedTitle) ||
      candidateIdentity.includes(itemIdentity) ||
      itemIdentity.includes(candidateIdentity)
    );
  });

  if (!hasFranchiseHistory) {
    return null;
  }

  return {
    franchiseKey,
    confidence: 0.82,
    matchedSignals: ['franchise continuation marker', 'series history found'],
  };
}

export function findExternalContinuation(
  candidate: GameCandidate,
  history: GameHistoryEntry[],
  backlog: GameHistoryEntry[],
): ContinuationMatch | null {
  const candidateFranchise = normalizeFranchiseFamilyKey(candidate.title);
  const backlogFranchises = new Set(backlog.map(item => normalizeFranchiseFamilyKey(item.media.title)));
  if (backlogFranchises.has(candidateFranchise)) {
    return null;
  }

  const completedOrCurrent = history.filter(h => h.status === 'completed' || h.status === 'current');
  if (completedOrCurrent.length === 0) {
    return null;
  }

  const known = findKnownFollowupMatch(candidate.title, history);
  if (known) {
    return {
      franchiseKey: known.family,
      confidence: 0.94,
      matchedSignals: ['external known follow-up'],
    };
  }

  const sequence = extractMainlineSequence(candidate.title);
  if (sequence !== null && sequence > 1) {
    const maxCompletedSequence = history
      .filter(
        item =>
          item.status === 'completed' &&
          normalizeFranchiseFamilyKey(item.media.title) === candidateFranchise,
      )
      .reduce((max, item) => Math.max(max, extractMainlineSequence(item.media.title) ?? 1), 0);
    const previousCompleted = maxCompletedSequence > 0 && maxCompletedSequence < sequence;

    if (previousCompleted) {
      return {
        franchiseKey: candidateFranchise,
        confidence: 0.9,
        matchedSignals: ['external direct sequel', 'completed prior installment'],
      };
    }
  }

  const normalized = extractBaseTitle(candidate.title);
  const candidateIdentity = normalizeGameIdentityKey(normalized);
  const hasMarker = CONTINUATION_MARKERS.some(marker => marker.test(normalized));
  if (!hasMarker) {
    return null;
  }

  const matchingHistory = completedOrCurrent.some(item => {
    const historyFranchise = normalizeFranchiseFamilyKey(item.media.title);
    if (historyFranchise === candidateFranchise) {
      return true;
    }

    const historyBase = extractBaseTitle(item.media.title);
    const historyIdentity = normalizeGameIdentityKey(historyBase);
    return (
      normalized.includes(historyBase) ||
      historyBase.includes(normalized) ||
      candidateIdentity.includes(historyIdentity) ||
      historyIdentity.includes(candidateIdentity)
    );
  });

  if (!matchingHistory) {
    return null;
  }

  return {
    franchiseKey: candidateFranchise,
    confidence: 0.78,
    matchedSignals: ['external franchise continuation marker'],
  };
}
