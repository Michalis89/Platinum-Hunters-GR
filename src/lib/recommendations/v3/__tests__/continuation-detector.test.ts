import { detectContinuationCandidates } from '../pipeline/continuation-detector';
import type { MediaCandidate, MediaHistoryEntry } from '../types';

function makeHistoryEntry(title: string, status: MediaHistoryEntry['status']): MediaHistoryEntry {
  return {
    id: 1,
    mediaId: 1,
    status,
    score: status === 'completed' ? 9 : null,
    progress: null,
    priority: null,
    isFavorite: false,
    pinnedRank: null,
    updatedAt: '2026-01-01T00:00:00.000Z',
    media: {
      id: 1,
      title,
      category: 'games',
      genres: ['adventure', 'role-playing-rpg'],
      themes: [],
      platforms: [],
    },
  };
}

function makeCandidate(id: number, title: string): MediaCandidate {
  return {
    id,
    title,
    cover: '',
    slug: `item-${id}`,
    category: 'games',
    genres: ['adventure', 'role-playing-rpg'],
    themes: [],
    platforms: [],
    popularityScore: 0,
  };
}

describe('detectContinuationCandidates', () => {
  it('requires strict direct installment progression', () => {
    const history = [makeHistoryEntry('Mass Effect 2', 'completed')];
    const candidates = [makeCandidate(2, 'Mass Effect 3')];

    const result = detectContinuationCandidates(candidates, history, []);

    expect(result).toHaveLength(1);
    expect(result[0].tier).toBe('high');
  });

  it('rejects loose same-franchise links without direct progression markers', () => {
    const history = [makeHistoryEntry("Assassin's Creed: The Ezio Collection", 'completed')];
    const candidates = [makeCandidate(2, "Assassin's Creed III: Liberation")];

    const result = detectContinuationCandidates(candidates, history, []);

    expect(result).toHaveLength(0);
  });

  it('does not infer continuation from marker words without franchise membership', () => {
    const history = [makeHistoryEntry('Bloodborne', 'completed')];
    const candidates = [makeCandidate(2, 'Completely Different Story Part II')];

    const result = detectContinuationCandidates(candidates, history, [
      { pattern: /\bPart\s+II\b/i, weight: 0.9 },
    ]);

    expect(result).toHaveLength(0);
  });
});
