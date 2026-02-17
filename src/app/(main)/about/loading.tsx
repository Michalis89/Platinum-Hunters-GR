import { Skeleton } from '@/components/ui/skeleton';

export default function AboutLoading() {
  return (
    <div className="space-y-5 px-4 py-6 md:px-6 md:py-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-10/12" />
      <Skeleton className="h-4 w-9/12" />
    </div>
  );
}
