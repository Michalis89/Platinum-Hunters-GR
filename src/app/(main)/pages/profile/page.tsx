'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import Skeleton from '@/app/components/ui/Skeleton';
import { ActivityFeed } from '@/app/components/activity/ActivityFeed';
import {
  ProfileHeader,
  ProfileStats,
  ProfileCategories,
  ProfileFavorites,
  ProfileCategoryInfo,
  ProfileAccountInfo,
  ProfilePersonalInfo,
  categoryMeta,
} from '@/app/components/profile';
import { selectUser, selectIsAuthenticated, selectIsLoading } from '@/store/slices/authSlice';
import {
  fetchBacklog,
  selectBacklogItems,
  selectStatusCounts,
  updateBacklogItem,
} from '@/store/slices/backlogSlice';
import type { AppDispatch } from '@/store/store';
import type { UserBacklogWithGame } from '@/types/interfaces';

type FavoriteItem = {
  id: string;
  is_favorite: boolean;
  priority: number;
  mediaId?: number;
  meta?: string;
  game: { title: string; slug: string; cover_image: string; background_image?: string };
};

const categoryLabels: Record<string, string> = {
  gaming: 'Favorite Games',
  anime: 'Favorite Anime',
  manga: 'Favorite Manga',
  books: 'Favorite Books',
  movies: 'Favorite Movies',
  tv: 'Favorite TV Series',
  coding: 'Coding',
  pet: 'Pet',
  vape: 'Vape',
};

