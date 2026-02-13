'use client';

import dynamic from 'next/dynamic';
import { Clock } from 'lucide-react';

const ActivityFeed = dynamic(
  () => import('../activity/ActivityFeed').then(mod => ({ default: mod.ActivityFeed })),
  {
    loading: () => <ActivityFeedSkeleton />,
    ssr: false,
  },
);

function ActivityFeedSkeleton() {
  return (
    <div className="animate-pulse p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="h-5 w-40 rounded bg-white/10" />
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          <div className="h-3 w-8 rounded bg-white/10" />
        </div>
      </div>

      <div className="space-y-3" style={{ maxHeight: '380px' }}>
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="flex items-start gap-3 rounded-xl border bg-card p-3">
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
    <section className="px-4 py-10 md:px-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">
            {scope === 'me' ? 'My activity' : 'Recent activity'}
          </h2>
          <p className="text-sm">Live updates from the community&apos;s most recent actions.</p>
        </div>
        <ActivityFeed scope={scope} limit={15} height={380} compact />
      </div>
    </section>
  );
}
