'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSelector } from 'react-redux';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
import { Skeleton } from '@/components/ui/skeleton';
import { selectUser } from '@/store/slices/authSlice';
import { hasAnyRole } from '@/lib/roles';
import { supabase } from '@/lib/supabase-client';
import { useUserSettings } from '@/lib/settings/useUserSettings';
import { AboutSection, AccountInfo, GenreAffinity, HobbySection, ProfileHero } from '@/app/components/profile';
import { getEnabledCategories, resolveProfileIdentity } from '@/app/components/profile/profileData';
import type { MediaEntry } from '@/app/components/backlog/types';
import type { User } from '@/types/user';

const ActivityTimeline = dynamic(
  () => import('@/app/components/profile/ActivityTimeline').then(mod => mod.ActivityTimeline),
  {
    ssr: false,
    loading: () => <Skeleton className="h-64 w-full rounded-2xl" />,
  },
);

const ContentList = dynamic(
  () => import('@/app/components/profile/ContentList').then(mod => mod.ContentList),
  {
    ssr: false,
    loading: () => <Skeleton className="h-80 w-full rounded-2xl" />,
  },
);

type HeroStats = {
  articles: number | null;
  reviews: number | null;
  entries: number | null;
  lists: number | null;
};

type InsightCategory = 'movies' | 'tv' | 'books' | 'anime' | 'manga';

type ProfileFavoritesInsights = Partial<
  Record<
    InsightCategory,
    {
      directors?: string;
      actors?: string;
      authors?: string;
      favorite_studios?: string;
    }
  >
>;

type TmdbCreditsResponse = {
  directors?: string[];
  actors?: string[];
};

const parseScore = (value?: string | null) => {
  if (!value) {
    return null;
  }
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const scoreWeight = (score: number | null) => {
  if (score === null) {
    return 0;
  }
  if (score >= 10) {
    return 5;
  }
  if (score >= 9) {
    return 4;
  }
  if (score >= 8) {
    return 3;
  }
  if (score >= 7) {
    return 2;
  }
  return 0;
};

const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ');

const addWeightedNames = (target: Map<string, number>, names: string[], points: number) => {
  for (const rawName of names) {
    const name = normalizeName(rawName);
    if (!name) {
      continue;
    }
    target.set(name, (target.get(name) ?? 0) + points);
  }
};

const topNames = (source: Map<string, number>, limit = 3) =>
  Array.from(source.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name);

const buildEntryWeight = (entry: MediaEntry, withRuntimeBonus = false) => {
  if (entry.status !== 'completed') {
    return 0;
  }

  let points = 1;
  if (entry.isFavorite) {
    points += 6;
  }
  points += scoreWeight(parseScore(entry.score));

  if (withRuntimeBonus && typeof entry.totalRuntime === 'number' && entry.totalRuntime > 180) {
    points += 0.5;
  }

  return points;
};

const splitCsvNames = (value: string | undefined) =>
  (value ?? '')
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);

function MobileCollapse({
  title,
  children,
}: Readonly<{
  title: string;
  children: ReactNode;
}>) {
  return (
    <details className="group rounded-2xl border border-border/60 bg-card/35 lg:hidden" open>
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-foreground">
        {title}
      </summary>
      <div className="px-2 pb-2">{children}</div>
    </details>
  );
}

