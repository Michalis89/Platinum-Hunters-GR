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
    return dbCount === 1 ? '1 pick for you' : `${dbCount} picks for you`;
  }

  if (dbCount === 0) {
    return backlogCount === 1 ? '1 backlog pick' : `${backlogCount} backlog picks`;
  }

  // Both exist
  return `${backlogCount} backlog + ${dbCount} database picks`;
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
  it('should show "N picks for you" when all are database suggestions', () => {
    const suggestions = [
      createMockSuggestion('database', 'Game 1'),
      createMockSuggestion('database', 'Game 2'),
      createMockSuggestion('database-fallback', 'Game 3'),
      createMockSuggestion('database', 'Game 4'),
    ];

    expect(generateSuggestionsLabel(suggestions)).toBe('4 picks for you');
  });

  it('should show "N backlog picks" when all are backlog suggestions', () => {
    const suggestions = [
      createMockSuggestion('backlog', 'Game 1'),
      createMockSuggestion('backlog', 'Game 2'),
    ];

    expect(generateSuggestionsLabel(suggestions)).toBe('2 backlog picks');
  });

  it('should show "1 backlog pick" for single backlog item', () => {
    const suggestions = [createMockSuggestion('backlog', 'Game 1')];

    expect(generateSuggestionsLabel(suggestions)).toBe('1 backlog pick');
  });

  it('should show "1 pick for you" for single database item', () => {
    const suggestions = [createMockSuggestion('database', 'Game 1')];

    expect(generateSuggestionsLabel(suggestions)).toBe('1 pick for you');
  });

  it('should show mixed label when both backlog and database suggestions exist', () => {
    const suggestions = [
      createMockSuggestion('backlog', 'Game 1'),
      createMockSuggestion('backlog', 'Game 2'),
      createMockSuggestion('database', 'Game 3'),
      createMockSuggestion('database-fallback', 'Game 4'),
    ];

    expect(generateSuggestionsLabel(suggestions)).toBe('2 backlog + 2 database picks');
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
    expect(label).toBe('4 picks for you');
    expect(label).not.toContain('backlog');
  });

  it('should handle asymmetric counts correctly', () => {
    const suggestions = [
      createMockSuggestion('backlog', 'Game 1'),
      createMockSuggestion('database', 'Game 2'),
      createMockSuggestion('database', 'Game 3'),
      createMockSuggestion('database', 'Game 4'),
    ];

    expect(generateSuggestionsLabel(suggestions)).toBe('1 backlog + 3 database picks');
  });
});
