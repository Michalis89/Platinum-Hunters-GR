'use client';

import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { ChevronDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  ActivityFeed,
  type ActivityItem,
  renderActivityText,
} from '@/app/components/activity/ActivityFeed';
import {
  ProfileHeader,
  ProfileCategoryInfo,
  ProfileAccountInfo,
  ProfilePersonalInfo,
  categoryMeta,
} from '@/app/components/profile';
import { selectUser } from '@/store/slices/authSlice';
import { hasAnyRole } from '@/lib/roles';

function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-16 md:px-6">
        <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-6">
          <Skeleton className="h-24 w-24 rounded-[32px]" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-2/3 rounded-full" />
            <Skeleton className="h-4 w-1/2 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const user = useSelector(selectUser);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);

  const categories = useMemo(() => (user?.categories as string[] | undefined) ?? ['games'], [user]);
  const isPrivileged = hasAnyRole(user, ['admin', 'owner', 'author', 'reviewer']);

  const showcaseCategories = useMemo(
    () =>
      ['games', 'anime', 'manga', 'books', 'movies', 'tv', 'coding', 'pet', 'vape'].filter(
        cat => isPrivileged || categories.includes(cat),
      ),
    [categories, isPrivileged],
  );

  const categoryNotes = useMemo(() => {
    return (
      ((user?.social_links as Record<string, unknown> | undefined)?.category_notes as
        | Record<string, unknown>
        | undefined) || {}
    );
  }, [user]);

  if (!user) return <ProfilePageSkeleton />;

  const categoryCards = showcaseCategories.length ? (
    <div className="grid gap-4 md:grid-cols-2">
      {showcaseCategories.map(category => (
        <article
          key={category}
          className="rounded-2xl border border-border/60 bg-card/50 p-4 sm:p-5"
        >
          <header className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {categoryMeta[category]?.title || category}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{categoryMeta[category]?.desc || ''}</p>
          </header>

          <ProfileCategoryInfo category={category} user={user} categoryNotes={categoryNotes} />
        </article>
      ))}
    </div>
  ) : (
    <p className="text-sm text-muted-foreground">No categories selected yet.</p>
  );

  return (
    <div className="min-h-screen text-foreground">
      <div className="relative">
        <ProfileHeader user={user} />

        <ProfilePersonalInfo user={user} interestsSection={categoryCards} />

        <section className="px-4 py-12 md:px-6 md:py-14">
          <div className="mx-auto max-w-4xl">
            <Collapsible open={activityOpen} onOpenChange={setActivityOpen}>
              <div className="rounded-2xl border border-border/60 bg-card/40 p-3 sm:p-4">
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold sm:text-base">Recent activity</span>
                      <span className="inline-flex min-w-6 items-center justify-center rounded-full border border-border/70 bg-muted/35 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {activityItems.length}
                      </span>
                    </div>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 text-muted-foreground transition-transform duration-200',
                        activityOpen && 'rotate-180',
                      )}
                    />
                  </button>
                </CollapsibleTrigger>

                {!activityOpen && (
                  <div className="mt-2 rounded-xl border border-border/50 bg-card/50 px-3 py-2 text-sm text-muted-foreground">
                    {activityItems[0] ? renderActivityText(activityItems[0]) : 'No recent activity yet.'}
                  </div>
                )}

                <CollapsibleContent forceMount className="overflow-hidden">
                  <div className={cn('mt-3 border-t border-border/40 pt-3', !activityOpen && 'hidden')}>
                    <ActivityFeed
                      scope="me"
                      limit={30}
                      compact
                      showHeader={false}
                      onActivitiesChange={setActivityItems}
                    />
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </div>
        </section>

        <ProfileAccountInfo user={user} />
      </div>
    </div>
  );
}
