'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';
import CategoryLibrary from '@/app/components/backlog/CategoryLibrary';
import { isMediaCategory, type MediaCategory, type MediaStatus } from '@/app/components/backlog/types';

function BacklogFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner className="size-8" />
    </div>
  );
}

function BacklogSkeleton() {
  return (
    <div className="pb-10 pt-6 md:pb-16 md:pt-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 md:px-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-[32px]" />
        ))}
      </div>
    </div>
  );
}

interface PublicBacklogClientProps {
  userId: string;
  username: string;
  defaultCategory: MediaCategory;
  canToggleFavorite?: boolean;
  shareToken?: string;
}

export default function PublicBacklogClient({
  userId,
  username,
  defaultCategory,
  canToggleFavorite = false,
  shareToken,
}: Readonly<PublicBacklogClientProps>) {
  return (
    <Suspense fallback={<BacklogFallback />}>
      <PublicBacklogContent
        userId={userId}
        username={username}
        defaultCategory={defaultCategory}
        canToggleFavorite={canToggleFavorite}
        shareToken={shareToken}
      />
    </Suspense>
  );
}

function PublicBacklogContent({
  userId,
  username,
  defaultCategory,
  canToggleFavorite = false,
  shareToken,
}: Readonly<PublicBacklogClientProps>) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const categoryParam = searchParams.get('category');
  const statusParam = searchParams.get('status');
  const searchParam = searchParams.get('search');

  const category: MediaCategory = isMediaCategory(categoryParam) ? categoryParam : defaultCategory;

  const statusLookup: Record<string, MediaStatus | 'all'> = {
    all: 'all',
    current: 'current',
    planned: 'planned',
    completed: 'completed',
    dropped: 'dropped',
  };
  const normalizedStatus = statusParam?.toLowerCase();
  const statusFromParams = normalizedStatus ? statusLookup[normalizedStatus] : undefined;
  const searchFromParams = searchParam?.trim() ?? undefined;

  return (
    <CategoryLibrary
      key={category}
      category={category}
      username={username}
      initialStatus={statusFromParams}
      initialSearch={searchFromParams}
      isReadOnly
      canToggleFavorite={canToggleFavorite}
      publicUserId={userId}
      shareToken={shareToken}
    />
  );
}