const articleOnlyCategories = new Set(['coding', 'pet', 'vape']);

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectIsLoading);
  const userGames = useSelector(selectBacklogItems);
  const statusCounts = useSelector(selectStatusCounts);

  const [reordering, setReordering] = useState(false);
  const [mediaFavorites, setMediaFavorites] = useState<Record<string, FavoriteItem[]>>({});
  const [mediaFavoritesLoading, setMediaFavoritesLoading] = useState<Record<string, boolean>>({});
  const [mediaStats, setMediaStats] = useState<
    Record<string, { total: number; completed: number; current: number; planned: number; dropped: number; favorites: number }>
  >({});

  // Compute total hours
  const totalHours = useMemo(
    () =>
      Math.round(
        userGames.reduce(
          (sum, g) => sum + (g.actual_hours_casual || 0) + (g.actual_hours_platinum || 0),
          0
        )
      ),
    [userGames]
  );

  // Get gaming meta helper
  const getGamingMeta = (item: UserBacklogWithGame) => {
    const statusLabels: Record<UserBacklogWithGame['status'], string> = {
      to_play: 'Backlog',
      playing: 'Παίζω',
      completed: 'Ολοκληρωμένο',
      platinumed: 'Platinum',
      dropped: 'Dropped',
    };
    const hours = (item.actual_hours_casual ?? 0) + (item.actual_hours_platinum ?? 0);
    const hoursLabel = hours > 0 ? ` • ${Math.round(hours)}h` : '';
    return `${statusLabels[item.status]}${hoursLabel}`;
  };

  // Gaming favorites
  const gamingFavorites = useMemo(() => {
    return [...userGames]
      .filter((item) => item.is_favorite)
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
      .slice(0, 5)
      .map((item) => ({
        id: String(item.id),
        is_favorite: Boolean(item.is_favorite),
        priority: item.priority ?? 0,
        game: {
          title: item.game?.title || '—',
          slug: item.game?.slug || '',
          cover_image: item.game?.cover_image || '/og-image.png',
          background_image: item.game?.background_image,
        },
        meta: getGamingMeta(item),
      }));
  }, [userGames]);

  // User categories
  const role = user?.role ?? 'user';
  const categories = useMemo(
    () => (user?.categories as string[] | undefined) ?? ['gaming'],
    [user]
  );
  const isPrivileged = role === 'admin' || role === 'author';

  // Showcase categories (all categories user has access to)
  const showcaseCategories = useMemo(
    () =>
      ['gaming', 'anime', 'manga', 'books', 'movies', 'tv', 'coding', 'pet', 'vape'].filter(
        (cat) => isPrivileged || categories.includes(cat)
      ),
    [categories, isPrivileged]
  );

  // Favorite categories (categories that support favorites)
  const favoriteCategories = useMemo(
    () => showcaseCategories.filter((cat) => cat === 'gaming' || isPrivileged),
    [showcaseCategories, isPrivileged]
  );

  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Set initial active category
  useEffect(() => {
    if (favoriteCategories.length > 0 && !activeCategory) {
      setActiveCategory(favoriteCategories[0]);
    }
  }, [favoriteCategories, activeCategory]);

  // Fetch backlog
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchBacklog({}));
    }
  }, [isAuthenticated, dispatch]);

  // Fetch media favorites
  useEffect(() => {
    if (!isAuthenticated) return;
    let ignore = false;

    const loadMediaFavorites = async (category: 'anime' | 'manga' | 'movies' | 'tv' | 'books') => {
      setMediaFavoritesLoading((prev) => ({ ...prev, [category]: true }));
      try {
        const base =
          category === 'anime' || category === 'manga'
            ? '/api/anime/library'
            : category === 'movies' || category === 'tv'
              ? '/api/movies/library'
              : category === 'books'
                ? '/api/books/library'
                : null;
        if (!base) throw new Error('Missing favorites endpoint');

        const response = await fetch(`${base}?category=${category}`);
        if (!response.ok) throw new Error('Favorites fetch failed');

        const data = await response.json();
        const items = Array.isArray(data.items) ? data.items : [];

        // Compute stats from all items
        const stats = {
          total: items.length,
          completed: items.filter((item: { status?: string }) => item.status === 'completed').length,
          current: items.filter((item: { status?: string }) => item.status === 'current').length,
          planned: items.filter((item: { status?: string }) => item.status === 'planned').length,
          dropped: items.filter((item: { status?: string }) => item.status === 'dropped').length,
          favorites: items.filter((item: { isFavorite?: boolean }) => item.isFavorite).length,
        };

        const favorites: FavoriteItem[] = items
          .filter((item: { isFavorite?: boolean }) => item.isFavorite)
          .map(
            (
              item: {
                entryId?: number;
                mediaId?: number;
                id?: string;
                title?: string;
                subtitle?: string;
                year?: string;
                cover?: string;
                priority?: number;
                format?: string;
                totalRuntime?: number;
                totalEpisodes?: number;
                score?: string;
              },
              idx: number
            ) => ({
              id: String(item.entryId ?? item.mediaId ?? item.id ?? `${category}-${idx}`),
              is_favorite: true,
              priority: item.priority ?? (items.length - idx) * 10,
              mediaId: item.mediaId,
              meta: [
                item.year,
                item.format?.toUpperCase(),
                item.totalRuntime ? `${item.totalRuntime} min` : null,
                item.totalEpisodes ? `${item.totalEpisodes} eps` : null,
                item.score ? `Score ${item.score}` : null,
              ]
                .filter(Boolean)
                .join(' • '),
              game: {
                title: item.title || '—',
                slug: item.subtitle || item.year || '',
                cover_image: item.cover || '/og-image.png',
              },
            })
          );

        if (!ignore) {
          setMediaStats((prev) => ({ ...prev, [category]: stats }));
          setMediaFavorites((prev) => ({
            ...prev,
            [category]: favorites.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)),
          }));
        }
      } catch (error) {
        console.warn('Favorites fetch failed:', error);
        if (!ignore) {
          setMediaFavorites((prev) => ({ ...prev, [category]: [] }));
        }
      } finally {
        if (!ignore) {
          setMediaFavoritesLoading((prev) => ({ ...prev, [category]: false }));
        }
      }
    };

    (['anime', 'manga', 'movies', 'tv', 'books'] as const).forEach((category) => {
      loadMediaFavorites(category);
    });

    return () => {
      ignore = true;
    };
  }, [isAuthenticated]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/pages/auth/login');
    }
  }, [loading, isAuthenticated, router]);

  // Get favorites for category
  const getFavoritesForCategory = (cat: string): FavoriteItem[] => {
    if (cat === 'gaming') return gamingFavorites;
    return mediaFavorites[cat] ?? [];
  };

  // Handle gaming favorites reorder
  const handleGamingReorder = async (sourceIndex: number | null, targetIndex: number) => {
    if (reordering || sourceIndex === null || sourceIndex === targetIndex) return;
    setReordering(true);

    const nextOrder = [...gamingFavorites];
    const [moved] = nextOrder.splice(sourceIndex, 1);
    nextOrder.splice(targetIndex, 0, moved);

    const updates = nextOrder.map((item, idx) => ({
      id: Number(item.id),
      priority: (nextOrder.length - idx) * 10,
    }));

    try {
      await Promise.all(
        updates.map((u) => dispatch(updateBacklogItem({ id: u.id, priority: u.priority })).unwrap())
      );
    } catch (err) {
      console.error('Reorder favorites failed:', err);
    }

    setReordering(false);
  };

  // Handle media favorites reorder
  const handleMediaReorder = async (
    category: string,
    sourceIndex: number | null,
    targetIndex: number
  ) => {
    if (reordering || sourceIndex === null || sourceIndex === targetIndex) return;
    setReordering(true);

    const nextOrder = [...(mediaFavorites[category] ?? [])];
    const [moved] = nextOrder.splice(sourceIndex, 1);
    nextOrder.splice(targetIndex, 0, moved);
    setMediaFavorites((prev) => ({ ...prev, [category]: nextOrder }));

    const updates = nextOrder.map((item, idx) => ({
      mediaId: item.mediaId,
      priority: (nextOrder.length - idx) * 10,
    }));

    try {
      const endpoint =
        category === 'anime' || category === 'manga'
          ? '/api/anime/library'
          : category === 'movies' || category === 'tv'
            ? '/api/movies/library'
            : category === 'books'
              ? '/api/books/library'
              : null;

      if (endpoint) {
        await Promise.all(
          updates.map((u) =>
            u.mediaId
              ? fetch(endpoint, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ mediaId: u.mediaId, priority: u.priority }),
                })
              : Promise.resolve()
          )
        );
      }
    } catch (err) {
      console.error('Reorder favorites failed:', err);
    }

    setReordering(false);
  };

  // Get category notes
  const categoryNotes = useMemo(() => {
    return (
      ((user?.social_links as Record<string, unknown> | undefined)?.category_notes as
        | Record<string, unknown>
        | undefined) || {}
    );
  }, [user]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--hb-bg)]">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <Skeleton type="profile" />
        </div>
      </div>
    );
  }

  // No user (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-[var(--hb-bg)] text-[var(--hb-text)]">
      {/* Background gradient (like About page) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-70">
        <div className="absolute inset-0 bg-[var(--hb-gradient)] blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative">
        {/* Profile Header (Hero-style) */}
        <ProfileHeader user={user} />

        {/* Personal Info Section */}
        <ProfilePersonalInfo user={user} />

        {/* Categories Navigation */}
        {showcaseCategories.length > 0 && (
          <ProfileCategories
            categories={showcaseCategories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        )}

        {/* Dynamic Stats based on active category */}
        {activeCategory && ['gaming', 'anime', 'manga', 'movies', 'tv', 'books'].includes(activeCategory) && (
          <ProfileStats
            category={activeCategory}
            gamingStats={activeCategory === 'gaming' ? statusCounts : undefined}
            totalHours={activeCategory === 'gaming' ? totalHours : undefined}
            mediaStats={activeCategory !== 'gaming' ? mediaStats[activeCategory] : undefined}
          />
        )}

        {/* Favorites + Category Info Section */}
        {activeCategory && favoriteCategories.includes(activeCategory) && (
          <section className="px-4 py-12 md:px-6 md:py-16">
            <div className="mx-auto max-w-6xl">
              <div className="mb-8 text-center">
                <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[var(--hb-primary-strong)]">
                  {categoryMeta[activeCategory]?.title || 'Κατηγορία'}
                </p>
                <h2 className="text-2xl font-bold text-[var(--hb-headline)] md:text-3xl">
                  {categoryLabels[activeCategory] || 'Favorites'}
                </h2>
              </div>

              <div className="grid gap-8 lg:grid-cols-2">
                {/* Favorites List */}
                <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 shadow-[0_12px_30px_rgba(3,7,18,0.35)]">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--hb-muted)]">
                    Top {categoryLabels[activeCategory]}
                  </h3>
                  <ProfileFavorites
                    favorites={getFavoritesForCategory(activeCategory)}
                    category={activeCategory}
                    categoryLabel={categoryLabels[activeCategory]}
                    isLoading={
                      activeCategory !== 'gaming' && mediaFavoritesLoading[activeCategory]
                    }
                    isArticleOnly={articleOnlyCategories.has(activeCategory)}
                    onReorder={(source, target) => {
                      if (activeCategory === 'gaming') {
                        handleGamingReorder(source, target);
                      } else {
                        handleMediaReorder(activeCategory, source, target);
                      }
                    }}
                  />
                </div>

                {/* Category Info */}
                <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 shadow-[0_12px_30px_rgba(3,7,18,0.35)]">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--hb-muted)]">
                    Πληροφορίες Κατηγορίας
                  </h3>
                  <ProfileCategoryInfo
                    category={activeCategory}
                    user={user}
                    categoryNotes={categoryNotes}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Activity Feed */}
        <section className="px-4 py-12 md:px-6 md:py-16">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 text-center">
              <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[var(--hb-primary-strong)]">
                Δραστηριότητα
              </p>
              <h2 className="text-2xl font-bold text-[var(--hb-headline)] md:text-3xl">
                Οι ενέργειές μου
              </h2>
            </div>
            <ActivityFeed scope="me" limit={30} compact />
          </div>
        </section>

        {/* Account Info */}
        <ProfileAccountInfo user={user} />
      </div>
    </div>
  );
}
