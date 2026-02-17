import { __personalizationTestUtils } from './category-data';

type TestEntry = Parameters<typeof __personalizationTestUtils.analyzeUserPreferences>[0][number];
type TestCandidate = Parameters<typeof __personalizationTestUtils.scoreCandidateItem>[0];

function createEntry(overrides: Partial<TestEntry>): TestEntry {
  return {
    id: overrides.id ?? 1,
    status: overrides.status ?? 'completed',
    score: overrides.score ?? 8,
    progress: overrides.progress ?? 40,
    priority: overrides.priority ?? null,
    pinned_rank: overrides.pinned_rank ?? null,
    selected_platform: overrides.selected_platform ?? null,
    created_at: overrides.created_at ?? null,
    updated_at: overrides.updated_at ?? null,
    notes: overrides.notes ?? null,
    is_favorite: overrides.is_favorite ?? false,
    media_items: overrides.media_items ?? {
      id: 101,
      category: 'games',
      title: 'Test title',
      genres: ['RPG'],
      tags: [],
    },
  };
}

function createCandidate(overrides: Partial<TestCandidate>): TestCandidate {
  return {
    id: overrides.id ?? 999,
    category: overrides.category ?? 'games',
    title: overrides.title ?? 'Candidate',
    title_english: overrides.title_english ?? null,
    title_romaji: overrides.title_romaji ?? null,
    title_native: overrides.title_native ?? null,
    original_title: overrides.original_title ?? null,
    cover_image_large: overrides.cover_image_large ?? null,
    cover_image_medium: overrides.cover_image_medium ?? null,
    genres: overrides.genres ?? [],
    tags: overrides.tags ?? [],
  };
}

describe('category personalization model', () => {
  it('normalizes and caps multi-genre items so generic genres do not dominate', () => {
    const picked = __personalizationTestUtils.pickTopGenresForItem([
      'Role-playing (RPG)',
      'Strategy',
      'Turn-based strategy (TBS)',
      'Action',
      'Fantasy',
    ]);

    expect(picked.length).toBeLessThanOrEqual(3);
    expect(picked).toEqual(expect.arrayContaining(['rpg', 'turn-based', 'strategy']));
    expect(picked).not.toContain('action');
    expect(picked).not.toContain('fantasy');
  });

  it('applies stronger positive signal for completed high-rated profile than dropped low-rated profile', () => {
    const entries = [
      createEntry({
        id: 1,
        status: 'completed',
        score: 10,
        is_favorite: true,
        progress: 90,
        media_items: {
          id: 201,
          category: 'games',
          title: 'Baldurs Gate III',
          genres: ['Role-playing (RPG)', 'Turn-based strategy (TBS)', 'Action'],
          tags: [],
        },
      }),
      createEntry({
        id: 2,
        status: 'dropped',
        score: 3,
        progress: 2,
        media_items: {
          id: 202,
          category: 'games',
          title: 'Random Shooter',
          genres: ['Shooter', 'Action'],
          tags: [],
        },
      }),
    ];

    const preferences = __personalizationTestUtils.analyzeUserPreferences(entries, undefined);
    const rpgCandidate = createCandidate({ genres: ['RPG', 'Turn-based'] });
    const shooterCandidate = createCandidate({ id: 1000, genres: ['Shooter', 'Action'] });

    const rpgScore = __personalizationTestUtils.scoreCandidateItem(rpgCandidate, preferences);
    const shooterScore = __personalizationTestUtils.scoreCandidateItem(
      shooterCandidate,
      preferences,
    );

    expect(rpgScore.score).toBeGreaterThan(shooterScore.score);
    expect(rpgScore.hasPersonalSignal).toBe(true);
  });

  it('blocks sequel suggestions when previous entry in series is not completed', () => {
    const seriesInfo = __personalizationTestUtils.detectSeries('Mass Effect 3');
    const result = __personalizationTestUtils.checkSeriesPrerequisites(
      'Mass Effect 3',
      seriesInfo,
      [
        createEntry({
          id: 10,
          status: 'planned',
          media_items: {
            id: 210,
            category: 'games',
            title: 'Mass Effect 2',
            genres: ['RPG'],
            tags: [],
          },
        }),
      ],
    );

    expect(seriesInfo.isSeries).toBe(true);
    expect(result.canRecommend).toBe(false);
  });
});
