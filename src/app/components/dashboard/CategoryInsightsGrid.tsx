'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Pie, PieChart, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltipContent,
} from '@/components/ui/chart';
import DashboardSectionHeader from './DashboardSectionHeader';
import {
  DASH_BORDER,
  DASH_PADDING_LARGE,
  DASH_PADDING_STANDARD,
  DASH_RADIUS_CARD,
  DASH_RADIUS_SECTION,
  DASH_SURFACE_CARD,
  DASH_SURFACE_SECTION,
} from './dashboard-ui-tokens';
import type {
  CategoryInsightsPayload,
  CategoryRhythmEntry,
  DashboardCategoryKey,
  PlatformInsightPayload,
} from '@/lib/dashboard/category-data';

type CategoryInsightsGridProps = {
  category: DashboardCategoryKey;
  insights: CategoryInsightsPayload;
  rhythmEntries: CategoryRhythmEntry[];
  platformInsight: PlatformInsightPayload | null;
};

type RhythmStats = {
  updates7: number;
  updates30: number;
  completed30: number;
  dropped30: number;
  favoritesAdded30: number;
  hours30: number | null;
  avgScore30: number | null;
  topGenre30: string | null;
  topPlatform30: string | null;
};

function computeRhythmStats(entries: CategoryRhythmEntry[], now: Date): RhythmStats {
  const cutoff7 = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const cutoff30 = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  let updates7 = 0;
  let updates30 = 0;
  let completed30 = 0;
  let dropped30 = 0;
  let favoritesAdded30 = 0;
  let scoredSum30 = 0;
  let scoredCount30 = 0;
  let hoursSum30 = 0;
  let hasHours30 = false;
  const genreCounts = new Map<string, number>();
  const platformCounts = new Map<string, number>();

  for (const entry of entries) {
    const activityAt = entry.updatedAt ?? entry.createdAt;
    if (!activityAt) {
      continue;
    }
    const timestamp = new Date(activityAt).getTime();
    if (!Number.isFinite(timestamp)) {
      continue;
    }

    const in7 = timestamp >= cutoff7;
    const in30 = timestamp >= cutoff30;
    if (in7) {
      updates7 += 1;
    }
    if (!in30) {
      continue;
    }

    updates30 += 1;
    if (entry.status === 'completed') {
      completed30 += 1;
    }
    if (entry.status === 'dropped') {
      dropped30 += 1;
    }
    if (entry.isFavorite) {
      favoritesAdded30 += 1;
    }
    if (typeof entry.score === 'number' && Number.isFinite(entry.score)) {
      scoredSum30 += entry.score;
      scoredCount30 += 1;
    }

    if (
      typeof entry.progress === 'number' &&
      Number.isFinite(entry.progress) &&
      entry.progress > 0
    ) {
      hoursSum30 += entry.progress;
      hasHours30 = true;
    } else if (
      typeof entry.runtime === 'number' &&
      Number.isFinite(entry.runtime) &&
      entry.runtime > 0
    ) {
      hoursSum30 += entry.runtime > 80 ? entry.runtime / 60 : entry.runtime;
      hasHours30 = true;
    }

    for (const genre of entry.genres) {
      const label = genre.trim();
      if (!label) {
        continue;
      }
      genreCounts.set(label, (genreCounts.get(label) ?? 0) + 1);
    }
    for (const theme of entry.themes) {
      const label = theme.trim();
      if (!label) {
        continue;
      }
      genreCounts.set(label, (genreCounts.get(label) ?? 0) + 1);
    }
    if (entry.selectedPlatform) {
      platformCounts.set(
        entry.selectedPlatform,
        (platformCounts.get(entry.selectedPlatform) ?? 0) + 1,
      );
    }
  }

  const topGenre30 =
    Array.from(genreCounts.entries()).sort((a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1];
      }
      return a[0].localeCompare(b[0]);
    })[0]?.[0] ?? null;
  const topPlatform30 =
    Array.from(platformCounts.entries()).sort((a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1];
      }
      return a[0].localeCompare(b[0]);
    })[0]?.[0] ?? null;

  return {
    updates7,
    updates30,
    completed30,
    dropped30,
    favoritesAdded30,
    hours30: hasHours30 ? Number(hoursSum30.toFixed(1)) : null,
    avgScore30: scoredCount30 >= 2 ? Number((scoredSum30 / scoredCount30).toFixed(1)) : null,
    topGenre30,
    topPlatform30,
  };
}

function getMomentumPhaseMessage(completed30d: number): string {
  if (completed30d > 40) {
    return "You're in a high-completion phase.";
  }
  if (completed30d >= 15) {
    return "You're maintaining a steady pace.";
  }
  return "You're in an exploration phase.";
}

type PlatformDistributionItem = {
  platform: string;
  count: number;
  percent: number;
};

