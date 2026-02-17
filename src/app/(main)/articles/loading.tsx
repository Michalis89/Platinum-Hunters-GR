import { Skeleton } from '@/components/ui/skeleton';

export default function ArticlesLoading() {
  return (
    <div className="space-y-6 px-4 py-6 md:px-6 md:py-8">
      <Skeleton className="h-8 w-52" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}
