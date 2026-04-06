import { Skeleton } from '@/components/ui/skeleton';

export function ProfileEditSkeleton() {
  return (
    <div>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-16">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-2/3 rounded-full" />
            <Skeleton className="h-4 w-1/2 rounded-full" />
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`profile-edit-skeleton-${index}`} className="h-12 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  );
}