function computePlatformDistribution30d(
  entries: CategoryRhythmEntry[],
  now: Date,
  limit = 2,
): PlatformDistributionItem[] {
  const cutoff30 = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  const counts = new Map<string, number>();

  for (const entry of entries) {
    const activityAt = entry.updatedAt ?? entry.createdAt;
    if (!activityAt || !entry.selectedPlatform) {
      continue;
    }
    const timestamp = new Date(activityAt).getTime();
    if (!Number.isFinite(timestamp) || timestamp < cutoff30) {
      continue;
    }
    counts.set(entry.selectedPlatform, (counts.get(entry.selectedPlatform) ?? 0) + 1);
  }

  const sorted = Array.from(counts.entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1];
      }
      return a[0].localeCompare(b[0]);
    })
    .slice(0, limit);

  const total = sorted.reduce((sum, [, count]) => sum + count, 0);
  if (total === 0) {
    return [];
  }

  return sorted.map(([platform, count]) => ({
    platform,
    count,
    percent: Math.round((count / total) * 100),
  }));
}

const STATUS_META: Array<{
  key: keyof CategoryInsightsPayload['statusCounts'];
  label: string;
  color: string;
}> = [
  { key: 'completed', label: 'Completed', color: 'hsl(var(--success))' },
  { key: 'current', label: 'Current', color: 'hsl(var(--info))' },
  { key: 'planned', label: 'Planned', color: 'hsl(var(--warning))' },
  { key: 'dropped', label: 'Dropped', color: 'hsl(var(--destructive))' },
];

const CATEGORY_LABELS: Record<DashboardCategoryKey, string> = {
  games: 'Games',
  books: 'Books',
  anime: 'Anime',
  manga: 'Manga',
  movies: 'Movies',
  tv: 'TV',
};

const STREAMING_PLATFORM_LABELS: Record<string, string> = {
  netflix: 'Netflix',
  prime_video: 'Amazon Prime Video',
  disney_plus: 'Disney+',
  hbo_max: 'HBO Max',
  apple_tv: 'Apple TV+',
  tv: 'TV Broadcast',
  cinema: 'Cinema',
  bluray: 'Blu-ray / DVD',
  crunchyroll: 'Crunchyroll',
  youtube: 'YouTube',
  other: 'Other',
};

const READING_FORMAT_LABELS: Record<string, string> = {
  physical: 'Physical',
  digital: 'Digital',
};

function formatPlatformLabelByCategory(category: DashboardCategoryKey, value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized) {
    return 'Unspecified';
  }
  const key = normalized.toLowerCase();

  if (category === 'books' || category === 'manga') {
    return READING_FORMAT_LABELS[key] ?? normalized;
  }
  if (category === 'anime' || category === 'movies' || category === 'tv') {
    return STREAMING_PLATFORM_LABELS[key] ?? normalized;
  }
  return normalized;
}

const COMPLETION_CHART_CONFIG = {
  completed: { label: 'Completed', color: 'hsl(var(--success))' },
  dropped: { label: 'Dropped', color: 'hsl(var(--destructive))' },
} as const;

const PLATFORM_CHART_CONFIG = {
  completed: { label: 'Completed', color: 'hsl(var(--success))' },
  dropped: { label: 'Dropped', color: 'hsl(var(--destructive))' },
} as const;

