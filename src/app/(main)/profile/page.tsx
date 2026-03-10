import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import ProfilePageClient from './ProfilePageClient';

function ProfilePageShellSkeleton() {
  return (
    <div className="px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <Skeleton className="h-56 w-full rounded-3xl" />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div className="space-y-4">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-96 w-full rounded-2xl" />
            <Skeleton className="h-56 w-full rounded-2xl" />
            <Skeleton className="h-56 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfilePageShellSkeleton />}>
      <ProfilePageClient />
    </Suspense>
  );
}
