import type { MediaCandidate, MediaHistoryEntry } from '../types';
import type { AnimeTasteComputation } from './anime-types';
import { getCanonicalKey } from '../utils/genre';
import { findBacklogContinuation, type AnimeContinuationMatch } from './anime-continuations';

export function buildBacklogReason(
  entry: MediaHistoryEntry,
  subtype: 'continuation' | 'best_fit',
  taste: AnimeTasteComputation,
  history: MediaHistoryEntry[],
): string {
  if (subtype === 'continuation') {
    const continuation = findBacklogContinuation(entry, history);
    return buildContinuationReason(entry.media.title, entry.media.genres, continuation, taste);
  }

  return buildBestFitReason(entry.media.title, entry.media.genres, taste);
}

export function buildDiscoveryReason(
  candidate: MediaCandidate,
  taste: AnimeTasteComputation,
  continuation: AnimeContinuationMatch | null,
): string {
  if (continuation) {
    return buildContinuationReason(candidate.title, candidate.genres, continuation, taste);
  }

  return buildBestFitReason(candidate.title, candidate.genres, taste);
}

function buildContinuationReason(
  title: string,
  genres: string[],
  continuation: AnimeContinuationMatch | null,
  taste: AnimeTasteComputation,
): string {
  const axis = inferAxis(genres, taste);
  const previous = continuation?.previousTitle;

  if (axis === 'premium') {
    if (previous) {
      if (continuation?.previousStatus === 'current') {
        return `Direct continuation from a series you are actively watching (${previous}), and one of your strongest premium fantasy axis fits.`;
      }
      return `Direct continuation after completing ${previous}, and one of your strongest premium fantasy axis fits.`;
    }
    return 'Direct continuation aligned with your premium fantasy axis and emotional character-journey preference.';
  }

  if (axis === 'suspense') {
    if (previous) {
      if (continuation?.previousStatus === 'current') {
        return `Direct follow-up from a series you are actively watching (${previous}), while preserving your suspense / psychological axis.`;
      }
      return `Direct follow-up after ${previous}, while preserving your suspense / psychological axis.`;
    }
    return 'Direct continuation that keeps your suspense / psychological axis active.';
  }

  if (previous) {
    if (continuation?.previousStatus === 'current') {
      return `Direct continuation from a series you are actively watching (${previous}), matching your battle shounen axis and franchise momentum.`;
    }
    return `Direct continuation after ${previous}, matching your battle shounen axis and franchise momentum.`;
  }

  return 'Direct continuation that matches your battle shounen axis and progression-focused viewing pattern.';
}

function buildBestFitReason(title: string, genres: string[], taste: AnimeTasteComputation): string {
  const axis = inferAxis(genres, taste);

  if (isPremiumBridge(genres, taste)) {
    return 'Bridges your battle shounen axis with your premium fantasy axis for stronger emotional payoff.';
  }

  if (axis === 'premium') {
    return 'High-confidence premium fantasy axis fit with emotional character-journey upside.';
  }

  if (axis === 'suspense') {
    return 'Fits your secondary suspense / psychological axis without drifting from your core profile.';
  }

  if (/bleach/i.test(title)) {
    return 'Fits your battle shounen / supernatural axis with strong long-form franchise payoff.';
  }

  return 'Strong battle shounen axis fit with progression-friendly franchise momentum.';
}

function inferAxis(genres: string[], taste: AnimeTasteComputation): 'battle' | 'premium' | 'suspense' {
  const canonical = genres
    .map(raw => getCanonicalKey(raw))
    .filter((value): value is string => Boolean(value));

  const battle = canonical.filter(genre => taste.signals.battleAxisGenres.has(genre)).length;
  const premium = canonical.filter(genre => taste.signals.premiumAxisGenres.has(genre)).length;
  const suspense = canonical.filter(genre => taste.signals.suspenseAxisGenres.has(genre)).length;

  if (premium >= battle && premium >= suspense) {
    return 'premium';
  }

  if (suspense > battle) {
    return 'suspense';
  }

  return 'battle';
}

function isPremiumBridge(genres: string[], taste: AnimeTasteComputation): boolean {
  const canonical = genres
    .map(raw => getCanonicalKey(raw))
    .filter((value): value is string => Boolean(value));

  const battleCount = canonical.filter(genre => taste.signals.battleAxisGenres.has(genre)).length;
  const premiumCount = canonical.filter(genre => taste.signals.premiumAxisGenres.has(genre)).length;

  return battleCount >= 2 && premiumCount >= 2;
}
