'use client';

import { memo, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { CategoryChartPayload, DashboardCategoryKey } from '@/lib/dashboard/category-data';

// Low-data state exists to keep the card feeling premium instead of empty, while summary stats
// surface completion/drop totals and completion rate computed from payload.health metrics.
const CHART_CONFIG = {
  completed: { color: 'var(--success)', label: 'Completed' },
  dropped: { color: 'var(--destructive)', label: 'Dropped' },
};

type CategoryInsightChartProps = {
  payload: CategoryChartPayload;
  category: DashboardCategoryKey;
};

const RANGE_OPTIONS = [
  { value: 'last-30', label: 'Last 30 days' },
  { value: 'last-90', label: 'Last 3 months' },
  { value: 'last-180', label: 'Last 6 months' },
  { value: 'all', label: 'All time' },
];

function CategoryInsightChart({ payload, category }: CategoryInsightChartProps) {
  const label =
    category === 'tv' ? 'TV' : `${category.charAt(0).toUpperCase()}${category.slice(1)}`;
  const dataPoints = useMemo(() => payload.data ?? [], [payload.data]);
  const hasEnoughData = dataPoints.length >= 5;

  const { totalCompleted, totalDropped, totalAttempts, completionRate } = useMemo(() => {
    const completed = dataPoints.reduce((sum, point) => sum + (point.completed ?? 0), 0);
    const dropped = dataPoints.reduce((sum, point) => sum + (point.dropped ?? 0), 0);
    const attempts = completed + dropped;
    const rate = attempts ? Math.round((completed / attempts) * 100) : 0;
    return {
      totalCompleted: completed,
      totalDropped: dropped,
      totalAttempts: attempts,
      completionRate: rate,
    };
  }, [dataPoints]);
  const hasMeaningfulData = totalAttempts > 0;

  if (!hasMeaningfulData) {
    return null;
  }

  const summaryLine = totalAttempts
    ? `Completion rate ${completionRate}%`
    : 'No activity recorded yet.';

  return (
    <Card className="border-border/40 bg-card/75 shadow-[0_8px_24px_-24px_rgba(0,0,0,0.85)]">
      <CardHeader className="flex flex-col gap-4 border-b border-border/35 pb-5 pt-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">Your {label} patterns</CardTitle>
            <p className="text-xs text-muted-foreground/80">Derived from your library activity.</p>
          </div>
          <div className="flex w-full max-w-[220px] md:w-auto">
            <Select defaultValue={RANGE_OPTIONS[0].value}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Last 30 days" />
              </SelectTrigger>
              <SelectContent>
                {RANGE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* TODO: Wire up the range selector so it filters dashboard insights in context. */}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge
            variant="outline"
            className="border-[var(--color-completed)] text-[var(--color-completed)]"
            style={{ backgroundColor: 'transparent' }}
          >
            Completed
          </Badge>
          <Badge
            variant="outline"
            className="border-[var(--color-dropped)] text-[var(--color-dropped)]"
            style={{ backgroundColor: 'transparent' }}
          >
            Dropped
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-5">
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/30 bg-muted/[0.06] px-3 py-2.5 text-xs text-muted-foreground/85">
          <span>{summaryLine}</span>
          {totalAttempts > 0 && (
            <>
              <Badge
                variant="outline"
                className="border-border text-muted-foreground"
                style={{ backgroundColor: 'transparent' }}
              >
                {totalCompleted.toLocaleString()} completed
              </Badge>
              <Badge
                variant="outline"
                className="border-border text-muted-foreground"
                style={{ backgroundColor: 'transparent' }}
              >
                {totalDropped.toLocaleString()} dropped
              </Badge>
            </>
          )}
        </div>
        <div className="h-[240px] rounded-xl border border-border/30 bg-muted/[0.04] p-3 md:h-[300px] md:p-4">
          {hasEnoughData ? (
            <ChartContainer config={CHART_CONFIG} className="!aspect-auto h-full w-full">
              <AreaChart data={dataPoints} margin={{ top: 10, right: 6, bottom: 6, left: 6 }}>
                <CartesianGrid stroke="var(--border)" strokeOpacity={0.2} />
                <XAxis
                  dataKey="label"
                  stroke="var(--muted-foreground)"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  padding={{ left: 6, right: 6 }}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  content={
                    <ChartTooltipContent
                      hideIndicator
                      formatter={value => (value ? `${value.toLocaleString()} entries` : '-')}
                      labelFormatter={label => `Date: ${label}`}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="var(--color-completed)"
                  fill="var(--color-completed)"
                  fillOpacity={0.35}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="dropped"
                  stroke="var(--color-dropped)"
                  fill="var(--color-dropped)"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="flex h-full flex-col items-start justify-center gap-2 rounded-2xl border border-border/40 bg-muted/10 p-5 text-left">
              <p className="text-sm font-semibold text-foreground">Not enough history yet</p>
              <p className="text-xs text-muted-foreground">
                Log a few completions or drops to unlock a trend line.
              </p>
            </div>
          )}
        </div>
        {payload.insight && (
          <div className="flex items-start gap-3 rounded-xl border border-border/35 bg-muted/[0.08] p-4 text-sm text-muted-foreground/85">
            <Sparkles className="h-4 w-4 text-muted-foreground/85" />
            <div className="flex flex-col gap-1">
              <span className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground/70">
                Insight
              </span>
              <p>{payload.insight}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default memo(CategoryInsightChart);
