'use client';

import useSWR from 'swr';
import { Activity, BookOpen, Clock3, Gamepad2, Heart, MessageSquare, Sparkles } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { ErrorAlert } from '@/components/ui/alert';
import { renderActivityText, type ActivityItem } from '@/app/components/activity/ActivityFeed';

type ActivityTimelineProps = {
  limit?: number;
};

const fetcher = (url: string) => fetch(url).then(res => res.json());

function getRelativeTime(date: string) {
  const delta = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (delta < 60) {
    return `${Math.max(1, delta)}s ago`;
  }
  const min = Math.floor(delta / 60);
  if (min < 60) {
    return `${min}m ago`;
  }
  const hrs = Math.floor(min / 60);
  if (hrs < 24) {
    return `${hrs}h ago`;
  }
  return `${Math.floor(hrs / 24)}d ago`;
}

function iconFor(type: ActivityItem['type']) {
  if (type === 'media_added' || type === 'article_created') {
    return <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />;
  }
  if (type === 'media_status' || type === 'backlog_status') {
    return <Gamepad2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />;
  }
  if (type === 'article_comment' || type === 'article_commented') {
    return <MessageSquare className="h-3.5 w-3.5 text-primary" aria-hidden="true" />;
  }
  if (type === 'article_liked' || type === 'media_favorite') {
    return <Heart className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />;
  }
  return <BookOpen className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />;
}

export function ActivityTimeline({ limit = 12 }: Readonly<ActivityTimelineProps>) {
  const { data, isLoading, error } = useSWR(`/api/activity?scope=me&limit=${limit}`, fetcher, {
    revalidateOnFocus: false,
  });

  const activities: ActivityItem[] = data?.activities ?? [];

  return (
    <section
      aria-labelledby="activity-timeline-heading"
      className="rounded-3xl border border-border/60 bg-card/50 p-5 sm:p-6"
    >
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Timeline</p>
          <h2 id="activity-timeline-heading" className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            Recent Activity
          </h2>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/70 px-2.5 py-1 text-xs text-muted-foreground">
          <Activity className="h-3.5 w-3.5" />
          {activities.length}
        </span>
      </header>

      {isLoading && (
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="size-4" />
          Loading activity...
        </div>
      )}
      {error && <ErrorAlert message="Failed to load activity." />}

      {!isLoading && !error && (
        <ol className="space-y-3">
          {activities.length > 0 ? (
            activities.map(item => (
              <li key={item.id} className="group relative pl-8">
                <span
                  aria-hidden="true"
                  className="absolute left-2.5 top-7 h-[calc(100%-0.35rem)] w-px bg-border/70"
                />
                <div className="absolute left-0 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-border/70 bg-card/85 shadow-[0_0_0_4px_hsl(var(--card))]">
                  {iconFor(item.type)}
                </div>
                <div className="rounded-xl border border-border/45 bg-card/65 p-3 transition-all duration-200 group-hover:border-primary/35 group-hover:bg-card/80">
                  <p className="text-sm text-foreground">{renderActivityText(item)}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock3 className="h-3 w-3" />
                    {getRelativeTime(item.created_at)}
                  </p>
                </div>
              </li>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No recent activity yet.</p>
          )}
        </ol>
      )}
    </section>
  );
}
