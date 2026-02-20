import { describe, expect, it } from '@jest/globals';
import type { MediaSuggestion } from '@/lib/dashboard/category-data';

// Extract the label generation logic for testing
function generateSuggestionsLabel(suggestions: MediaSuggestion[]): string {
  const backlogCount = suggestions.filter(s => s.source === 'backlog').length;
  const dbCount = suggestions.filter(
    s => s.source === 'database' || s.source === 'database-fallback',
  ).length;

  if (backlogCount === 0 && dbCount === 0) {
    return '';
  }

  if (backlogCount === 0) {
    return dbCount === 1 ? '1 possible next title' : `${dbCount} possible next titles`;
  }

  if (dbCount === 0) {
    return backlogCount === 1 ? '1 from your backlog' : `${backlogCount} from your backlog`;
  }

  // Both exist
  return `${backlogCount} from backlog + ${dbCount} possible next`;
}

const createMockSuggestion = (
  source: 'backlog' | 'database' | 'database-fallback',
  title: string,
): MediaSuggestion => ({
  mediaId: Math.random(),
  category: 'games',
  title,
  cover: '',
  slug: '',
  reason: '',
  confidence: 1.0,
  source,
  genres: [],
  tags: [],
});

describe('MediaSuggestions label generation', () => {
  it('should show "N possible next titles" when all are database suggestions', () => {
    const suggestions = [
      createMockSuggestion('database', 'Game 1'),
      createMockSuggestion('database', 'Game 2'),
      createMockSuggestion('database-fallback', 'Game 3'),
      createMockSuggestion('database', 'Game 4'),
    ];

    expect(generateSuggestionsLabel(suggestions)).toBe('4 possible next titles');
  });

  it('should show "N from your backlog" when all are backlog suggestions', () => {
    const suggestions = [
      createMockSuggestion('backlog', 'Game 1'),
      createMockSuggestion('backlog', 'Game 2'),
    ];

    expect(generateSuggestionsLabel(suggestions)).toBe('2 from your backlog');
  });

  it('should show "1 from your backlog" for single backlog item', () => {
    const suggestions = [createMockSuggestion('backlog', 'Game 1')];

    expect(generateSuggestionsLabel(suggestions)).toBe('1 from your backlog');
  });

  it('should show "1 possible next title" for single database item', () => {
    const suggestions = [createMockSuggestion('database', 'Game 1')];

    expect(generateSuggestionsLabel(suggestions)).toBe('1 possible next title');
  });

  it('should show mixed label when both backlog and database suggestions exist', () => {
    const suggestions = [
      createMockSuggestion('backlog', 'Game 1'),
      createMockSuggestion('backlog', 'Game 2'),
      createMockSuggestion('database', 'Game 3'),
      createMockSuggestion('database-fallback', 'Game 4'),
    ];

    expect(generateSuggestionsLabel(suggestions)).toBe('2 from backlog + 2 possible next');
  });

  it('should return empty string for no suggestions', () => {
    expect(generateSuggestionsLabel([])).toBe('');
  });

  it('should NOT mention backlog when user has 0 planned entries', () => {
    const suggestions = [
      createMockSuggestion('database', 'Game 1'),
      createMockSuggestion('database', 'Game 2'),
      createMockSuggestion('database', 'Game 3'),
      createMockSuggestion('database', 'Game 4'),
    ];

    const label = generateSuggestionsLabel(suggestions);
    expect(label).toBe('4 possible next titles');
    expect(label).not.toContain('backlog');
  });

  it('should handle asymmetric counts correctly', () => {
    const suggestions = [
      createMockSuggestion('backlog', 'Game 1'),
      createMockSuggestion('database', 'Game 2'),
      createMockSuggestion('database', 'Game 3'),
      createMockSuggestion('database', 'Game 4'),
    ];

    expect(generateSuggestionsLabel(suggestions)).toBe('1 from backlog + 3 possible next');
  });
});
