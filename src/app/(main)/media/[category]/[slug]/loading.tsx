import { Skeleton } from '@/components/ui/skeleton';

export default function MediaDetailLoading() {
  return (
    <div className="space-y-6 px-4 py-6 md:px-6 md:py-8">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-[320px] w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}
