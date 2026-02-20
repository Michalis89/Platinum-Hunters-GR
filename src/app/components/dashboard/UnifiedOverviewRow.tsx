import { useMemo } from 'react';
import {
  aggregateOverview,
  formatDuration,
  isOverviewZeroState,
} from '@/lib/dashboard/unified-overview';
import type { UnifiedOverviewInput } from '@/lib/dashboard/unified-overview';

type UnifiedOverviewRowProps = {
  data: UnifiedOverviewInput;
};

const formatNumber = (value: number) => value.toLocaleString('en-US');

export default function UnifiedOverviewRow({ data }: UnifiedOverviewRowProps) {
  const overview = useMemo(() => {
    const aggregate = aggregateOverview(data);
    if (!aggregate) {
      return null;
    }

    if (isOverviewZeroState(aggregate)) {
      return { zeroState: true as const };
    }

    const trackedHours = Math.floor(aggregate.totalMinutes / 60);

    return {
      zeroState: false as const,
      totalInProgress: aggregate.totalInProgress,
      totalCompleted: aggregate.totalCompleted,
      activeCategoryCount: aggregate.activeCategoryCount,
      totalRecentlyFinished: aggregate.totalRecentlyFinished,
      trackedHours,
      hasDuration: aggregate.totalMinutes > 0,
      duration: formatDuration(aggregate.totalMinutes),
      timeLabel: aggregate.timeLabel,
    };
  }, [data]);

  if (!overview) {
    return null;
  }

  if (overview.zeroState) {
    return (
      <section className="mt-4 pb-6 md:mt-5 md:pb-8">
        <p className="mx-auto max-w-5xl text-center text-sm leading-6 text-muted-foreground md:text-[15px]">
          Your space is ready.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-4 pb-6 md:mt-5 md:pb-8">
      <p className="mx-auto max-w-5xl text-center text-sm leading-6 text-muted-foreground md:text-[15px]">
        <span className="font-medium tabular-nums text-foreground">
          {formatNumber(overview.totalInProgress)}
        </span>{' '}
        in progress ·{' '}
        <span className="font-medium tabular-nums text-foreground">
          {formatNumber(overview.totalCompleted)}
        </span>{' '}
        completed · Active in{' '}
        <span className="font-medium tabular-nums text-foreground">
          {formatNumber(overview.activeCategoryCount)}
        </span>{' '}
        categories ·{' '}
        <span className="font-medium tabular-nums text-foreground">
          {formatNumber(overview.totalRecentlyFinished)}
        </span>{' '}
        finished recently ·{' '}
        <span className="font-medium tabular-nums text-foreground">
          {formatNumber(overview.trackedHours)}h
        </span>{' '}
        {overview.timeLabel}
      </p>
      {overview.hasDuration && (
        <p className="mt-1.5 text-center text-xs text-muted-foreground/80 md:text-sm">
          ≈ {overview.duration} of your time
        </p>
      )}
    </section>
  );
}
