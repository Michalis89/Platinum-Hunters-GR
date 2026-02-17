'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { selectUser } from '@/store/slices/authSlice';
import { Spinner } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';
import CategoryLibrary from '@/app/components/backlog/CategoryLibrary';
import { Button } from '@/components/ui/button';
import {
  isMediaCategory,
  type MediaCategory,
  type MediaStatus,
} from '@/app/components/backlog/types';

function BacklogFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="size-8" />
    </div>
  );
}

function BacklogPageSkeleton() {
  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={`backlog-skeleton-${index}`} className="h-28 w-full rounded-[32px]" />
        ))}
      </div>
    </div>
  );
}

export default function BacklogPageClient() {
  return (
    <Suspense fallback={<BacklogFallback />}>
      <BacklogPageContent />
    </Suspense>
  );
}

function BacklogPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const statusParam = searchParams.get('status');
  const searchParam = searchParams.get('search');
  const malParam = searchParams.get('mal');

  // Prevent hydration mismatch by tracking client mount
  const [hasMounted, setHasMounted] = useState(false);
  const [libraryReloadKey, setLibraryReloadKey] = useState(0);
  const hasTriggeredMalSyncRef = useRef(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Default to 'games' if no category specified
  const category: MediaCategory = isMediaCategory(categoryParam) ? categoryParam : 'games';
  const normalizedStatus = statusParam?.toLowerCase();
  const statusLookup: Record<string, MediaStatus | 'all'> = {
    all: 'all',
    current: 'current',
    planned: 'planned',
    completed: 'completed',
    dropped: 'dropped',
  };
  const statusFromParams = normalizedStatus ? statusLookup[normalizedStatus] : undefined;
  const searchFromParams = searchParam?.trim() ?? undefined;

  const user = useSelector(selectUser);
  // Middleware ensures only authenticated users reach this page

  useEffect(() => {
    if (hasTriggeredMalSyncRef.current) {
      return;
    }
    if (!hasMounted || !user) {
      return;
    }
    if ((category !== 'anime' && category !== 'manga') || malParam !== 'success') {
      return;
    }

    hasTriggeredMalSyncRef.current = true;

    let isCancelled = false;
    const params = new URLSearchParams(searchParams.toString());
    params.delete('mal');
    params.delete('mal_reason');
    params.delete('mal_token_error');
    const nextPath = params.toString() ? `/backlog?${params.toString()}` : '/backlog';

    const runSync = async () => {
      try {
        const response = await fetch(`/api/integrations/mal/sync?category=${category}`, {
          method: 'POST',
        });
        if (response.ok) {
          setLibraryReloadKey(prev => prev + 1);
        }
      } catch (error) {
        console.error('Auto MAL sync failed:', error);
      } finally {
        if (!isCancelled) {
          router.replace(nextPath);
        }
      }
    };

    void runSync();

    return () => {
      isCancelled = true;
    };
  }, [category, hasMounted, user, malParam, router, searchParams]);

  // Check if user has access to this category
  const userCategories = user?.category_profile
    ? Object.keys(user.category_profile).filter(key => key && typeof key === 'string')
    : [];
  const hasAccessToCategory = userCategories.length === 0 || userCategories.includes(category);

  // Show skeleton before client mount (prevents hydration mismatch) or while user loads
  if (!hasMounted || !user) {
    return <BacklogPageSkeleton />;
  }

  // Show access denied if user doesn't have this category enabled
  if (!hasAccessToCategory) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-xl p-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#ff3b30]/15 text-[#ff3b30]">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-2xl font-semibold text-foreground">
            You do not have access to this category
          </h2>
          <p className="mb-6 text-[15px] text-muted-foreground">
            To view the <strong className="text-foreground">{category}</strong> backlog, enable this
            category in your profile first.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              variant={'primary'}
              onClick={() => router.push('/profile/edit')}
              className="h-11 rounded-[12px]"
            >
              Profile Settings
            </Button>
            <Button
              variant={'secondary'}
              onClick={() => router.push('/backlog')}
              className="h-11 rounded-[12px]"
            >
              Back to Backlog
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CategoryLibrary
      key={`${category}-${libraryReloadKey}`}
      category={category}
      username={user?.username}
      steamId={category === 'games' ? user?.category_profile?.games?.steam_id : undefined}
      initialStatus={statusFromParams}
      initialSearch={searchFromParams}
    />
  );
}
