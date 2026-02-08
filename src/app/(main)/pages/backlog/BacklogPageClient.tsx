'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { selectIsAuthenticated, selectUser, selectIsLoading } from '@/store/slices/authSlice';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';
import Skeleton from '@/app/components/ui/Skeleton';
import CategoryLibrary from '@/app/components/backlog/CategoryLibrary';
import { Button } from '@/components/ui/button';
import {
  isMediaCategory,
  type MediaCategory,
  type MediaStatus,
} from '@/app/components/backlog/types';

function BacklogFallback() {
  return (
    <div className="apple-page-background flex min-h-screen items-center justify-center">
      <LoadingSpinner size="lg" />
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

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const isAuthLoading = useSelector(selectIsLoading);

  // Check authentication - wait for auth to initialize before redirecting
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/pages/auth/login');
    }
  }, [isAuthenticated, isAuthLoading, router]);

  useEffect(() => {
    if (hasTriggeredMalSyncRef.current) {
      return;
    }
    if (!hasMounted || isAuthLoading || !isAuthenticated) {
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
    const nextPath = params.toString() ? `/pages/backlog?${params.toString()}` : '/pages/backlog';

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
  }, [category, hasMounted, isAuthLoading, isAuthenticated, malParam, router, searchParams]);

  // Check if user has access to this category
  const userCategories = (user?.categories as string[] | undefined) ?? [];
  const hasAccessToCategory = userCategories.length === 0 || userCategories.includes(category);

  // Show skeleton while auth initializes or before client mount (prevents hydration mismatch)
  if (!hasMounted || isAuthLoading) {
    return <Skeleton type="backlog" />;
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  // Show access denied if user doesn't have this category enabled
  if (!hasAccessToCategory) {
    return (
      <div className="apple-page-background flex min-h-screen flex-col items-center justify-center px-4">
        <div className="apple-material-surface w-full max-w-xl p-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#ff3b30]/15 text-[#ff3b30]">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="apple-title-tracking mb-2 text-2xl font-semibold text-[var(--apple-label)]">
            Δεν έχεις πρόσβαση σε αυτή την κατηγορία
          </h2>
          <p className="apple-body-tracking mb-6 text-[15px] text-[var(--apple-secondary-label)]">
            Για να δεις το <strong className="text-[var(--apple-label)]">{category}</strong> backlog,
            πρέπει πρώτα να ενεργοποιήσεις αυτή την κατηγορία στο προφίλ σου.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              variant={'primary'}
              onClick={() => router.push('/pages/profile/edit')}
              className="h-11 rounded-[12px]"
            >
              Ρυθμίσεις Προφίλ
            </Button>
            <Button
              variant={'secondary'}
              onClick={() => router.push('/pages/hobbies')}
              className="h-11 rounded-[12px]"
            >
              Πίσω στο Dashboard
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
      steamId={user?.steam_id}
      initialStatus={statusFromParams}
      initialSearch={searchFromParams}
    />
  );
}
