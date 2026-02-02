'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import { selectIsAuthenticated, selectUser, selectIsLoading } from '@/store/slices/authSlice';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';
import Skeleton from '@/app/components/ui/Skeleton';
import CategoryLibrary from '@/app/components/backlog/CategoryLibrary';
import {
  isMediaCategory,
  type MediaCategory,
  type MediaStatus,
} from '@/app/components/backlog/types';

function BacklogFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--hb-bg)]">
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

  // Prevent hydration mismatch by tracking client mount
  const [hasMounted, setHasMounted] = useState(false);

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

  // Check if user has access to this category
  const userCategories = (user?.categories as string[] | undefined) ?? [];
  const hasAccessToCategory =
    userCategories.length === 0 || userCategories.includes(category);

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
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--hb-bg)] px-4 text-center">
        <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-8 shadow-lg">
          <div className="mb-4 text-6xl">🚫</div>
          <h2 className="mb-2 text-xl font-bold text-[var(--hb-headline)]">
            Δεν έχεις πρόσβαση σε αυτή την κατηγορία
          </h2>
          <p className="mb-6 text-[var(--hb-muted)]">
            Για να δεις το{' '}
            <strong className="text-[var(--hb-headline)]">{category}</strong> backlog, πρέπει
            πρώτα να ενεργοποιήσεις αυτή την κατηγορία στο προφίλ σου.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => router.push('/pages/profile/edit')}
              className="rounded-full bg-[var(--hb-primary-strong)] px-6 py-2 font-medium text-white transition hover:bg-[var(--hb-primary)]"
            >
              Ρυθμίσεις Προφίλ
            </button>
            <button
              onClick={() => router.push('/pages/hobbies')}
              className="rounded-full border border-[var(--hb-border)] px-6 py-2 font-medium text-[var(--hb-text)] transition hover:bg-white/5"
            >
              Πίσω στο Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CategoryLibrary
      category={category}
      username={user?.username}
      initialStatus={statusFromParams}
      initialSearch={searchFromParams}
    />
  );
}
