import { extractFranchiseKey } from '../utils/franchise';
import type { GameCandidate, GameHistoryEntry, GameRecommendationSubtype, TasteComputation } from './games-types';

function topEvidenceTitles(history: GameHistoryEntry[]): string[] {
  return history
    .filter(item => item.status === 'completed' && (item.isFavorite || (item.score ?? 0) >= 8))
    .sort((a, b) => {
      const aScore = (a.isFavorite ? 3 : 0) + (a.score ?? 0);
      const bScore = (b.isFavorite ? 3 : 0) + (b.score ?? 0);
      return bScore - aScore;
    })
    .slice(0, 3)
    .map(item => item.media.title);
}

export function buildBacklogReason(
  entry: GameHistoryEntry,
  subtype: Extract<GameRecommendationSubtype, 'continuation' | 'best_fit'>,
  taste: TasteComputation,
  history: GameHistoryEntry[],
): string {
  if (subtype === 'continuation') {
    const key = extractFranchiseKey(entry.media.title);
    const previous = history
      .filter(item => item.status === 'completed' || item.status === 'current')
      .find(item => extractFranchiseKey(item.media.title) === key);

    if (previous) {
      if (previous.status === 'current') {
        return `Continues your active franchise run after ${previous.media.title}.`;
      }
      return `Continues your strong action franchise affinity after finishing ${previous.media.title}.`;
    }

    return 'Direct continuation of a franchise you already engage with heavily.';
  }

  const core = taste.profile.coreGenres.slice(0, 2).map(item => item.name);
  const evidence = topEvidenceTitles(history);
  if (evidence.length >= 2) {
    return `Matches your highest-confidence ${core.join(' + ')} taste built from ${evidence[0]} and ${evidence[1]}.`;
  }

  return `Strong fit for your core ${core.join(' + ')} identity and single-player narrative preference.`;
}

export function buildDiscoveryReason(
  candidate: GameCandidate,
  taste: TasteComputation,
  history: GameHistoryEntry[],
  isContinuation: boolean,
): string {
  if (isContinuation) {
    const key = extractFranchiseKey(candidate.title);
    const previous = history
      .filter(item => item.status === 'completed' || item.status === 'current')
      .find(item => extractFranchiseKey(item.media.title) === key);

    if (previous) {
      return `Likely next franchise step after ${previous.media.title}, aligned with your continuation-first play style.`;
    }

    return 'Likely franchise continuation that fits your progression-focused play pattern.';
  }

  const topThemes = taste.profile.themes.slice(0, 2).map(item => item.name);
  const coreGenres = taste.profile.coreGenres.slice(0, 2).map(item => item.name);
  return `Fits your ${coreGenres.join(' + ')} core profile and ${topThemes.join(' / ')} preference.`;
}
