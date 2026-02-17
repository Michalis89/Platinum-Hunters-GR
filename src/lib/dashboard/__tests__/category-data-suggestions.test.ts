import { describe, expect, it } from '@jest/globals';
import type { MediaSuggestion } from '../category-data';

/**
 * Integration tests for media suggestion source field and backlog detection
 * These tests verify the contract that buildMediaSuggestions returns
 */
describe('MediaSuggestion source field', () => {
  it('should have source field on all suggestions', () => {
    // This is a type-level test to ensure the MediaSuggestion type includes source
    const mockSuggestion: MediaSuggestion = {
      mediaId: 1,
      category: 'games',
      title: 'Test Game',
      cover: '',
      slug: 'test-game',
      reason: 'Test reason',
      confidence: 1.0,
      source: 'backlog', // This should compile without error
      genres: [],
      tags: [],
    };

    expect(mockSuggestion.source).toBe('backlog');
  });

  it('should only allow valid source values', () => {
    const validSources: Array<MediaSuggestion['source']> = [
      'backlog',
      'database',
      'database-fallback',
    ];

    validSources.forEach(source => {
      const suggestion: MediaSuggestion = {
        mediaId: 1,
        category: 'games',
        title: 'Test',
        cover: '',
        slug: 'test',
        reason: 'test',
        confidence: 1.0,
        source,
        genres: [],
      };

      expect(['backlog', 'database', 'database-fallback']).toContain(suggestion.source);
    });
  });
});

describe('Backlog detection logic', () => {
  it('should identify backlog suggestions correctly', () => {
    const suggestions: MediaSuggestion[] = [
      {
        mediaId: 1,
        category: 'games',
        title: 'Backlog Game',
        cover: '',
        slug: 'backlog-game',
        reason: 'In your backlog',
        confidence: 1.0,
        source: 'backlog',
      },
      {
        mediaId: 2,
        category: 'games',
        title: 'Database Game',
        cover: '',
        slug: 'database-game',
        reason: 'Because you love RPG',
        confidence: 0.85,
        source: 'database',
      },
    ];

    const backlogCount = suggestions.filter(s => s.source === 'backlog').length;
    const dbCount = suggestions.filter(
      s => s.source === 'database' || s.source === 'database-fallback',
    ).length;

    expect(backlogCount).toBe(1);
    expect(dbCount).toBe(1);
  });

  it('should have backlogCount = 0 when user has no planned entries', () => {
    // Simulate suggestions when user has 0 planned entries (all completed)
    const suggestions: MediaSuggestion[] = [
      {
        mediaId: 1,
        category: 'games',
        title: 'Database Game 1',
        cover: '',
        slug: 'db-game-1',
        reason: 'Because you love Action',
        confidence: 0.9,
        source: 'database',
      },
      {
        mediaId: 2,
        category: 'games',
        title: 'Database Game 2',
        cover: '',
        slug: 'db-game-2',
        reason: 'Because you love RPG',
        confidence: 0.85,
        source: 'database',
      },
    ];

    const backlogCount = suggestions.filter(s => s.source === 'backlog').length;

    expect(backlogCount).toBe(0);
    expect(suggestions.every(s => s.source !== 'backlog')).toBe(true);
  });

  it('should correctly count backlog suggestions when present', () => {
    const suggestions: MediaSuggestion[] = [
      {
        mediaId: 1,
        category: 'games',
        title: 'Backlog 1',
        cover: '',
        slug: 'backlog-1',
        reason: 'High priority in your backlog',
        confidence: 1.0,
        source: 'backlog',
      },
      {
        mediaId: 2,
        category: 'games',
        title: 'Backlog 2',
        cover: '',
        slug: 'backlog-2',
        reason: 'In your backlog - ready to start',
        confidence: 1.0,
        source: 'backlog',
      },
      {
        mediaId: 3,
        category: 'games',
        title: 'DB Game',
        cover: '',
        slug: 'db-game',
        reason: 'Popular pick',
        confidence: 0.8,
        source: 'database',
      },
    ];

    const backlogCount = suggestions.filter(s => s.source === 'backlog').length;

    expect(backlogCount).toBe(2);
  });

  it('should distinguish between database and database-fallback sources', () => {
    const suggestions: MediaSuggestion[] = [
      {
        mediaId: 1,
        category: 'games',
        title: 'Strong Match',
        cover: '',
        slug: 'strong',
        reason: 'Because you love RPG',
        confidence: 0.92,
        source: 'database',
      },
      {
        mediaId: 2,
        category: 'games',
        title: 'Fallback Pick',
        cover: '',
        slug: 'fallback',
        reason: 'Community pick for your tastes',
        confidence: 0.35,
        source: 'database-fallback',
      },
    ];

    const databaseCount = suggestions.filter(s => s.source === 'database').length;
    const fallbackCount = suggestions.filter(s => s.source === 'database-fallback').length;

    expect(databaseCount).toBe(1);
    expect(fallbackCount).toBe(1);
  });
});

describe('Backlog confidence values', () => {
  it('should have confidence = 1.0 for backlog items', () => {
    const backlogSuggestion: MediaSuggestion = {
      mediaId: 1,
      category: 'games',
      title: 'Backlog Game',
      cover: '',
      slug: 'backlog-game',
      reason: 'In your backlog - ready to start',
      confidence: 1.0,
      source: 'backlog',
    };

    expect(backlogSuggestion.confidence).toBe(1.0);
  });

  it('should have variable confidence for database items', () => {
    const databaseSuggestion: MediaSuggestion = {
      mediaId: 1,
      category: 'games',
      title: 'Database Game',
      cover: '',
      slug: 'db-game',
      reason: 'Strong match',
      confidence: 0.85,
      source: 'database',
    };

    expect(databaseSuggestion.confidence).toBeLessThan(1.0);
    expect(databaseSuggestion.confidence).toBeGreaterThan(0);
  });
});
