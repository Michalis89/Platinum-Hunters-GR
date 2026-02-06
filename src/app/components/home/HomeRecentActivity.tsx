'use client';

import dynamic from 'next/dynamic';
import { Clock } from 'lucide-react';

// Lazy load ActivityFeed with skeleton fallback
const ActivityFeed = dynamic(
  () => import('../activity/ActivityFeed').then(mod => ({ default: mod.ActivityFeed })),
  {
    loading: () => <ActivityFeedSkeleton />,
    ssr: false, // Don't SSR since it fetches user-specific data
  },
);

// Skeleton that matches ActivityFeed layout
function ActivityFeedSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="h-5 w-40 rounded bg-white/10" />
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-[var(--hb-muted)]" />
          <div className="h-3 w-8 rounded bg-white/10" />
        </div>
      </div>

      <div className="space-y-3" style={{ maxHeight: '380px' }}>
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 rounded-xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-3"
          >
            <div className="mt-0.5 h-4 w-4 rounded bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-4/5 rounded bg-white/10" />
              <div className="h-3 w-16 rounded bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type HomeRecentActivityProps = {
  scope?: 'global' | 'me';
};

export function HomeRecentActivity({ scope = 'global' }: HomeRecentActivityProps) {
  return (
    <section className="px-4 py-8 md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--hb-border)] px-6 py-5">
            <h2 className="text-lg font-semibold text-[var(--hb-headline)]">
              {scope === 'me' ? 'Η δραστηριότητά μου' : 'Πρόσφατη δραστηριότητα'}
            </h2>
          </div>
          <div className="px-6 pb-6 pt-4">
            <ActivityFeed scope={scope} limit={15} height={380} compact />
          </div>
        </div>
      </div>
    </section>
  );
}
