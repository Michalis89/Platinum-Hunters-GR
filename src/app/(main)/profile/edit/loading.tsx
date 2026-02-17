import { Skeleton } from '@/components/ui/skeleton';

export default function ProfileEditLoading() {
  return (
    <div className="space-y-5 px-4 py-6 md:px-6 md:py-8">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-11 w-full rounded-xl" />
      <Skeleton className="h-11 w-full rounded-xl" />
      <Skeleton className="h-11 w-full rounded-xl" />
      <Skeleton className="h-44 w-full rounded-2xl" />
      <Skeleton className="h-11 w-36 rounded-xl" />
    </div>
  );
}