function ProfilePageSkeleton() {
  return (
    <div className="px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-64 w-full rounded-3xl" />
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 space-y-5 lg:col-span-8">
            <Skeleton className="h-[28rem] w-full rounded-2xl" />
            <Skeleton className="h-80 w-full rounded-2xl" />
            <Skeleton className="h-[32rem] w-full rounded-2xl" />
          </div>
          <div className="col-span-12 space-y-5 lg:col-span-4">
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-60 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePageClient() {
  const user = useSelector(selectUser);
  const { settings } = useUserSettings(!!user);
  const socialLayerEnabled = settings?.social_enabled ?? true;
  const isPrivileged = hasAnyRole(user, ['admin', 'owner', 'author', 'reviewer']);
  const [authUser, setAuthUser] = useState<SupabaseAuthUser | null>(null);
  const [heroStats, setHeroStats] = useState<HeroStats>({
    articles: null,
    reviews: null,
    entries: null,
    lists: null,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [favoritesInsights, setFavoritesInsights] = useState<ProfileFavoritesInsights>({});

  useEffect(() => {
    if (!user) {
      return;
    }
    let cancelled = false;
    setLoadingStats(true);
    Promise.all([
      fetch('/api/articles?author_id=me&status=published&topic=articles&limit=1').then(r =>
        r.ok ? r.json() : null,
      ),
      fetch('/api/articles?author_id=me&status=published&topic=reviews&limit=1').then(r =>
        r.ok ? r.json() : null,
      ),
    ])
      .then(([articleResult, reviewResult]) => {
        if (cancelled) {
          return;
        }
        setHeroStats({
          articles: Number(articleResult?.meta?.total ?? 0),
          reviews: Number(reviewResult?.meta?.total ?? 0),
          entries: null,
          lists: null,
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setLoadingStats(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      setAuthUser(null);
      return;
    }

    let cancelled = false;
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!cancelled) {
          setAuthUser(data.user ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAuthUser(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const categories = useMemo(
    () => getEnabledCategories(user, isPrivileged, socialLayerEnabled),
    [isPrivileged, socialLayerEnabled, user],
  );
  const categoriesKey = useMemo(() => categories.join(','), [categories]);
  const identity = useMemo(
    () => (user ? resolveProfileIdentity(user, authUser) : null),
    [authUser, user],
  );
  const categoryProfileWithInsights = useMemo(() => {
    if (!user) {
      return null;
    }
    const baseProfile = (user.category_profile ?? {}) as Record<string, unknown>;
    const nextProfile: Record<string, unknown> = { ...baseProfile };

    const mergeCategoryPatch = (categoryKey: InsightCategory, patch: Record<string, string>) => {
      const categoryBase =
        nextProfile[categoryKey] && typeof nextProfile[categoryKey] === 'object'
          ? (nextProfile[categoryKey] as Record<string, unknown>)
          : {};
      nextProfile[categoryKey] = {
        ...categoryBase,
        ...patch,
      };
    };

    const movies = favoritesInsights.movies;
    if (movies?.directors || movies?.actors) {
      mergeCategoryPatch('movies', {
        ...(movies.directors ? { directors: movies.directors } : {}),
        ...(movies.actors ? { actors: movies.actors } : {}),
      });
    }

    const tv = favoritesInsights.tv;
    if (tv?.directors || tv?.actors) {
      mergeCategoryPatch('tv', {
        ...(tv.directors ? { directors: tv.directors } : {}),
        ...(tv.actors ? { actors: tv.actors } : {}),
      });
    }

    const books = favoritesInsights.books;
    if (books?.authors) {
      mergeCategoryPatch('books', { authors: books.authors });
    }

    const anime = favoritesInsights.anime;
    if (anime?.favorite_studios) {
      mergeCategoryPatch('anime', { favorite_studios: anime.favorite_studios });
    }

    const manga = favoritesInsights.manga;
    if (manga?.authors) {
      mergeCategoryPatch('manga', { authors: manga.authors });
    }

    return nextProfile as User['category_profile'];
  }, [favoritesInsights, user]);

  useEffect(() => {
    if (!user) {
      setFavoritesInsights({});
      return;
    }

    let cancelled = false;

    const fetchLibraryEntries = async (
      endpoint: string,
      category: InsightCategory,
    ): Promise<MediaEntry[]> => {
      const response = await fetch(`${endpoint}?category=${category}`);
      if (!response.ok) {
        return [];
      }
      const payload = (await response.json()) as { items?: MediaEntry[] };
      return Array.isArray(payload.items) ? payload.items : [];
    };

    const loadFavoritesInsights = async () => {
      const insights: ProfileFavoritesInsights = {};

      const needsMovies = categories.includes('movies');
      const needsTv = categories.includes('tv');
      const needsBooks = categories.includes('books');
      const needsAnime = categories.includes('anime');
      const needsManga = categories.includes('manga');

      const [moviesEntries, tvEntries, booksEntries, animeEntries, mangaEntries] = await Promise.all([
        needsMovies ? fetchLibraryEntries('/api/movies/library', 'movies') : Promise.resolve([]),
        needsTv ? fetchLibraryEntries('/api/movies/library', 'tv') : Promise.resolve([]),
        needsBooks ? fetchLibraryEntries('/api/books/library', 'books') : Promise.resolve([]),
        needsAnime ? fetchLibraryEntries('/api/anime/library', 'anime') : Promise.resolve([]),
        needsManga ? fetchLibraryEntries('/api/anime/library', 'manga') : Promise.resolve([]),
      ]);

      const fetchMovieCredits = async (entry: MediaEntry, category: 'movies' | 'tv') => {
        const tmdbId =
          typeof entry.externalId === 'number'
            ? entry.externalId
            : typeof entry.externalId === 'string'
              ? Number.parseInt(entry.externalId, 10)
              : NaN;
        if (!Number.isFinite(tmdbId)) {
          return null;
        }
        const response = await fetch(`/api/movies/credits?category=${category}&tmdb_id=${tmdbId}`);
        if (!response.ok) {
          return null;
        }
        return (await response.json()) as TmdbCreditsResponse;
      };

      const buildMovieLikeInsights = async (entries: MediaEntry[], category: 'movies' | 'tv') => {
        const directorsMap = new Map<string, number>();
        const actorsMap = new Map<string, number>();

        const completedEntries = entries.filter(entry => entry.status === 'completed');
        const creditsEntries = await Promise.all(
          completedEntries.map(async entry => ({
            entry,
            credits: await fetchMovieCredits(entry, category),
          })),
        );

        for (const { entry, credits } of creditsEntries) {
          if (!credits) {
            continue;
          }
          const points = buildEntryWeight(entry, true);
          if (points <= 0) {
            continue;
          }
          addWeightedNames(directorsMap, credits.directors ?? [], points);
          addWeightedNames(actorsMap, credits.actors ?? [], points);
        }

        const favoriteDirectors = topNames(directorsMap).join(', ');
        const favoriteActors = topNames(actorsMap).join(', ');
        return {
          directors: favoriteDirectors || undefined,
          actors: favoriteActors || undefined,
        };
      };

      if (needsMovies) {
        const moviesInsight = await buildMovieLikeInsights(moviesEntries, 'movies');
        if (moviesInsight.directors || moviesInsight.actors) {
          insights.movies = moviesInsight;
        }
      }

      if (needsTv) {
        const tvInsight = await buildMovieLikeInsights(tvEntries, 'tv');
        if (tvInsight.directors || tvInsight.actors) {
          insights.tv = tvInsight;
        }
      }

      if (needsBooks) {
        const authorsMap = new Map<string, number>();
        for (const entry of booksEntries) {
          const points = buildEntryWeight(entry);
          if (points <= 0) {
            continue;
          }
          const authors =
            entry.authors && entry.authors.length > 0 ? entry.authors : splitCsvNames(entry.subtitle);
          addWeightedNames(authorsMap, authors, points);
        }
        const favoriteAuthors = topNames(authorsMap).join(', ');
        if (favoriteAuthors) {
          insights.books = { authors: favoriteAuthors };
        }
      }

      if (needsAnime) {
        const studiosMap = new Map<string, number>();
        for (const entry of animeEntries) {
          const points = buildEntryWeight(entry);
          if (points <= 0) {
            continue;
          }
          addWeightedNames(studiosMap, entry.studios ?? [], points);
        }
        const favoriteStudios = topNames(studiosMap).join(', ');
        if (favoriteStudios) {
          insights.anime = { favorite_studios: favoriteStudios };
        }
      }

      if (needsManga) {
        const mangakaMap = new Map<string, number>();
        for (const entry of mangaEntries) {
          const points = buildEntryWeight(entry);
          if (points <= 0) {
            continue;
          }
          addWeightedNames(mangakaMap, entry.authors ?? [], points);
        }
        const favoriteMangaka = topNames(mangakaMap).join(', ');
        if (favoriteMangaka) {
          insights.manga = { authors: favoriteMangaka };
        }
      }

      if (!cancelled) {
        setFavoritesInsights(insights);
      }
    };

    void loadFavoritesInsights().catch(error => {
      console.warn('Profile favorites insights failed:', error);
      if (!cancelled) {
        setFavoritesInsights({});
      }
    });

    return () => {
      cancelled = true;
    };
  }, [categories, categoriesKey, user]);

  if (!user) {
    return <ProfilePageSkeleton />;
  }

  return (
    <main className="px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <ProfileHero user={user} identity={identity} stats={heroStats} loadingStats={loadingStats} />

        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 space-y-5 lg:col-span-8">
            <HobbySection
              categories={categories}
              categoryProfile={categoryProfileWithInsights}
              genreAffinity={user.genre_affinity}
              showPsnId={user.privacy_settings?.show_psn_id ?? true}
            />
            <ActivityTimeline />
            {isPrivileged ? <ContentList /> : null}

            <MobileCollapse title="About">
              <AboutSection user={user} identity={identity} />
            </MobileCollapse>
            <MobileCollapse title="Genre Affinity">
              <GenreAffinity genreAffinity={user.genre_affinity} />
            </MobileCollapse>
            <MobileCollapse title="Account Info">
              <AccountInfo user={user} identity={identity} />
            </MobileCollapse>
          </div>

          <aside className="col-span-12 hidden lg:col-span-4 lg:block">
            <div className="space-y-5 lg:sticky lg:top-24">
              <AboutSection user={user} identity={identity} />
              <GenreAffinity genreAffinity={user.genre_affinity} />
              <AccountInfo user={user} identity={identity} />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
