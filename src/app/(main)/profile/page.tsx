import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import ProfilePageClient from './ProfilePageClient';

function ProfilePageShellSkeleton() {
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
  return (
    <Suspense fallback={<ProfilePageShellSkeleton />}>
      <ProfilePageClient />
    </Suspense>
  );
}