export default function CategoryInsightsGrid({
  category,
  insights,
  rhythmEntries,
  platformInsight,
}: CategoryInsightsGridProps) {
  const totalStatuses = Object.values(insights.statusCounts).reduce((sum, value) => sum + value, 0);
  const allPlatforms = platformInsight?.rows ?? [];
  const rhythmStats = useMemo(() => computeRhythmStats(rhythmEntries, new Date()), [rhythmEntries]);
  const platformDistribution30d = useMemo(
    () => computePlatformDistribution30d(rhythmEntries, new Date()),
    [rhythmEntries],
  );
  const momentumPhaseMessage = useMemo(
    () => getMomentumPhaseMessage(rhythmStats.completed30),
    [rhythmStats.completed30],
  );
  const completionRate30d = useMemo(() => {
    const resolved = rhythmStats.completed30 + rhythmStats.dropped30;
    if (resolved <= 0) {
      return 0;
    }
    return Math.round((rhythmStats.completed30 / resolved) * 100);
  }, [rhythmStats.completed30, rhythmStats.dropped30]);
  const topGenreLabel = rhythmStats.topGenre30 ?? 'Mixed';
  const primaryPlatformLabel = rhythmStats.topPlatform30
    ? formatPlatformLabelByCategory(category, rhythmStats.topPlatform30)
    : 'Not enough data yet';
  const averageRatingLabel =
    rhythmStats.avgScore30 !== null ? rhythmStats.avgScore30.toFixed(1) : 'Not enough ratings yet';
  const completedAttempts = insights.completionNumerator;
  const droppedAttempts = Math.max(0, insights.completionDenominator - completedAttempts);
  const completionPercent = insights.completionRate;
  const completionPieData =
    insights.completionDenominator > 0
      ? [
          {
            key: 'completed',
            label: 'Completed',
            value: completedAttempts,
            fill: 'var(--color-completed)',
          },
          {
            key: 'dropped',
            label: 'Dropped',
            value: droppedAttempts,
            fill: 'var(--color-dropped)',
          },
        ]
      : [{ key: 'completed', label: 'No resolved titles', value: 1, fill: 'hsl(var(--muted))' }];
  const platformChartData = allPlatforms.map(row => ({
    platform: formatPlatformLabelByCategory(category, row.platform),
    completed: row.completed,
    dropped: row.dropped,
    total: row.total,
    completionRate: Math.max(0, Math.min(100, row.completionRate)),
  }));
  const platformChartMinWidth = Math.max(300, platformChartData.length * 80);
  const formatPlatformTick = (value: string) =>
    value.length > 10 ? `${value.slice(0, 10).trimEnd()}...` : value;

  return (
    <section
      className={`space-y-4 ${DASH_RADIUS_SECTION} ${DASH_BORDER} ${DASH_SURFACE_SECTION} ${DASH_PADDING_STANDARD} ${DASH_PADDING_LARGE} md:space-y-5`}
    >
      <DashboardSectionHeader
        eyebrow="Your activity"
        title={`Your ${CATEGORY_LABELS[category]} lately`}
      />

      <div className="grid min-w-0 gap-3 md:grid-cols-2 md:gap-4">
        <Card
          className={`min-w-0 ${DASH_RADIUS_CARD} ${DASH_BORDER} ${DASH_SURFACE_CARD} shadow-sm`}
        >
          <CardHeader className="pb-2.5">
            <CardTitle className="text-base font-medium text-foreground">
              Where things stand
            </CardTitle>
          </CardHeader>
          <CardContent className="min-w-0 space-y-3">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              {STATUS_META.map(status => {
                const raw = insights.statusCounts[status.key];
                const width = totalStatuses > 0 ? (raw / totalStatuses) * 100 : 0;
                return (
                  <span
                    key={status.key}
                    className="inline-block h-full align-top"
                    style={{ width: `${width}%`, backgroundColor: status.color }}
                    aria-label={`${status.label}: ${raw}`}
                  />
                );
              })}
            </div>
            <div className="grid grid-cols-1 gap-1.5 text-xs text-muted-foreground/90 min-[401px]:grid-cols-2">
              {STATUS_META.map(status => (
                <div
                  key={status.key}
                  className="flex min-w-0 items-center gap-2 rounded-md border border-border/30 px-2 py-2"
                >
                  <span className="inline-flex min-w-0 items-center gap-1.5 truncate">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="truncate">{status.label}</span>
                  </span>
                  <span className="ml-auto whitespace-nowrap text-right font-semibold tabular-nums text-foreground">
                    {insights.statusCounts[status.key]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card
          className={`min-w-0 ${DASH_RADIUS_CARD} ${DASH_BORDER} ${DASH_SURFACE_CARD} shadow-sm`}
        >
          <CardHeader className="pb-2.5">
            <CardTitle className="text-base font-medium text-foreground">
              What you&apos;ve completed
            </CardTitle>
          </CardHeader>
          <CardContent className="min-w-0 space-y-3">
            <div className="grid gap-3 min-[401px]:grid-cols-[auto,1fr] min-[401px]:items-center">
              <div className="relative h-24 w-24 justify-self-center min-[401px]:justify-self-start">
                <ChartContainer
                  config={COMPLETION_CHART_CONFIG}
                  className="!aspect-square h-full w-full"
                >
                  <PieChart>
                    <Pie
                      data={completionPieData}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={30}
                      outerRadius={44}
                      strokeWidth={0}
                    />
                    <Tooltip
                      content={
                        <ChartTooltipContent
                          hideIndicator
                          formatter={value => `${value.toLocaleString()} entries`}
                        />
                      }
                    />
                  </PieChart>
                </ChartContainer>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xl font-semibold tabular-nums text-foreground">
                  {completionPercent}%
                </div>
              </div>
              <div className="w-full space-y-2 text-xs text-muted-foreground">
                <p className="tabular-nums">
                  {completedAttempts} completed / {insights.completionDenominator} resolved titles
                </p>
                <div className="grid grid-cols-1 gap-1.5 min-[421px]:grid-cols-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/40 px-2 py-1 tabular-nums">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: 'hsl(var(--success))' }}
                    />
                    Completed: {completedAttempts}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/40 px-2 py-1 tabular-nums">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: 'hsl(var(--destructive))' }}
                    />
                    Dropped: {droppedAttempts}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground/85">
              Based on titles you finished or dropped.
            </p>
          </CardContent>
        </Card>

        <Card
          className={`min-w-0 ${DASH_RADIUS_CARD} ${DASH_BORDER} ${DASH_SURFACE_CARD} shadow-sm`}
        >
          <CardHeader className="pb-2.5">
            <CardTitle className="text-base font-medium text-foreground">Your momentum</CardTitle>
            <p className="text-xs text-muted-foreground">
              A quick look at your recent activity in the last 30 days.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:items-start">
            <section aria-label="Momentum insight" className="space-y-3">
              <p className="text-xl font-semibold tabular-nums text-foreground">
                {rhythmStats.completed30} titles completed
              </p>
              <p className="text-sm text-muted-foreground">{momentumPhaseMessage}</p>
              <ul className="space-y-1 text-xs text-muted-foreground/90">
                <li>Focus: {topGenreLabel}-leaning experiences</li>
                <li>Primary platform: {primaryPlatformLabel}</li>
                <li>Average rating: {averageRatingLabel}</li>
              </ul>
            </section>

            <aside
              aria-label="Momentum visual summary"
              className="space-y-3 rounded-md border border-border/35 bg-muted/[0.08] p-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">Completion rate</p>
                  <p className="text-xs font-semibold tabular-nums text-foreground">
                    {completionRate30d}%
                  </p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-primary/15">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${completionRate30d}%` }}
                    aria-hidden="true"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Platform distribution</p>
                {platformDistribution30d.length === 0 ? (
                  <p className="text-xs text-muted-foreground/85">Not enough platform data yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {platformDistribution30d.map(item => (
                      <li key={item.platform} className="space-y-1">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="truncate text-foreground">
                            {formatPlatformLabelByCategory(category, item.platform)}
                          </span>
                          <span className="tabular-nums text-muted-foreground">
                            {item.percent}%
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-primary/10">
                          <div
                            className="h-full rounded-full bg-primary/80"
                            style={{ width: `${item.percent}%` }}
                            aria-hidden="true"
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          </CardContent>
        </Card>

        <Card
          className={`min-w-0 ${DASH_RADIUS_CARD} ${DASH_BORDER} ${DASH_SURFACE_CARD} shadow-sm`}
        >
          <CardHeader className="pb-2.5">
            <CardTitle className="text-base font-medium text-foreground">
              Your main platforms
            </CardTitle>{' '}
          </CardHeader>
          <CardContent className="space-y-2">
            {allPlatforms.length === 0 ? (
              <p className="text-sm text-muted-foreground">No platform activity yet.</p>
            ) : (
              <>
                <div className="overflow-x-auto rounded-lg border border-border/35 bg-muted/[0.08] px-2 py-2">
                  <ChartContainer
                    config={PLATFORM_CHART_CONFIG}
                    className="h-[224px] w-full"
                    style={{ minWidth: `${platformChartMinWidth}px` }}
                  >
                    <BarChart
                      data={platformChartData}
                      margin={{ top: 4, right: 4, left: 0, bottom: 2 }}
                    >
                      <CartesianGrid
                        vertical={false}
                        strokeDasharray="2 4"
                        stroke="hsl(var(--border))"
                        strokeOpacity={0.35}
                      />
                      <XAxis
                        dataKey="platform"
                        type="category"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={4}
                        tick={{ fontSize: 11 }}
                        tickFormatter={formatPlatformTick}
                      />
                      <YAxis
                        type="number"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={4}
                        tick={{ fontSize: 11 }}
                      />
                      <ChartLegend
                        verticalAlign="top"
                        align="right"
                        height={22}
                        content={
                          <ChartLegendContent className="justify-end gap-2 pb-1 pt-0 text-[11px] text-muted-foreground/85" />
                        }
                      />
                      <Tooltip
                        cursor={{ fill: 'hsl(var(--muted))' }}
                        content={
                          <ChartTooltipContent
                            formatter={(value, name, item) => {
                              const payload = item.payload as {
                                total?: number;
                                completionRate?: number;
                              };
                              const metric = String(name ?? '');
                              const prettyName = metric === 'dropped' ? 'Dropped' : 'Completed';
                              return `${prettyName}: ${value} (total ${payload.total ?? 0}, ${payload.completionRate ?? 0}%)`;
                            }}
                          />
                        }
                      />
                      <Bar
                        dataKey="completed"
                        stackId="attempts"
                        fill="var(--color-completed)"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar dataKey="dropped" stackId="attempts" fill="var(--color-dropped)" />
                    </BarChart>
                  </ChartContainer>
                </div>
                <p className="text-xs text-muted-foreground/85">
                  Completed and dropped titles by platform.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
