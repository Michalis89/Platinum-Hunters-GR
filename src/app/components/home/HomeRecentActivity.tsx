import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ActivityFeed } from '../activity/ActivityFeed';

type HomeRecentActivityProps = {
  scope?: 'global' | 'me';
};

export function HomeRecentActivity({ scope = 'global' }: HomeRecentActivityProps) {
  return (
    <section className="px-4 py-8 md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--hb-headline)]">
            {scope === 'me' ? 'Η δραστηριότητά μου' : 'Πρόσφατη δραστηριότητα'}
          </h2>
          <Link
            href="/pages/profile"
            className="group flex items-center gap-1 text-sm text-[var(--hb-primary-strong)] transition hover:text-[var(--hb-accent)]"
          >
            Δες περισσότερα
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <ActivityFeed
          scope={scope}
          limit={15}
          height={380}
          compact
        />
      </div>
    </section>
  );
}
