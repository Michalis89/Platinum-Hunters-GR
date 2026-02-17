import { Skeleton } from '@/components/ui/skeleton';

export default function BacklogLoading() {
  return (
    <div className="space-y-4 px-4 py-6 md:px-6 md:py-8">
      <Skeleton className="h-9 w-48" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24 rounded-full" />
        <Skeleton className="h-10 w-24 rounded-full" />
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="space-y-3">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    </div>
  );
}
