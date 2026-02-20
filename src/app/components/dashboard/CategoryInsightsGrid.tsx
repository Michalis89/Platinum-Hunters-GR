'use client';

import { Bar, BarChart, CartesianGrid, Pie, PieChart, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type {
  CategoryInsightsPayload,
  DashboardCategoryKey,
  PlatformInsightPayload,
} from '@/lib/dashboard/category-data';

type CategoryInsightsGridProps = {
  category: DashboardCategoryKey;
  insights: CategoryInsightsPayload;
  platformInsight: PlatformInsightPayload | null;
};

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
  platformInsight,
}: CategoryInsightsGridProps) {
  const totalStatuses = Object.values(insights.statusCounts).reduce((sum, value) => sum + value, 0);
  const allPlatforms = platformInsight?.rows ?? [];
  const momentumDelta = insights.updatedLast30Days - insights.updatedLast7Days;
  const completedAttempts = insights.completionNumerator;
  const droppedAttempts = Math.max(0, insights.completionDenominator - completedAttempts);
  const completionPercent = insights.completionRate;
  const completionPieData =
    insights.completionDenominator > 0
      ? [
          { key: 'completed', label: 'Completed', value: completedAttempts, fill: 'var(--color-completed)' },
          { key: 'dropped', label: 'Dropped', value: droppedAttempts, fill: 'var(--color-dropped)' },
        ]
      : [{ key: 'completed', label: 'No attempts', value: 1, fill: 'hsl(var(--muted))' }];
  const platformChartData = allPlatforms.map(row => ({
    platform: row.platform,
    completed: row.completed,
    dropped: row.dropped,
    total: row.total,
    completionRate: Math.max(0, Math.min(100, row.completionRate)),
  }));
  const platformChartMinWidth = Math.max(420, platformChartData.length * 92);

  return (
    <section className="space-y-5 rounded-2xl border border-border/40 bg-muted/[0.08] p-5 md:p-6">
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/85">
          Activity Insights
        </p>
        <h3 className="text-base font-semibold">Your {CATEGORY_LABELS[category]} patterns</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/40 bg-card/75">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
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
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground/90">
              {STATUS_META.map(status => (
                <div key={status.key} className="flex items-center justify-between gap-2 rounded-md border border-border/30 px-2 py-1.5">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: status.color }} />
                    {status.label}
                  </span>
                  <span className="font-semibold text-foreground">{insights.statusCounts[status.key]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/75">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24">
                <ChartContainer config={COMPLETION_CHART_CONFIG} className="h-full w-full !aspect-square">
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
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-semibold text-foreground">
                  {completionPercent}%
                </div>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>
                  {completedAttempts} completed / {insights.completionDenominator} attempts
                </p>
                <p className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'hsl(var(--success))' }} />
                  Completed: {completedAttempts}
                </p>
                <p className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'hsl(var(--destructive))' }} />
                  Dropped: {droppedAttempts}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground/85">
              Based on completed + dropped entries.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/75">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Momentum</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-end justify-between">
              <p className="text-sm text-muted-foreground">Last 7 days</p>
              <p className="text-xl font-semibold">{insights.updatedLast7Days}</p>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-sm text-muted-foreground">Last 30 days</p>
              <p className="text-xl font-semibold">{insights.updatedLast30Days}</p>
            </div>
            <p className="text-xs text-muted-foreground/85">
              {momentumDelta > 0
                ? `${momentumDelta} entries were updated outside the last 7 days (but within 30 days).`
                : 'Most recent activity is concentrated in the last 7 days.'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/75">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Top Platforms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {category !== 'games' ? (
              <p className="text-sm text-muted-foreground">Available only for Games.</p>
            ) : allPlatforms.length === 0 ? (
              <p className="text-sm text-muted-foreground">No platform data yet.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <ChartContainer
                    config={PLATFORM_CHART_CONFIG}
                    className="h-[240px] w-full"
                    style={{ minWidth: `${platformChartMinWidth}px` }}
                  >
                    <BarChart data={platformChartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="platform"
                        type="category"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={6}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        type="number"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={6}
                        tick={{ fontSize: 12 }}
                      />
                      <ChartLegend content={<ChartLegendContent />} />
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
                  Stacked completed and dropped entries across all platforms.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
