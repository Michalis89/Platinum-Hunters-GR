import { aggregateOverview, formatDuration, isOverviewZeroState } from './unified-overview';

describe('unified overview', () => {
  it('returns null when fewer than two categories are enabled', () => {
    const result = aggregateOverview({
      categories: [
        {
          key: 'games',
          enabled: true,
          inProgress: 3,
          completed: 5,
          recentlyFinished: 1,
        },
      ],
      totalMinutes: 600,
    });

    expect(result).toBeNull();
  });

  it('aggregates enabled categories in O(n)', () => {
    const aggregate = aggregateOverview({
      categories: [
        {
          key: 'games',
          enabled: true,
          inProgress: 4,
          completed: 12,
          recentlyFinished: 2,
        },
        {
          key: 'anime',
          enabled: true,
          inProgress: 2,
          completed: 6,
          recentlyFinished: 1,
        },
        {
          key: 'books',
          enabled: false,
          inProgress: 10,
          completed: 20,
          recentlyFinished: 3,
        },
      ],
      totalMinutes: 5280,
      hasFullTimeCoverage: false,
    });

    expect(aggregate).toEqual({
      totalInProgress: 6,
      totalCompleted: 18,
      totalRecentlyFinished: 3,
      activeCategoryCount: 2,
      enabledCategoryCount: 2,
      totalMinutes: 5280,
      timeLabel: 'time logged',
    });
  });

  it('returns zero state when all totals are zero', () => {
    const aggregate = aggregateOverview({
      categories: [
        {
          key: 'games',
          enabled: true,
          inProgress: 0,
          completed: 0,
          recentlyFinished: 0,
        },
        {
          key: 'tv',
          enabled: true,
          inProgress: 0,
          completed: 0,
          recentlyFinished: 0,
        },
      ],
      totalMinutes: 0,
    });

    expect(isOverviewZeroState(aggregate!)).toBe(true);
  });

  it('formats human duration from total minutes', () => {
    expect(formatDuration(7159 * 60)).toBe('0 years, 9 months, 28 days, 7 hours');
  });
});
