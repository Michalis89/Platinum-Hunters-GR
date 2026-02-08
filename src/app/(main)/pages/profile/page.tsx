'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
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
import { hasAnyRole } from '@/lib/roles';

type FavoriteItem = {
  id: string;
  is_favorite: boolean;
  priority: number;
  mediaId?: number;
  meta?: string;
  game: { title: string; slug: string; cover_image: string; background_image?: string };
};

const categoryLabels: Record<string, string> = {
  games: 'Favorite Games',
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
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectIsLoading);

  const [reordering, setReordering] = useState(false);
  const [mediaFavorites, setMediaFavorites] = useState<Record<string, FavoriteItem[]>>({});
  const [mediaFavoritesLoading, setMediaFavoritesLoading] = useState<Record<string, boolean>>({});
  const [mediaStats, setMediaStats] = useState<
    Record<
      string,
      {
        total: number;
        completed: number;
        current: number;
        planned: number;
        dropped: number;
        favorites: number;
        totalTime?: number;
      }
    >
  >({});
  const [categoryTimes, setCategoryTimes] = useState<Record<string, number>>({});
  const [, startTransition] = useTransition();

  // User categories
  const categories = useMemo(() => (user?.categories as string[] | undefined) ?? ['games'], [user]);
  const isPrivileged = hasAnyRole(user, ['admin', 'owner', 'author', 'reviewer']);

  // Showcase categories (all categories user has access to)
  const showcaseCategories = useMemo(
    () =>
      ['games', 'anime', 'manga', 'books', 'movies', 'tv', 'coding', 'pet', 'vape'].filter(
        cat => isPrivileged || categories.includes(cat),
      ),
    [categories, isPrivileged],
  );

  // Favorite categories (categories that support favorites)
  const favoriteCategories = useMemo(
    () => showcaseCategories.filter(cat => cat === 'games' || isPrivileged),
    [showcaseCategories, isPrivileged],
  );

  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Set initial active category
  useEffect(() => {
    if (favoriteCategories.length > 0 && !activeCategory) {
      startTransition(() => {
        setActiveCategory(favoriteCategories[0]);
      });
    }
  }, [favoriteCategories, activeCategory, startTransition]);

  // Fetch media favorites (including games)
  useEffect(() => {
    if (!isAuthenticated) return;
    let ignore = false;

    const loadMediaFavorites = async (
      category: 'anime' | 'manga' | 'movies' | 'tv' | 'books' | 'games',
    ) => {
      setMediaFavoritesLoading(prev => ({ ...prev, [category]: true }));
      try {
        const base =
          category === 'games'
            ? '/api/games/library'
            : category === 'anime' || category === 'manga'
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
          completed: items.filter((item: { status?: string }) => item.status === 'completed')
            .length,
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
              idx: number,
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
            }),
          );

        if (!ignore) {
          startTransition(() => {
            setMediaStats(prev => ({ ...prev, [category]: stats }));
            setMediaFavorites(prev => ({
              ...prev,
              [category]: favorites.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)),
            }));
          });
        }
      } catch (error) {
        console.warn('Favorites fetch failed:', error);
        if (!ignore) {
          startTransition(() => {
            setMediaFavorites(prev => ({ ...prev, [category]: [] }));
          });
        }
      } finally {
        if (!ignore) {
          startTransition(() => {
            setMediaFavoritesLoading(prev => ({ ...prev, [category]: false }));
          });
        }
      }
    };

    (['games', 'anime', 'manga', 'movies', 'tv', 'books'] as const).forEach(category => {
      loadMediaFavorites(category);
    });

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, startTransition]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let ignore = false;

    const loadCategoryTimes = async () => {
      try {
        const response = await fetch('/api/user/stats');
        if (!response.ok) {
          throw new Error('Failed to load user stats');
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload = (await response.json()) as { data?: { [key: string]: any } };
        const data = payload.data;
        if (!data || ignore) return;

        startTransition(() => {
          setCategoryTimes({
            games: data.games?.hours ?? 0,
            anime: data.anime?.hours ?? 0,
            manga: data.manga?.hours ?? 0,
            movies: data.movies?.hours ?? 0,
            tv: data.tv?.hours ?? 0,
            books: data.books?.hours ?? 0,
          });
        });
      } catch (error) {
        console.warn('User stats time fetch failed:', error);
      }
    };

    loadCategoryTimes();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, startTransition]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/pages/auth/login');
    }
  }, [loading, isAuthenticated, router]);

  const getFavoritesForCategory = (cat: string): FavoriteItem[] => {
    return mediaFavorites[cat] ?? [];
  };

  const handleGamingReorder = async (sourceIndex: number | null, targetIndex: number) => {
    if (reordering || sourceIndex === null || sourceIndex === targetIndex) return;
    setReordering(true);

    const nextOrder = [...(mediaFavorites['games'] ?? [])];
    const [moved] = nextOrder.splice(sourceIndex, 1);
    nextOrder.splice(targetIndex, 0, moved);
    setMediaFavorites(prev => ({ ...prev, games: nextOrder }));

    const updates = nextOrder.map((item, idx) => ({
      mediaId: item.mediaId,
      priority: (nextOrder.length - idx) * 10,
    }));

    try {
      await Promise.all(
        updates.map(u =>
          u.mediaId
            ? fetch('/api/games/library', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mediaId: u.mediaId, priority: u.priority }),
              })
            : Promise.resolve(),
        ),
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
    targetIndex: number,
  ) => {
    if (reordering || sourceIndex === null || sourceIndex === targetIndex) return;
    setReordering(true);

    const nextOrder = [...(mediaFavorites[category] ?? [])];
    const [moved] = nextOrder.splice(sourceIndex, 1);
    nextOrder.splice(targetIndex, 0, moved);
    setMediaFavorites(prev => ({ ...prev, [category]: nextOrder }));

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
          updates.map(u =>
            u.mediaId
              ? fetch(endpoint, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ mediaId: u.mediaId, priority: u.priority }),
                })
              : Promise.resolve(),
          ),
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
      <div className="apple-page-background min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-16 md:px-6">
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
    <div className="apple-page-background min-h-screen text-[var(--apple-label)]">
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
        {activeCategory &&
          ['games', 'anime', 'manga', 'movies', 'tv', 'books'].includes(activeCategory) && (
            <ProfileStats
              category={activeCategory}
              mediaStats={
                mediaStats[activeCategory]
                  ? { ...mediaStats[activeCategory], totalTime: categoryTimes[activeCategory] ?? 0 }
                  : undefined
              }
            />
          )}

        {/* Favorites + Category Info Section */}
        {activeCategory && favoriteCategories.includes(activeCategory) && (
          <section className="px-4 py-10 md:px-6 md:py-14">
            <div className="mx-auto max-w-6xl">
              <div className="mb-8 text-center md:mb-10">
                <p className="apple-secondary-label mb-2 text-[11px] font-semibold uppercase tracking-[0.22em]">
                  {categoryMeta[activeCategory]?.title || 'Κατηγορία'}
                </p>
                <h2 className="apple-title-tracking text-2xl font-semibold md:text-3xl">
                  {categoryLabels[activeCategory] || 'Favorites'}
                </h2>
              </div>

              <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
                {/* Favorites List */}
                <div className="apple-material-surface overflow-hidden p-4 sm:p-6">
                  <h3 className="apple-secondary-label mb-4 text-xs font-semibold uppercase tracking-[0.18em]">
                    Top {categoryLabels[activeCategory]}
                  </h3>
                  <ProfileFavorites
                    favorites={getFavoritesForCategory(activeCategory)}
                    category={activeCategory}
                    categoryLabel={categoryLabels[activeCategory]}
                    isLoading={mediaFavoritesLoading[activeCategory]}
                    isArticleOnly={articleOnlyCategories.has(activeCategory)}
                    onReorder={(source, target) => {
                      if (activeCategory === 'games') {
                        handleGamingReorder(source, target);
                      } else {
                        handleMediaReorder(activeCategory, source, target);
                      }
                    }}
                  />
                </div>

                {/* Category Info */}
                <div className="apple-material-surface overflow-hidden p-4 sm:p-6">
                  <h3 className="apple-secondary-label mb-4 text-xs font-semibold uppercase tracking-[0.18em]">
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
        <section className="px-4 py-12 md:px-6 md:py-14">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 text-center md:mb-10">
              <p className="apple-secondary-label mb-2 text-[11px] font-semibold uppercase tracking-[0.22em]">
                Δραστηριότητα
              </p>
              <h2 className="apple-title-tracking text-2xl font-semibold md:text-3xl">
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
