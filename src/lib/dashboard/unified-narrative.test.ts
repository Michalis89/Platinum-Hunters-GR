import { buildNarrative } from './unified-narrative';

describe('buildNarrative', () => {
  it('returns null when enabled categories are fewer than 2', () => {
    const message = buildNarrative({
      categories: [
        {
          key: 'games',
          inProgress: 4,
          recentlyFinished: 0,
          recentActivityCount: 8,
        },
      ],
      enabledCategoryKeys: ['games'],
    });

    expect(message).toBeNull();
  });

  it('returns focused message when one category dominates', () => {
    const message = buildNarrative({
      categories: [
        {
          key: 'games',
          inProgress: 4,
          recentlyFinished: 0,
          recentActivityCount: 8,
        },
        {
          key: 'books',
          inProgress: 2,
          recentlyFinished: 0,
          recentActivityCount: 2,
        },
      ],
      enabledCategoryKeys: ['games', 'books'],
    });

    expect(message).toBe("Lately, you've been mostly focused on Games.");
  });

  it('returns split message when two categories are close', () => {
    const message = buildNarrative({
      categories: [
        {
          key: 'books',
          inProgress: 2,
          recentlyFinished: 0,
          recentActivityCount: 4,
        },
        {
          key: 'tv',
          inProgress: 1,
          recentlyFinished: 0,
          recentActivityCount: 4,
        },
      ],
      enabledCategoryKeys: ['books', 'tv'],
    });

    expect(message).toBe("You've been splitting your time between Books and TV.");
  });

  it('returns broad activity message for three categories with even spread', () => {
    const message = buildNarrative({
      categories: [
        {
          key: 'games',
          inProgress: 3,
          recentlyFinished: 0,
          recentActivityCount: 5,
        },
        {
          key: 'anime',
          inProgress: 1,
          recentlyFinished: 0,
          recentActivityCount: 5,
        },
        {
          key: 'books',
          inProgress: 2,
          recentlyFinished: 0,
          recentActivityCount: 5,
        },
      ],
      enabledCategoryKeys: ['games', 'anime', 'books'],
    });

    expect(message).toBe("You've been active across several categories lately.");
  });

  it('returns quiet message when all recent activity is zero', () => {
    const message = buildNarrative({
      categories: [
        {
          key: 'games',
          inProgress: 3,
          recentlyFinished: 0,
          recentActivityCount: 0,
        },
        {
          key: 'anime',
          inProgress: 1,
          recentlyFinished: 0,
          recentActivityCount: 0,
        },
        {
          key: 'books',
          inProgress: 2,
          recentlyFinished: 0,
          recentActivityCount: 0,
        },
      ],
      enabledCategoryKeys: ['games', 'anime', 'books'],
    });

    expect(message).toBe('Your space is quiet right now.');
  });

  it('returns single-active-category message when only one enabled category has activity', () => {
    const message = buildNarrative({
      categories: [
        {
          key: 'books',
          inProgress: 2,
          recentlyFinished: 0,
          recentActivityCount: 7,
        },
        {
          key: 'tv',
          inProgress: 2,
          recentlyFinished: 0,
          recentActivityCount: 0,
        },
      ],
      enabledCategoryKeys: ['books', 'tv'],
    });

    expect(message).toBe('Most of your time has been in Books.');
  });
});
