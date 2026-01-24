'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Edit,
  Gamepad2,
  GripVertical,
  Sparkles,
  Film,
  Tv,
  BookOpen,
  Code,
  PawPrint,
  Cloud,
  Globe2,
  Link2,
  Instagram,
  Twitch,
  Twitter,
  Youtube,
  MessageCircle,
} from 'lucide-react';
import { PageWrapper } from '@/app/components/layout/PageWrapper';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import Skeleton from '@/app/components/ui/Skeleton';
import { ActivityFeed } from '@/app/components/activity/ActivityFeed';
import { selectUser, selectIsAuthenticated, selectIsLoading } from '@/store/slices/authSlice';
import {
  fetchBacklog,
  selectBacklogItems,
  selectStatusCounts,
  updateBacklogItem,
} from '@/store/slices/backlogSlice';
import type { AppDispatch } from '@/store/store';
import type { UserBacklogWithGame } from '@/types/interfaces';
import Image from 'next/image';
import Link from 'next/link';
import Button from '@/app/components/ui/Button';
import EmptyState from '@/app/components/ui/EmptyState';

type FavoriteItem = {
  id: string;
  is_favorite: boolean;
  priority: number;
  mediaId?: number;
  meta?: string;
  game: { title: string; slug: string; cover_image: string; background_image?: string };
};

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectIsLoading);
  const userGames = useSelector(selectBacklogItems);
  const statusCounts = useSelector(selectStatusCounts);
  const [reordering, setReordering] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [mediaFavorites, setMediaFavorites] = useState<Record<string, FavoriteItem[]>>({});
  const [mediaFavoritesLoading, setMediaFavoritesLoading] = useState<Record<string, boolean>>({});

  const totalHours = useMemo(
    () =>
      Math.round(
        userGames.reduce(
          (sum, g) => sum + (g.actual_hours_casual || 0) + (g.actual_hours_platinum || 0),
          0,
        ),
      ),
    [userGames],
  );

  const favorites = useMemo(() => {
    return [...userGames]
      .filter(item => item.is_favorite)
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
      .slice(0, 5);
  }, [userGames]);

  const role = user?.role ?? 'user';
  const categories = useMemo(
    () => (user?.categories as string[] | undefined) ?? ['gaming'],
    [user],
  );
  const isPrivileged = role === 'admin' || role === 'author';
  const favoriteCategories = useMemo(
    () => categories.filter(cat => cat === 'gaming' || isPrivileged),
    [categories, isPrivileged],
  );
  const [favCategory, setFavCategory] = useState<string | null>(favoriteCategories[0] ?? null);

  useEffect(() => {
    if (favoriteCategories.length === 0) {
      setFavCategory(null);
      return;
    }
    if (!favCategory || !favoriteCategories.includes(favCategory)) {
      setFavCategory(favoriteCategories[0]);
    }
  }, [favoriteCategories, favCategory]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchBacklog({}));
    }
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let ignore = false;
    const loadMediaFavorites = async (category: 'anime' | 'manga' | 'movies' | 'tv' | 'books') => {
      setMediaFavoritesLoading(prev => ({ ...prev, [category]: true }));
      try {
        const base =
          category === 'anime' || category === 'manga'
            ? '/api/anime/library'
            : category === 'movies' || category === 'tv'
              ? '/api/movies/library'
              : category === 'books'
                ? '/api/books/library'
                : null;
        if (!base) {
          throw new Error('Missing favorites endpoint');
        }
        const response = await fetch(`${base}?category=${category}`);
        if (!response.ok) {
          throw new Error('Favorites fetch failed');
        }
        const data = await response.json();
        const items = Array.isArray(data.items) ? data.items : [];
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
          setMediaFavorites(prev => ({
            ...prev,
            [category]: favorites.sort(
              (a: { priority?: number }, b: { priority?: number }) =>
                (b.priority ?? 0) - (a.priority ?? 0),
            ),
          }));
        }
      } catch (error) {
        console.warn('Favorites fetch failed:', error);
        if (!ignore) {
          setMediaFavorites(prev => ({ ...prev, [category]: [] }));
        }
      } finally {
        if (!ignore) {
          setMediaFavoritesLoading(prev => ({ ...prev, [category]: false }));
        }
      }
    };
    (['anime', 'manga', 'movies', 'tv', 'books'] as const).forEach(category => {
      loadMediaFavorites(category);
    });
    return () => {
      ignore = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/pages/auth/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <PageWrapper>
        <Skeleton type="profile" />
      </PageWrapper>
    );
  }

  function StatChip({ title, value }: Readonly<{ title: string; value: number | string }>) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-[var(--hb-border)] bg-[var(--hb-card)] px-4 py-3">
        <div>
          <p className="text-center text-lg font-bold text-[var(--hb-headline)]">{value}</p>
          <p className="text-xs text-[var(--hb-muted)]">{title}</p>
        </div>
      </div>
    );
  }

  function InfoRow({
    icon,
    label,
    children,
  }: Readonly<{
    icon?: React.ReactNode;
    label: string;
    children: React.ReactNode;
  }>) {
    return (
      <div className="flex items-center gap-3 text-[var(--hb-text)]">
        {icon && <div className="text-[var(--hb-muted)]">{icon}</div>}
        <div>
          <p className="text-xs text-[var(--hb-muted)]">{label}</p>
          <p className="text-sm">{children}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // redirect γίνεται από το useEffect
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Μη καθορισμένο';
    return new Date(dateString).toLocaleDateString('el-GR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const categoryNotes =
    ((user?.social_links as Record<string, unknown> | undefined)?.category_notes as
      | Record<string, unknown>
      | undefined) || {};

  const handleReorder = async (source: number | null, target: number) => {
    if (reordering || source === null || source === target) return;
    setReordering(true);
    const nextOrder = [...favorites];
    const [moved] = nextOrder.splice(source, 1);
    nextOrder.splice(target, 0, moved);
    const updates = nextOrder.map((item, idx) => ({
      id: item.id,
      priority: (nextOrder.length - idx) * 10,
    }));
    try {
      await Promise.all(
        updates.map(u => dispatch(updateBacklogItem({ id: u.id, priority: u.priority })).unwrap()),
      );
    } catch (err) {
      console.error('Reorder favorites failed:', err);
    }
    setReordering(false);
    setDragIndex(null);
  };

  const hasCategory = (cat: string) => isPrivileged || categories.includes(cat);
  const showcaseCategories = [
    'gaming',
    'anime',
    'manga',
    'books',
    'movies',
    'tv',
    'coding',
    'pet',
    'vape',
  ].filter(cat => hasCategory(cat));
  const categoryMeta: Record<
    string,
    { title: string; desc: string; icon: React.ReactNode; href: string }
  > = {
    gaming: {
      title: 'Gaming Library',
      desc: 'Backlog, progress, reviews',
      icon: <Gamepad2 size={16} />,
      href: '/pages/backlog?category=gaming',
    },
    anime: {
      title: 'Anime Library',
      desc: 'Episodes, status, reviews',
      icon: <Sparkles size={16} />,
      href: '/pages/backlog?category=anime',
    },
    manga: {
      title: 'Manga Library',
      desc: 'Chapters, status, reviews',
      icon: <BookOpen size={16} />,
      href: '/pages/backlog?category=manga',
    },
    books: {
      title: 'Books Library',
      desc: 'Pages, status, reviews',
      icon: <BookOpen size={16} />,
      href: '/pages/backlog?category=books',
    },
    movies: {
      title: 'Movies Library',
      desc: 'Watchlist, status, reviews',
      icon: <Film size={16} />,
      href: '/pages/backlog?category=movies',
    },
    tv: {
      title: 'TV Series Library',
      desc: 'Episodes, status, reviews',
      icon: <Tv size={16} />,
      href: '/pages/backlog?category=tv',
    },
    coding: {
      title: 'Coding Articles',
      desc: 'Tutorials, tips, updates',
      icon: <Code size={16} />,
      href: '/pages/news?category=coding',
    },
    pet: {
      title: 'Pet Articles',
      desc: 'Care guides, experiences',
      icon: <PawPrint size={16} />,
      href: '/pages/news?category=pet',
    },
    vape: {
      title: 'Vape Articles',
      desc: 'Devices, liquids, experiences',
      icon: <Cloud size={16} />,
      href: '/pages/news?category=vape',
    },
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

  const categoriesWithReviews = new Set(['anime', 'manga', 'books', 'movies', 'tv', 'vape']);
  const articleOnlyCategories = new Set(['coding', 'pet', 'vape']);
  const favoritesForCategory = (cat: string) => {
    if (cat === 'gaming') return favorites;
    return mediaFavorites[cat] ?? [];
  };

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

  const getFavoriteMeta = (cat: string, fav: UserBacklogWithGame | FavoriteItem) => {
    if (cat === 'gaming') {
      return getGamingMeta(fav as UserBacklogWithGame);
    }
    const meta = (fav as FavoriteItem).meta;
    if (meta) return meta;
    return fav.game?.slug || '—';
  };

  const handleReorderMediaFavorites = async (
    category: string,
    source: number | null,
    target: number,
  ) => {
    if (reordering || source === null || source === target) return;
    setReordering(true);
    const nextOrder = [...(mediaFavorites[category] ?? [])];
    const [moved] = nextOrder.splice(source, 1);
    nextOrder.splice(target, 0, moved);
    setMediaFavorites(prev => ({ ...prev, [category]: nextOrder }));
    const updates = nextOrder.map((item, idx) => ({
      mediaId: item.mediaId,
      priority: (nextOrder.length - idx) * 10,
    }));
    try {
      const endpoint =
        category === 'anime'
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
    setDragIndex(null);
  };
  const avatarUrl = (user.avatar_url || '').trim();
  const privacy = (user.privacy_settings as unknown as Record<string, unknown>) || {};
  const showAge = (privacy.show_age as boolean | undefined) ?? false;
  const showSocial = (privacy.show_social_links as boolean | undefined) ?? true;
  const showLocation = (privacy.show_location as boolean | undefined) ?? true;
  const socialLinks = (user.social_links as Record<string, unknown> | undefined) || {};
  const locationCity = (socialLinks.location_city as string | undefined) || '';

  const ageFromDob = () => {
    if (!user.date_of_birth) return null;
    const dob = new Date(user.date_of_birth);
    if (Number.isNaN(dob.getTime())) return null;
    const diff = Date.now() - dob.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const socialPlatforms: { key: string; label: string; icon: React.ReactNode }[] = [
    { key: 'discord', label: 'Discord', icon: <MessageCircle size={14} /> },
    { key: 'instagram', label: 'Instagram', icon: <Instagram size={14} /> },
    { key: 'youtube', label: 'YouTube', icon: <Youtube size={14} /> },
    { key: 'twitch', label: 'Twitch', icon: <Twitch size={14} /> },
    { key: 'twitter', label: 'X / Twitter', icon: <Twitter size={14} /> },
    { key: 'reddit', label: 'Reddit', icon: <Link2 size={14} /> },
    { key: 'website', label: 'Website / Portfolio', icon: <Globe2 size={14} /> },
  ];
  const age = ageFromDob();

  const normalizeSocialUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  return (
    <PageWrapper>
      <div className="min-h-screen bg-[var(--hb-bg)] py-10 text-[var(--hb-text)]">
        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4">
          {/* HEADER CARD */}
          <Card className="border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[0_16px_50px_rgba(3,7,18,0.6)] backdrop-blur">
            <CardContent className="flex flex-col gap-6 p-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                {/* Avatar + basic info */}
                <div className="flex items-center gap-4">
                  {avatarUrl ? (
                    <div className="relative h-20 w-20 overflow-hidden rounded-full border border-[var(--hb-border)] shadow-[0_8px_24px_rgba(3,7,18,0.55)] md:h-24 md:w-24">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={avatarUrl}
                        alt={`${user.display_name || user.username || 'User'} avatar`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[var(--hb-border)] bg-[var(--hb-card)] text-3xl font-bold text-[var(--hb-headline)] shadow-[0_8px_24px_rgba(3,7,18,0.55)] md:h-24 md:w-24">
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}

                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-[var(--hb-muted)]">
                      Χομπίστας • Προφίλ
                    </p>
                    <h1 className="mt-1 text-2xl font-extrabold text-[var(--hb-headline)] md:text-3xl">
                      {user.display_name || user.username}
                    </h1>
                    <p className="text-sm text-[var(--hb-muted)]">@{user.username}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full border border-[var(--hb-border)] bg-white/10 px-3 py-1 font-semibold uppercase text-[var(--hb-headline)]">
                        {user.role}
                      </span>
                      {user.email_verified && (
                        <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 font-semibold text-emerald-200">
                          ✓ Επιβεβαιωμένο email
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Edit button */}
                <Button
                  onClick={() => router.push('/pages/profile/edit')}
                  variant="primary"
                  className="h-10 w-10 items-center justify-center rounded-full p-0"
                  title="Επεξεργασία Προφίλ"
                  ariaLabel="Επεξεργασία Προφίλ"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>

              {/* Personal Information */}
              <Card className="border-[var(--hb-border)] bg-[var(--hb-card)] shadow-inner shadow-slate-950/40">
                <CardHeader>
                  <CardTitle className="text-[var(--hb-headline)]">
                    Προσωπικές Πληροφορίες
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoRow icon={<User size={16} />} label="Ονοματεπώνυμο">
                      {user.full_name || '—'}
                    </InfoRow>
                    <InfoRow icon={<Mail size={16} />} label="Display / Username">
                      {user.display_name || user.username}
                    </InfoRow>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    {showAge && (
                      <InfoRow icon={<Calendar size={16} />} label="Ηλικία">
                        {user.date_of_birth ? (age ? `${age} ετών` : '—') : '—'}
                      </InfoRow>
                    )}
                    <InfoRow icon={<MapPin size={16} />} label="Τοποθεσία">
                      {showLocation
                        ? [locationCity, user.country].filter(Boolean).join(', ') || '—'
                        : 'Κρυφό'}
                    </InfoRow>
                    <InfoRow icon={<Calendar size={16} />} label="Ζώνη Ώρας">
                      {showLocation ? user.timezone || '—' : 'Κρυφό'}
                    </InfoRow>
                  </div>

                  <div>
                    <p className="text-xs text-[var(--hb-muted)]">Bio</p>
                    <p className="text-sm text-[var(--hb-text)]">
                      {user.bio || 'Δεν έχει προστεθεί bio ακόμα.'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[var(--hb-muted)]">Social Presence</p>
                    {showSocial ? (
                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        {socialPlatforms.map(platform => {
                          const value = (socialLinks[platform.key] as string | undefined) || '';
                          if (!value) return null;
                          return (
                            <div
                              key={platform.key}
                              className="flex items-center gap-2 rounded-lg border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-2"
                            >
                              <span className="text-[var(--hb-primary)]">{platform.icon}</span>
                              <span className="text-sm text-[var(--hb-text)]">
                                {platform.label}:
                              </span>
                              <a
                                href={normalizeSocialUrl(value)}
                                target="_blank"
                                rel="noreferrer"
                                className="truncate text-sm text-[var(--hb-headline)] underline-offset-4 transition hover:text-[var(--hb-primary-strong)] hover:underline"
                                title={value}
                              >
                                {value}
                              </a>
                            </div>
                          );
                        })}
                        {socialPlatforms.every(p => !(socialLinks[p.key] as string)) && (
                          <EmptyState title="Δεν υπάρχουν social links." size="sm" />
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--hb-muted)]">Κρυφό</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {showcaseCategories.length > 0 && (
                <div className="w-full border-t border-[var(--hb-border)] pt-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-[var(--hb-muted)]">
                    Οι κατηγορίες μου
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {showcaseCategories.map(cat => {
                      const data = categoryMeta[cat] || {
                        title: cat,
                        desc: '',
                        icon: <Sparkles size={16} />,
                        href: '#',
                      };
                      return (
                        <a
                          key={cat}
                          href={data.href}
                          className="hover:border-[var(--hb-primary-strong)]/60 flex items-center gap-2 rounded-full border border-[var(--hb-border)] bg-[var(--hb-card)] px-3 py-1.5 text-xs text-[var(--hb-headline)] transition"
                        >
                          <span className="text-[var(--hb-primary-strong)]">{data.icon}</span>
                          <span>{data.title}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* FAVORITES + CATEGORY QUICKLINKS + PERSONAL INFO + GAMING STATS */}
          <div className="grid gap-6 lg:grid-cols-3">
            {favoriteCategories.length > 0 && favCategory && (
              <Card className="border-[var(--hb-border)] bg-[var(--hb-panel)] backdrop-blur lg:col-span-2">
                <CardHeader className="flex flex-col gap-3">
                  <CardTitle className="text-[var(--hb-headline)]">
                    Πληροφορίες Κατηγοριών
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    {favoriteCategories.map(cat => {
                      const label = categoryLabels[cat] || cat;
                      const active = favCategory === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => setFavCategory(cat)}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                            active
                              ? 'bg-[var(--hb-primary-strong)]/15 border-[var(--hb-primary-strong)] text-[var(--hb-primary-strong)]'
                              : 'hover:border-[var(--hb-primary-strong)]/60 border-[var(--hb-border)] text-[var(--hb-muted)] hover:text-[var(--hb-primary-strong)]'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {favCategory !== 'gaming' && mediaFavoritesLoading[favCategory] && (
                    <p className="text-[var(--hb-muted)]">Φόρτωση favorites...</p>
                  )}
                  {favCategory !== 'gaming' &&
                    !mediaFavoritesLoading[favCategory] &&
                    favoritesForCategory(favCategory).length === 0 && (
                      <EmptyState
                        title={
                          articleOnlyCategories.has(favCategory)
                            ? 'Δεν υπάρχουν favorites ακόμα. Αυτή η κατηγορία έχει μόνο άρθρα.'
                            : 'Δεν υπάρχουν favorites ακόμα.'
                        }
                        size="sm"
                      />
                    )}
                  {favoritesForCategory(favCategory).map((fav, idx) => (
                    <div
                      key={fav.id}
                      draggable={Boolean(favCategory)}
                      onDragStart={() => setDragIndex(idx)}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => {
                        if (favCategory === 'gaming') {
                          handleReorder(dragIndex, idx);
                        } else {
                          handleReorderMediaFavorites(favCategory, dragIndex, idx);
                        }
                      }}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-3 transition ${
                        dragIndex === idx
                          ? 'border-[var(--hb-primary-strong)]/70 bg-white/5'
                          : 'hover:border-[var(--hb-primary-strong)]/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold text-[var(--hb-muted)]">
                        <GripVertical className="h-4 w-4 text-[var(--hb-muted)]" />
                        <span>#{idx + 1}</span>
                      </div>
                      <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-white/5">
                        <Image
                          src={
                            fav.game?.cover_image || fav.game?.background_image || '/og-image.png'
                          }
                          alt={fav.game?.title || 'Item'}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--hb-headline)]">
                          {fav.game?.title || '—'}
                        </p>
                        <p className="truncate text-xs text-[var(--hb-muted)]">
                          {getFavoriteMeta(favCategory, fav)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {favCategory === 'gaming' && (
                    <p className="text-xs text-[var(--hb-muted)]">
                      Για να προσθέσεις/αφαιρέσεις favorites, χρησιμοποίησε το toggle “Favorite” στα
                      backlog items.
                    </p>
                  )}
                  {favCategory !== 'gaming' && favoritesForCategory(favCategory).length === 0 && (
                    <p className="text-xs text-[var(--hb-muted)]">
                      {articleOnlyCategories.has(favCategory)
                        ? 'Δες τα άρθρα της κατηγορίας για να ενημερώνεσαι.'
                        : 'Πρόσθεσε favorites από το αντίστοιχο library.'}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {favCategory && (
              <Card className="border-[var(--hb-border)] bg-[var(--hb-panel)] backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-[var(--hb-headline)]">
                    {categoryMeta[favCategory]?.title || 'Κατηγορία'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-[var(--hb-muted)]">
                    {categoryMeta[favCategory]?.desc || 'Library & reviews για την κατηγορία.'}
                  </p>
                  <div className="flex flex-col gap-2">
                    <a
                      href={categoryMeta[favCategory]?.href || '#'}
                      className="hover:border-[var(--hb-primary-strong)]/60 rounded-full border border-[var(--hb-border)] bg-[var(--hb-card)] px-3 py-2 text-sm text-[var(--hb-headline)] transition"
                    >
                      {articleOnlyCategories.has(favCategory) ? 'Δες Άρθρα' : 'Άνοιγμα Library'}
                    </a>
                    {categoriesWithReviews.has(favCategory) && (
                      <a
                        href={`/pages/reviews?category=${favCategory}`}
                        className="hover:border-[var(--hb-primary-strong)]/60 rounded-full border border-[var(--hb-border)] bg-[var(--hb-card)] px-3 py-2 text-sm text-[var(--hb-headline)] transition"
                      >
                        Δες Reviews
                      </a>
                    )}
                    {favCategory === 'gaming' && (
                      <Link
                        href="/pages/guides"
                        className="hover:border-[var(--hb-primary-strong)]/60 rounded-full border border-[var(--hb-border)] bg-[var(--hb-card)] px-3 py-2 text-sm text-[var(--hb-headline)] transition"
                      >
                        Guides
                      </Link>
                    )}
                  </div>
                  {favCategory === 'gaming' && (
                    <div className="space-y-3 border-t border-[var(--hb-border)] pt-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--hb-muted)]">
                        Gaming Πληροφορίες
                      </p>
                      {user.psn_id && <InfoRow label="PSN ID">{user.psn_id}</InfoRow>}
                      {user.xbox_gamertag && (
                        <InfoRow label="Xbox Gamertag">{user.xbox_gamertag}</InfoRow>
                      )}
                      {user.steam_id && <InfoRow label="Steam ID">{user.steam_id}</InfoRow>}
                      {user.nintendo_id && (
                        <InfoRow label="Nintendo ID">{user.nintendo_id}</InfoRow>
                      )}
                      {user.favorite_platform && (
                        <InfoRow label="Αγαπημένη Κονσόλα">{user.favorite_platform}</InfoRow>
                      )}
                      {user.favorite_genres && user.favorite_genres.length > 0 && (
                        <div>
                          <p className="mb-2 text-xs text-[var(--hb-muted)]">Αγαπημένα Genres</p>
                          <div className="flex flex-wrap gap-2">
                            {user.favorite_genres.map(genre => (
                              <span
                                key={genre}
                                className="rounded-full border border-[var(--hb-border)] bg-white/5 px-3 py-1 text-xs text-[var(--hb-text)]"
                              >
                                {genre}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {user.gaming_since && (
                        <InfoRow label="Gaming since">{user.gaming_since}</InfoRow>
                      )}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <StatChip title="Πλατίνες" value={statusCounts.platinumed || 0} />
                        <StatChip title="Ολοκληρωμένα" value={statusCounts.completed || 0} />
                        <StatChip title="Παίζω τώρα" value={statusCounts.playing || 0} />
                        <StatChip title="Backlog" value={statusCounts.to_play || 0} />
                        <StatChip title="Παρατημένα" value={statusCounts.Dropped || 0} />
                        <StatChip title="Ώρες παιχνιδιού" value={totalHours} />
                      </div>
                    </div>
                  )}

                  {favCategory === 'tv' && (
                    <div className="space-y-3 border-t border-[var(--hb-border)] pt-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--hb-muted)]">
                        TV Series Πληροφορίες
                      </p>
                      {Array.isArray((categoryNotes.tv as { services?: string[] })?.services) &&
                        ((categoryNotes.tv as { services?: string[] }).services as string[])
                          .length > 0 && (
                          <div>
                            <p className="text-xs text-[var(--hb-muted)]">Αγαπημένες Πλατφόρμες</p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {(
                                (categoryNotes.tv as { services?: string[] }).services as string[]
                              ).map(svc => (
                                <span
                                  key={svc}
                                  className="rounded-full border border-[var(--hb-border)] bg-white/5 px-3 py-1 text-xs text-[var(--hb-text)]"
                                >
                                  {svc}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      {(categoryNotes.tv as { service_other?: string })?.service_other && (
                        <InfoRow label="Άλλη υπηρεσία">
                          {(categoryNotes.tv as { service_other?: string }).service_other}
                        </InfoRow>
                      )}
                      {Array.isArray((categoryNotes.tv as { genres?: string[] })?.genres) &&
                        ((categoryNotes.tv as { genres?: string[] }).genres as string[]).length >
                          0 && (
                          <div>
                            <p className="text-xs text-[var(--hb-muted)]">Αγαπημένα Genres</p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {((categoryNotes.tv as { genres?: string[] }).genres as string[]).map(
                                genre => (
                                  <span
                                    key={genre}
                                    className="rounded-full border border-[var(--hb-border)] bg-white/5 px-3 py-1 text-xs text-[var(--hb-text)]"
                                  >
                                    {genre}
                                  </span>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                      {(categoryNotes.tv as { style?: string })?.style && (
                        <InfoRow label="Watching Style">
                          {(categoryNotes.tv as { style?: string }).style}
                        </InfoRow>
                      )}
                      {(categoryNotes.tv as { since?: string | number })?.since && (
                        <InfoRow label="Watching Since">
                          {(categoryNotes.tv as { since?: string | number }).since}
                        </InfoRow>
                      )}
                      {(categoryNotes.tv as { people?: string })?.people && (
                        <div>
                          <p className="text-xs text-[var(--hb-muted)]">
                            Αγαπημένοι Ηθοποιοί / Σκηνοθέτες
                          </p>
                          <p className="text-sm text-[var(--hb-text)]">
                            {(categoryNotes.tv as { people?: string }).people}
                          </p>
                        </div>
                      )}
                      {!categoryNotes.tv && (
                        <EmptyState
                          title="Δεν υπάρχουν αποθηκευμένες πληροφορίες TV Series ακόμα."
                          size="sm"
                        />
                      )}
                    </div>
                  )}

                  {favCategory === 'movies' && (
                    <div className="space-y-3 border-t border-[var(--hb-border)] pt-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--hb-muted)]">
                        Movies Πληροφορίες
                      </p>
                      {Array.isArray((categoryNotes.movies as { services?: string[] })?.services) &&
                        ((categoryNotes.movies as { services?: string[] }).services as string[])
                          .length > 0 && (
                          <div>
                            <p className="text-xs text-[var(--hb-muted)]">Αγαπημένες Πλατφόρμες</p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {(
                                (categoryNotes.movies as { services?: string[] })
                                  .services as string[]
                              ).map(svc => (
                                <span
                                  key={svc}
                                  className="rounded-full border border-[var(--hb-border)] bg-white/5 px-3 py-1 text-xs text-[var(--hb-text)]"
                                >
                                  {svc}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      {(categoryNotes.movies as { service_other?: string })?.service_other && (
                        <InfoRow label="Άλλη υπηρεσία">
                          {(categoryNotes.movies as { service_other?: string }).service_other}
                        </InfoRow>
                      )}
                      {Array.isArray((categoryNotes.movies as { genres?: string[] })?.genres) &&
                        ((categoryNotes.movies as { genres?: string[] }).genres as string[])
                          .length > 0 && (
                          <div>
                            <p className="text-xs text-[var(--hb-muted)]">Αγαπημένα Genres</p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {(
                                (categoryNotes.movies as { genres?: string[] }).genres as string[]
                              ).map(genre => (
                                <span
                                  key={genre}
                                  className="rounded-full border border-[var(--hb-border)] bg-white/5 px-3 py-1 text-xs text-[var(--hb-text)]"
                                >
                                  {genre}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      {(categoryNotes.movies as { style?: string })?.style && (
                        <InfoRow label="Watching Style">
                          {(categoryNotes.movies as { style?: string }).style}
                        </InfoRow>
                      )}
                      {(categoryNotes.movies as { since?: string | number })?.since && (
                        <InfoRow label="Watching Since">
                          {(categoryNotes.movies as { since?: string | number }).since}
                        </InfoRow>
                      )}
                      {(categoryNotes.movies as { directors?: string })?.directors && (
                        <div>
                          <p className="text-xs text-[var(--hb-muted)]">Favorite Directors</p>
                          <p className="text-sm text-[var(--hb-text)]">
                            {(categoryNotes.movies as { directors?: string }).directors}
                          </p>
                        </div>
                      )}
                      {(categoryNotes.movies as { actors?: string })?.actors && (
                        <div>
                          <p className="text-xs text-[var(--hb-muted)]">Favorite Actors</p>
                          <p className="text-sm text-[var(--hb-text)]">
                            {(categoryNotes.movies as { actors?: string }).actors}
                          </p>
                        </div>
                      )}
                      {!categoryNotes.movies && (
                        <EmptyState
                          title="Δεν υπάρχουν αποθηκευμένες πληροφορίες Movies ακόμα."
                          size="sm"
                        />
                      )}
                    </div>
                  )}

                  {favCategory === 'anime' && (
                    <div className="space-y-3 border-t border-[var(--hb-border)] pt-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--hb-muted)]">
                        Anime Πληροφορίες
                      </p>
                      {Array.isArray(
                        (categoryNotes.anime as { platforms?: string[] })?.platforms,
                      ) &&
                        ((categoryNotes.anime as { platforms?: string[] }).platforms as string[])
                          .length > 0 && (
                          <div>
                            <p className="text-xs text-[var(--hb-muted)]">Πλατφόρμες</p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {(
                                (categoryNotes.anime as { platforms?: string[] })
                                  .platforms as string[]
                              ).map(p => (
                                <span
                                  key={p}
                                  className="rounded-full border border-[var(--hb-border)] bg-white/5 px-3 py-1 text-xs text-[var(--hb-text)]"
                                >
                                  {p}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      {(categoryNotes.anime as { platform_other?: string })?.platform_other && (
                        <InfoRow label="Άλλη πλατφόρμα">
                          {(categoryNotes.anime as { platform_other?: string }).platform_other}
                        </InfoRow>
                      )}
                      {Array.isArray((categoryNotes.anime as { genres?: string[] })?.genres) &&
                        ((categoryNotes.anime as { genres?: string[] }).genres as string[]).length >
                          0 && (
                          <div>
                            <p className="text-xs text-[var(--hb-muted)]">Αγαπημένα Genres</p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {(
                                (categoryNotes.anime as { genres?: string[] }).genres as string[]
                              ).map(genre => (
                                <span
                                  key={genre}
                                  className="rounded-full border border-[var(--hb-border)] bg-white/5 px-3 py-1 text-xs text-[var(--hb-text)]"
                                >
                                  {genre}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      {(categoryNotes.anime as { format?: string })?.format && (
                        <InfoRow label="Watching Format">
                          {(categoryNotes.anime as { format?: string }).format}
                        </InfoRow>
                      )}
                      {(categoryNotes.anime as { since?: string | number })?.since && (
                        <InfoRow label="Watching Since">
                          {(categoryNotes.anime as { since?: string | number }).since}
                        </InfoRow>
                      )}
                      {(categoryNotes.anime as { directors?: string })?.directors && (
                        <div>
                          <p className="text-xs text-[var(--hb-muted)]">Directors / Studios</p>
                          <p className="text-sm text-[var(--hb-text)]">
                            {(categoryNotes.anime as { directors?: string }).directors}
                          </p>
                        </div>
                      )}
                      {(categoryNotes.anime as { notes?: string })?.notes && (
                        <div>
                          <p className="text-xs text-[var(--hb-muted)]">Notes</p>
                          <p className="text-sm text-[var(--hb-text)]">
                            {(categoryNotes.anime as { notes?: string }).notes}
                          </p>
                        </div>
                      )}
                      {!categoryNotes.anime && (
                        <EmptyState
                          title="Δεν υπάρχουν αποθηκευμένες πληροφορίες Anime ακόμα."
                          size="sm"
                        />
                      )}
                    </div>
                  )}

                  {favCategory === 'books' && (
                    <div className="space-y-3 border-t border-[var(--hb-border)] pt-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--hb-muted)]">
                        Books Πληροφορίες
                      </p>
                      {Array.isArray((categoryNotes.books as { genres?: string[] })?.genres) &&
                        ((categoryNotes.books as { genres?: string[] }).genres as string[]).length >
                          0 && (
                          <div>
                            <p className="text-xs text-[var(--hb-muted)]">Αγαπημένα Genres</p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {(
                                (categoryNotes.books as { genres?: string[] }).genres as string[]
                              ).map(genre => (
                                <span
                                  key={genre}
                                  className="rounded-full border border-[var(--hb-border)] bg-white/5 px-3 py-1 text-xs text-[var(--hb-text)]"
                                >
                                  {genre}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      {(categoryNotes.books as { format?: string })?.format && (
                        <InfoRow label="Reading Format">
                          {(categoryNotes.books as { format?: string }).format}
                        </InfoRow>
                      )}
                      {(categoryNotes.books as { since?: string | number })?.since && (
                        <InfoRow label="Reading Since">
                          {(categoryNotes.books as { since?: string | number }).since}
                        </InfoRow>
                      )}
                      {(categoryNotes.books as { authors?: string })?.authors && (
                        <div>
                          <p className="text-xs text-[var(--hb-muted)]">Favorite Authors</p>
                          <p className="text-sm text-[var(--hb-text)]">
                            {(categoryNotes.books as { authors?: string }).authors}
                          </p>
                        </div>
                      )}
                      {(categoryNotes.books as { notes?: string })?.notes && (
                        <div>
                          <p className="text-xs text-[var(--hb-muted)]">Notes</p>
                          <p className="text-sm text-[var(--hb-text)]">
                            {(categoryNotes.books as { notes?: string }).notes}
                          </p>
                        </div>
                      )}
                      {!categoryNotes.books && (
                        <EmptyState
                          title="Δεν υπάρχουν αποθηκευμένες πληροφορίες Books ακόμα."
                          size="sm"
                        />
                      )}
                    </div>
                  )}

                  {favCategory === 'manga' && (
                    <div className="space-y-3 border-t border-[var(--hb-border)] pt-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--hb-muted)]">
                        Manga Πληροφορίες
                      </p>
                      {Array.isArray((categoryNotes.manga as { genres?: string[] })?.genres) &&
                        ((categoryNotes.manga as { genres?: string[] }).genres as string[]).length >
                          0 && (
                          <div>
                            <p className="text-xs text-[var(--hb-muted)]">Αγαπημένα Genres</p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {(
                                (categoryNotes.manga as { genres?: string[] }).genres as string[]
                              ).map(genre => (
                                <span
                                  key={genre}
                                  className="rounded-full border border-[var(--hb-border)] bg-white/5 px-3 py-1 text-xs text-[var(--hb-text)]"
                                >
                                  {genre}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      {(categoryNotes.manga as { format?: string })?.format && (
                        <InfoRow label="Reading Format">
                          {(categoryNotes.manga as { format?: string }).format}
                        </InfoRow>
                      )}
                      {(categoryNotes.manga as { since?: string | number })?.since && (
                        <InfoRow label="Reading Since">
                          {(categoryNotes.manga as { since?: string | number }).since}
                        </InfoRow>
                      )}
                      {(categoryNotes.manga as { authors?: string })?.authors && (
                        <div>
                          <p className="text-xs text-[var(--hb-muted)]">Favorite Mangaka</p>
                          <p className="text-sm text-[var(--hb-text)]">
                            {(categoryNotes.manga as { authors?: string }).authors}
                          </p>
                        </div>
                      )}
                      {(categoryNotes.manga as { notes?: string })?.notes && (
                        <div>
                          <p className="text-xs text-[var(--hb-muted)]">Notes</p>
                          <p className="text-sm text-[var(--hb-text)]">
                            {(categoryNotes.manga as { notes?: string }).notes}
                          </p>
                        </div>
                      )}
                      {!categoryNotes.manga && (
                        <EmptyState
                          title="Δεν υπάρχουν αποθηκευμένες πληροφορίες Manga ακόμα."
                          size="sm"
                        />
                      )}
                    </div>
                  )}

                  {favCategory === 'coding' && (
                    <div className="space-y-3 border-t border-[var(--hb-border)] pt-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--hb-muted)]">
                        Coding Πληροφορίες
                      </p>
                      {Array.isArray(
                        (categoryNotes.coding as { languages?: string[] })?.languages,
                      ) &&
                        ((categoryNotes.coding as { languages?: string[] }).languages as string[])
                          .length > 0 && (
                          <div>
                            <p className="text-xs text-[var(--hb-muted)]">Γλώσσες</p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {(
                                (categoryNotes.coding as { languages?: string[] })
                                  .languages as string[]
                              ).map(lang => (
                                <span
                                  key={lang}
                                  className="rounded-full border border-[var(--hb-border)] bg-white/5 px-3 py-1 text-xs text-[var(--hb-text)]"
                                >
                                  {lang}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      {Array.isArray((categoryNotes.coding as { focus?: string[] })?.focus) &&
                        ((categoryNotes.coding as { focus?: string[] }).focus as string[]).length >
                          0 && (
                          <div>
                            <p className="text-xs text-[var(--hb-muted)]">Focus</p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {(
                                (categoryNotes.coding as { focus?: string[] }).focus as string[]
                              ).map(focus => (
                                <span
                                  key={focus}
                                  className="rounded-full border border-[var(--hb-border)] bg-white/5 px-3 py-1 text-xs text-[var(--hb-text)]"
                                >
                                  {focus}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      {(categoryNotes.coding as { since?: string | number })?.since && (
                        <InfoRow label="Coding Since">
                          {(categoryNotes.coding as { since?: string | number }).since}
                        </InfoRow>
                      )}
                      {(categoryNotes.coding as { tools?: string })?.tools && (
                        <InfoRow label="Tools / Stack">
                          {(categoryNotes.coding as { tools?: string }).tools}
                        </InfoRow>
                      )}
                      {(categoryNotes.coding as { notes?: string })?.notes && (
                        <div>
                          <p className="text-xs text-[var(--hb-muted)]">Notes</p>
                          <p className="text-sm text-[var(--hb-text)]">
                            {(categoryNotes.coding as { notes?: string }).notes}
                          </p>
                        </div>
                      )}
                      {!categoryNotes.coding && (
                        <EmptyState
                          title="Δεν υπάρχουν αποθηκευμένες πληροφορίες Coding ακόμα."
                          size="sm"
                        />
                      )}
                    </div>
                  )}

                  {favCategory === 'pet' && (
                    <div className="space-y-3 border-t border-[var(--hb-border)] pt-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--hb-muted)]">
                        Pet Πληροφορίες
                      </p>
                      {(categoryNotes.pet as { type?: string })?.type && (
                        <InfoRow label="Είδος">
                          {(categoryNotes.pet as { type?: string }).type}
                        </InfoRow>
                      )}
                      {(categoryNotes.pet as { name?: string })?.name && (
                        <InfoRow label="Όνομα">
                          {(categoryNotes.pet as { name?: string }).name}
                        </InfoRow>
                      )}
                      {(categoryNotes.pet as { breed?: string })?.breed && (
                        <InfoRow label="Ράτσα">
                          {(categoryNotes.pet as { breed?: string }).breed}
                        </InfoRow>
                      )}
                      {(categoryNotes.pet as { since?: string | number })?.since && (
                        <InfoRow label="Μαζί από">
                          {(categoryNotes.pet as { since?: string | number }).since}
                        </InfoRow>
                      )}
                      {(categoryNotes.pet as { notes?: string })?.notes && (
                        <div>
                          <p className="text-xs text-[var(--hb-muted)]">Ιστορίες</p>
                          <p className="text-sm text-[var(--hb-text)]">
                            {(categoryNotes.pet as { notes?: string }).notes}
                          </p>
                        </div>
                      )}
                      {!categoryNotes.pet && (
                        <EmptyState
                          title="Δεν υπάρχουν αποθηκευμένες πληροφορίες Pet ακόμα."
                          size="sm"
                        />
                      )}
                    </div>
                  )}

                  {favCategory === 'vape' && (
                    <div className="space-y-3 border-t border-[var(--hb-border)] pt-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--hb-muted)]">
                        Vape Πληροφορίες
                      </p>
                      {(categoryNotes.vape as { device?: string })?.device && (
                        <InfoRow label="Συσκευή">
                          {(categoryNotes.vape as { device?: string }).device}
                        </InfoRow>
                      )}
                      {(categoryNotes.vape as { nicotine?: string })?.nicotine && (
                        <InfoRow label="Νικοτίνη (mg)">
                          {(categoryNotes.vape as { nicotine?: string }).nicotine}
                        </InfoRow>
                      )}
                      {(categoryNotes.vape as { since?: string | number })?.since && (
                        <InfoRow label="Vaping Since">
                          {(categoryNotes.vape as { since?: string | number }).since}
                        </InfoRow>
                      )}
                      {Array.isArray((categoryNotes.vape as { flavors?: string[] })?.flavors) &&
                        ((categoryNotes.vape as { flavors?: string[] }).flavors as string[])
                          .length > 0 && (
                          <div>
                            <p className="text-xs text-[var(--hb-muted)]">Γεύσεις</p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {(
                                (categoryNotes.vape as { flavors?: string[] }).flavors as string[]
                              ).map(flavor => (
                                <span
                                  key={flavor}
                                  className="rounded-full border border-[var(--hb-border)] bg-white/5 px-3 py-1 text-xs text-[var(--hb-text)]"
                                >
                                  {flavor}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      {(categoryNotes.vape as { notes?: string })?.notes && (
                        <div>
                          <p className="text-xs text-[var(--hb-muted)]">Notes</p>
                          <p className="text-sm text-[var(--hb-text)]">
                            {(categoryNotes.vape as { notes?: string }).notes}
                          </p>
                        </div>
                      )}
                      {!categoryNotes.vape && (
                        <EmptyState
                          title="Δεν υπάρχουν αποθηκευμένες πληροφορίες Vape ακόμα."
                          size="sm"
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* ACCOUNT INFO */}
          <Card className="border-[var(--hb-border)] bg-[var(--hb-panel)] backdrop-blur">
            <CardHeader>
              <CardTitle className="text-[var(--hb-headline)]">Πληροφορίες Λογαριασμού</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--hb-muted)]">Μέλος από:</span>
                <span className="text-[var(--hb-text)]">{formatDate(user.created_at)}</span>
              </div>

              {user.last_login && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--hb-muted)]">Τελευταία σύνδεση:</span>
                  <span className="text-[var(--hb-text)]">{formatDate(user.last_login)}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-[var(--hb-muted)]">Κατάσταση λογαριασμού:</span>
                <span className="capitalize text-emerald-400">
                  {user.account_status || 'active'}
                </span>
              </div>
            </CardContent>
          </Card>

          <ActivityFeed scope="me" limit={30} title="Οι ενέργειές μου" />
        </div>
      </div>
    </PageWrapper>
  );
}
