export type UnifiedOverviewCategory = {
  key: string;
  enabled: boolean;
  inProgress: number;
  completed: number;
  recentlyFinished: number;
};

export type UnifiedOverviewInput = {
  categories: UnifiedOverviewCategory[];
  totalMinutes: number;
  hasFullTimeCoverage?: boolean;
};

export type OverviewAggregate = {
  totalInProgress: number;
  totalCompleted: number;
  totalRecentlyFinished: number;
  activeCategoryCount: number;
  enabledCategoryCount: number;
  totalMinutes: number;
  timeLabel: 'tracked' | 'time logged';
};

const toSafeNumber = (value: number) => (Number.isFinite(value) && value > 0 ? value : 0);

export function aggregateOverview(input: UnifiedOverviewInput): OverviewAggregate | null {
  let enabledCategoryCount = 0;
  let totalInProgress = 0;
  let totalCompleted = 0;
  let totalRecentlyFinished = 0;
  let activeCategoryCount = 0;

  for (const category of input.categories ?? []) {
    if (!category.enabled) {
      continue;
    }

    enabledCategoryCount += 1;

    const inProgress = toSafeNumber(category.inProgress);
    const completed = toSafeNumber(category.completed);
    const recentlyFinished = toSafeNumber(category.recentlyFinished);

    totalInProgress += inProgress;
    totalCompleted += completed;
    totalRecentlyFinished += recentlyFinished;

    if (inProgress > 0 || completed > 0 || recentlyFinished > 0) {
      activeCategoryCount += 1;
    }
  }

  if (enabledCategoryCount < 2) {
    return null;
  }

  const totalMinutes = toSafeNumber(input.totalMinutes);
  const hasFullTimeCoverage = input.hasFullTimeCoverage ?? true;

  return {
    totalInProgress,
    totalCompleted,
    totalRecentlyFinished,
    activeCategoryCount,
    enabledCategoryCount,
    totalMinutes,
    timeLabel: hasFullTimeCoverage ? 'tracked' : 'time logged',
  };
}

export function formatDuration(totalMinutes: number): string {
  const safeMinutes = Math.max(0, Math.floor(totalMinutes));
  const totalHours = Math.floor(safeMinutes / 60);

  const hoursPerDay = 24;
  const hoursPerMonth = 30 * hoursPerDay;
  const hoursPerYear = 365 * hoursPerDay;

  const years = Math.floor(totalHours / hoursPerYear);
  let remainder = totalHours % hoursPerYear;
  const months = Math.floor(remainder / hoursPerMonth);
  remainder %= hoursPerMonth;
  const days = Math.floor(remainder / hoursPerDay);
  const hours = remainder % hoursPerDay;

  return `${years} years, ${months} months, ${days} days, ${hours} hours`;
}

export function isOverviewZeroState(aggregate: OverviewAggregate): boolean {
  return (
    aggregate.totalInProgress === 0 &&
    aggregate.totalCompleted === 0 &&
    aggregate.totalRecentlyFinished === 0
  );
}
