'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Film, BookOpen, Sparkles, Tv } from 'lucide-react';
import { SearchBar } from '@/app/components/ui/SearchBar';
import Button from '@/app/components/ui/Button';

export type MediaCategory = 'anime' | 'manga' | 'books' | 'movies' | 'tv';

export const isMediaCategory = (value: string | null): value is MediaCategory => {
  return (
    value === 'anime' ||
    value === 'manga' ||
    value === 'books' ||
    value === 'movies' ||
    value === 'tv'
  );
};

type MediaStatus = 'planned' | 'current' | 'completed' | 'dropped';

type MediaEntry = {
  id: string;
  title: string;
  subtitle: string;
  year?: string;
  status: MediaStatus;
  isFavorite?: boolean;
  score?: string;
  tags: string[];
  cover: string;
  progress?: number;
  notes?: string;
  format?: string;
  description?: string;
  totalEpisodes?: number;
  totalChapters?: number;
  totalVolumes?: number;
  totalRuntime?: number;
  totalPages?: number;
  mediaId?: number;
  entryId?: number;
};

type SearchResult = MediaEntry & {
  source: 'local' | 'external' | 'mock';
  mediaId?: number;
  externalId?: number;
  payload?: Record<string, unknown>;
};

type CategoryConfig = {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  currentLabel: string;
  plannedLabel: string;
  completedLabel: string;
  droppedLabel: string;
  icon: typeof Film;
};

const CATEGORY_CONFIG: Record<MediaCategory, CategoryConfig> = {
  anime: {
    title: 'Anime Library',
    subtitle: 'Season tracking, favorites, and a clean MAL-inspired grid.',
    searchPlaceholder: 'Αναζήτηση anime τίτλων στη βάση μας...',
    currentLabel: 'Watching',
    plannedLabel: 'Plan to Watch',
    completedLabel: 'Completed',
    droppedLabel: 'Dropped',
    icon: Sparkles,
  },
  manga: {
    title: 'Manga Library',
    subtitle: 'Chapters, volumes, and a clean bookshelf layout.',
    searchPlaceholder: 'Αναζήτηση manga τίτλων στη βάση μας...',
    currentLabel: 'Reading',
    plannedLabel: 'Plan to Read',
    completedLabel: 'Completed',
    droppedLabel: 'Dropped',
    icon: BookOpen,
  },
  books: {
    title: 'Book Library',
    subtitle: 'Reading log, notes, and progress in a minimal shelf.',
    searchPlaceholder: 'Αναζήτηση βιβλίων στη βάση μας...',
    currentLabel: 'Reading',
    plannedLabel: 'To Read',
    completedLabel: 'Finished',
    droppedLabel: 'Dropped',
    icon: BookOpen,
  },
  movies: {
    title: 'Movie Library',
    subtitle: 'Watchlist, ratings, and cinematic highlights.',
    searchPlaceholder: 'Αναζήτηση ταινιών στη βάση μας...',
    currentLabel: 'Watching',
    plannedLabel: 'Watchlist',
    completedLabel: 'Watched',
    droppedLabel: 'Dropped',
    icon: Film,
  },
  tv: {
    title: 'TV Library',
    subtitle: 'Series tracking, ratings, and season progress.',
    searchPlaceholder: 'Αναζήτηση σειρών στη βάση μας...',
    currentLabel: 'Watching now',
    plannedLabel: 'Watchlist',
    completedLabel: 'Watched',
    droppedLabel: 'Dropped',
    icon: Tv,
  },
};

export default function CategoryLibrary({
  category,
  username,
}: Readonly<{
  category: MediaCategory;
  username?: string | null;
}>) {
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState<MediaStatus | 'all'>('all');
  const [ctaMode, setCtaMode] = useState<'create' | 'suggestions' | null>(null);
  const [libraryEntries, setLibraryEntries] = useState<MediaEntry[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [createQuery, setCreateQuery] = useState('');
  const [createResults, setCreateResults] = useState<SearchResult[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createProgress, setCreateProgress] = useState('');
  const [progressTouched, setProgressTouched] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<(MediaEntry & Partial<SearchResult>) | null>(
    null,
  );
  const [editState, setEditState] = useState({
    status: 'planned' as MediaStatus,
    progress: '',
    score: '',
    notes: '',
    isFavorite: false,
  });

  const supportsExternal =
    category === 'anime' ||
    category === 'manga' ||
    category === 'movies' ||
    category === 'tv' ||
    category === 'books';
  const apiBase =
    category === 'anime' || category === 'manga'
      ? '/api/anime'
      : category === 'movies' || category === 'tv'
        ? '/api/movies'
        : category === 'books'
          ? '/api/books'
        : null;
  const progressLabel =
    category === 'manga'
      ? 'Vol'
      : category === 'movies'
        ? 'Min'
        : category === 'books'
          ? 'Pg'
          : 'Ep';

  const loadLibraryEntries = async (forceMocks = false) => {
    if (!supportsExternal || forceMocks) {
      setLibraryEntries([]);
      return;
    }

    setLibraryLoading(true);
    setLibraryError(null);
    try {
      if (!apiBase) {
        setLibraryEntries([]);
        return;
      }
      const response = await fetch(`${apiBase}/library?category=${category}`);
      if (!response.ok) {
        throw new Error('Library fetch failed');
      }
      const data = await response.json();
      const items = Array.isArray(data.items) ? data.items : [];
      setLibraryEntries(items);
    } catch (error) {
      console.warn('Library fetch failed:', error);
      setLibraryError('Αποτυχία φόρτωσης βιβλιοθήκης');
      setLibraryEntries([]);
    } finally {
      setLibraryLoading(false);
    }
  };

  useEffect(() => {
    setActiveStatus('all');
    setSearch('');
    setCreateQuery('');
    setCreateResults([]);
    setCreateProgress('');
    setProgressTouched(false);
    setCtaMode(null);
    loadLibraryEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const extractProgressFromQuery = (value: string) => {
    const query = value.toLowerCase();
    const volumeMatch = query.match(/\bvol(?:ume)?\.?\s*(\d{1,4})\b/);
    if (category === 'manga' && volumeMatch) {
      return volumeMatch[1];
    }
    const episodeMatch = query.match(/\bep(?:isode)?\.?\s*(\d{1,4})\b/);
    if (category === 'anime' && episodeMatch) {
      return episodeMatch[1];
    }
    return null;
  };

  useEffect(() => {
    if (ctaMode !== 'create') return;

    if (!supportsExternal) {
      setCreateResults([]);
      return;
    }

    const query = createQuery.trim();
    if (!progressTouched) {
      const parsedProgress = extractProgressFromQuery(query);
      if (parsedProgress) {
        setCreateProgress(parsedProgress);
      }
    }
    if (!query) {
      setCreateResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setCreateLoading(true);
      try {
        if (!apiBase) {
          setCreateResults([]);
          return;
        }
        const response = await fetch(
          `${apiBase}/search?category=${category}&q=${encodeURIComponent(query)}`,
        );
        if (!response.ok) {
          setCreateResults([]);
          return;
        }
        const data = await response.json();
        const items = Array.isArray(data.items) ? data.items : [];
        setCreateResults(items as SearchResult[]);
      } catch (error) {
        console.warn('Create search failed:', error);
        setCreateResults([]);
      } finally {
        setCreateLoading(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, createQuery, ctaMode, supportsExternal]);

  useEffect(() => {
    if (ctaMode !== 'suggestions') return;
    if (
      category !== 'anime' &&
      category !== 'manga' &&
      category !== 'movies' &&
      category !== 'tv' &&
      category !== 'books'
    ) {
      setSuggestions([]);
      return;
    }
    let ignore = false;
    const loadSuggestions = async () => {
      setSuggestionsLoading(true);
      try {
        if (!apiBase) {
          setSuggestions([]);
          return;
        }
        const response = await fetch(`${apiBase}/suggestions?category=${category}`);
        if (!response.ok) {
          throw new Error('Suggestions fetch failed');
        }
        const data = await response.json();
        const items = Array.isArray(data.items) ? data.items : [];
        if (!ignore) {
          setSuggestions(items as SearchResult[]);
        }
      } catch (error) {
        console.warn('Suggestions fetch failed:', error);
        if (!ignore) {
          setSuggestions([]);
        }
      } finally {
        if (!ignore) {
          setSuggestionsLoading(false);
        }
      }
    };
    loadSuggestions();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, ctaMode]);

  const entries = useMemo(() => {
    const base = libraryEntries;
    const normalized = search.trim().toLowerCase();
    return base.filter(entry => {
      if (activeStatus !== 'all' && entry.status !== activeStatus) return false;
      if (!normalized) return true;
      return (
        entry.title.toLowerCase().includes(normalized) ||
        entry.subtitle.toLowerCase().includes(normalized) ||
        entry.tags.some(tag => tag.toLowerCase().includes(normalized))
      );
    });
  }, [activeStatus, libraryEntries, search]);

  const counts = useMemo(() => {
    const base = libraryEntries;
    return base.reduce(
      (acc, entry) => {
        acc[entry.status] += 1;
        return acc;
      },
      { planned: 0, current: 0, completed: 0, dropped: 0 },
    );
  }, [libraryEntries]);

  const handleAddSuggestion = async (entry: SearchResult) => {
    const progressValue = Number.parseInt(createProgress, 10);
    const normalizedProgress = Number.isFinite(progressValue) ? progressValue : undefined;
    const totalCount = getTotalCount(entry);
    const shouldComplete =
      totalCount !== undefined &&
      normalizedProgress !== undefined &&
      normalizedProgress >= totalCount;
    const nextStatus = shouldComplete ? 'completed' : 'planned';
    const nextProgressValue =
      nextStatus === 'completed' && totalCount !== undefined ? totalCount : normalizedProgress;
    if (supportsExternal && (entry.source === 'external' || entry.source === 'local')) {
      try {
        if (!apiBase) {
          throw new Error('Missing API base');
        }
        const response = await fetch(`${apiBase}/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: entry.source,
            mediaId: entry.mediaId,
            payload: entry.payload,
            status: nextStatus,
            progress: nextProgressValue,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to add media entry');
        }
        await loadLibraryEntries();
        return;
      } catch (error) {
        console.warn('Add media failed, using local fallback:', error);
      }
    }

    const fallbackProgress = nextProgressValue ?? undefined;
    setLibraryEntries(prev => [
      {
        ...entry,
        id: `added-${entry.id}-${Date.now()}`,
        status: nextStatus,
        progress: fallbackProgress,
      },
      ...prev,
    ]);
  };

  const getTotalCount = (entry: MediaEntry & Partial<SearchResult>) => {
    const normalizeCount = (value?: number | null) =>
      typeof value === 'number' && value > 0 ? value : undefined;
    if (category === 'anime') {
      return (
        normalizeCount(entry.totalEpisodes) ??
        normalizeCount((entry.payload as { episodes?: number | null } | undefined)?.episodes) ??
        undefined
      );
    }
    if (category === 'manga') {
      return (
        normalizeCount(entry.totalVolumes) ??
        normalizeCount(entry.totalChapters) ??
        normalizeCount(
          (entry.payload as { volumes?: number | null; chapters?: number | null } | undefined)
            ?.volumes,
        ) ??
        normalizeCount(
          (entry.payload as { volumes?: number | null; chapters?: number | null } | undefined)
            ?.chapters,
        ) ??
        undefined
      );
    }
    if (category === 'movies') {
      return (
        normalizeCount(entry.totalRuntime) ??
        normalizeCount((entry.payload as { runtime?: number | null } | undefined)?.runtime) ??
        undefined
      );
    }
    if (category === 'tv') {
      return (
        normalizeCount(entry.totalEpisodes) ??
        normalizeCount(
          (entry.payload as { number_of_episodes?: number | null } | undefined)?.number_of_episodes,
        ) ??
        undefined
      );
    }
    if (category === 'books') {
      return (
        normalizeCount(entry.totalPages) ??
        normalizeCount((entry.payload as { page_count?: number | null } | undefined)?.page_count) ??
        undefined
      );
    }
    return undefined;
  };

  const openEntryDialog = (entry: MediaEntry & Partial<SearchResult>) => {
    const payload = entry.payload as
      | {
          episodes?: number | null;
          chapters?: number | null;
          volumes?: number | null;
          runtime?: number | null;
          number_of_episodes?: number | null;
          page_count?: number | null;
          cover_image_large?: string | null;
          cover_image_medium?: string | null;
          banner_image?: string | null;
          genres?: string[] | null;
        }
      | undefined;
    const nextEntry = {
      ...entry,
      totalEpisodes:
        entry.totalEpisodes ?? payload?.episodes ?? payload?.number_of_episodes ?? undefined,
      totalChapters: entry.totalChapters ?? payload?.chapters ?? undefined,
      totalVolumes: entry.totalVolumes ?? payload?.volumes ?? undefined,
      totalRuntime: entry.totalRuntime ?? payload?.runtime ?? undefined,
      totalPages: entry.totalPages ?? payload?.page_count ?? undefined,
    };
    setSelectedEntry(nextEntry);
    setEditState({
      status: nextEntry.status ?? 'planned',
      progress: nextEntry.progress ? String(nextEntry.progress) : '',
      score: nextEntry.entryId ? (nextEntry.score ?? '') : '',
      notes: nextEntry.notes ?? '',
      isFavorite: nextEntry.isFavorite ?? false,
    });

    if (
      (category === 'movies' || category === 'tv') &&
      entry.externalId &&
      !nextEntry.totalRuntime &&
      !nextEntry.totalEpisodes
    ) {
      fetch(`/api/movies/details?category=${category}&tmdb_id=${entry.externalId}`)
        .then(async response => {
          if (!response.ok) {
            return null;
          }
          return (await response.json()) as {
            runtime?: number | null;
            number_of_episodes?: number | null;
            cover_image_large?: string | null;
            cover_image_medium?: string | null;
            banner_image?: string | null;
            genres?: string[] | null;
          };
        })
        .then(details => {
          if (!details) return;
          setSelectedEntry(prev => {
            if (!prev) return prev;
            const totalRuntime = prev.totalRuntime ?? details.runtime ?? undefined;
            const totalEpisodes = prev.totalEpisodes ?? details.number_of_episodes ?? undefined;
            return {
              ...prev,
              totalRuntime,
              totalEpisodes,
              tags: prev.tags.length > 0 ? prev.tags : (details.genres ?? []),
              cover:
                prev.cover || details.cover_image_large || details.cover_image_medium || prev.cover,
              payload: {
                ...(prev.payload || {}),
                runtime: totalRuntime ?? null,
                number_of_episodes: totalEpisodes ?? null,
                cover_image_large: details.cover_image_large ?? null,
                cover_image_medium: details.cover_image_medium ?? null,
                banner_image: details.banner_image ?? null,
                genres: details.genres ?? [],
              },
            };
          });
          setEditState(prev => {
            if (prev.status !== 'completed' || prev.progress) return prev;
            const total = details.runtime ?? details.number_of_episodes ?? null;
            if (!total) return prev;
            return { ...prev, progress: String(total) };
          });
        })
        .catch(error => {
          console.warn('TMDB details fetch failed:', error);
        });
    }
  };

  const handleSaveEntry = async () => {
    if (!selectedEntry) return;
    const progressValue = Number.parseInt(editState.progress, 10);
    const scoreValue = Number.parseFloat(editState.score);
    const nextProgress = Number.isFinite(progressValue) ? progressValue : null;
    const nextScore = Number.isFinite(scoreValue) ? scoreValue : null;
    const totalCount = getTotalCount(selectedEntry);
    const shouldComplete =
      totalCount !== undefined && nextProgress !== null && nextProgress >= totalCount;
    const nextStatus = shouldComplete ? 'completed' : editState.status;
    const nextProgressValue =
      editState.status === 'completed' && totalCount !== undefined ? totalCount : nextProgress;
    const nextFavorite = editState.isFavorite;

    if (supportsExternal && selectedEntry.mediaId) {
      try {
        if (!apiBase) {
          throw new Error('Missing API base');
        }
        const response = await fetch(`${apiBase}/library`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mediaId: selectedEntry.mediaId,
            status: nextStatus,
            is_favorite: nextFavorite,
            progress: nextProgressValue,
            score: nextScore,
            notes: editState.notes || null,
          }),
        });
        if (!response.ok) {
          throw new Error('Failed to update entry');
        }
        await loadLibraryEntries();
      } catch (error) {
        console.warn('Update entry failed:', error);
      }
    } else if (supportsExternal && selectedEntry.source === 'external' && selectedEntry.payload) {
      try {
        if (!apiBase) {
          throw new Error('Missing API base');
        }
        const response = await fetch(`${apiBase}/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: 'external',
            payload: selectedEntry.payload,
            status: nextStatus,
            is_favorite: nextFavorite,
            progress: nextProgressValue ?? undefined,
            score: nextScore ?? undefined,
            notes: editState.notes || null,
          }),
        });
        if (!response.ok) {
          throw new Error('Failed to add entry');
        }
        await loadLibraryEntries();
      } catch (error) {
        console.warn('Add entry failed:', error);
      }
    } else {
      setLibraryEntries(prev =>
        prev.map(entry =>
          entry.id === selectedEntry.id
            ? {
                ...entry,
                status: nextStatus,
                isFavorite: nextFavorite,
                progress: nextProgressValue ?? undefined,
                score: editState.score || undefined,
                notes: editState.notes || undefined,
              }
            : entry,
        ),
      );
    }

    setSelectedEntry(null);
  };

  const handleDeleteEntry = async (entry: MediaEntry) => {
    if (!entry.mediaId) {
      setLibraryEntries(prev => prev.filter(item => item.id !== entry.id));
      if (selectedEntry?.id === entry.id) {
        setSelectedEntry(null);
      }
      return;
    }
    const confirmed = globalThis.confirm('Θες σίγουρα να αφαιρέσεις την καταχώρηση;');
    if (!confirmed) return;

    if (supportsExternal) {
      try {
        if (!apiBase) {
          throw new Error('Missing API base');
        }
        const response = await fetch(`${apiBase}/library`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mediaId: entry.mediaId }),
        });
        if (!response.ok) {
          throw new Error('Failed to delete entry');
        }
        await loadLibraryEntries();
        if (selectedEntry?.id === entry.id) {
          setSelectedEntry(null);
        }
        return;
      } catch (error) {
        console.warn('Delete entry failed:', error);
      }
    }

    setLibraryEntries(prev => prev.filter(item => item.id !== entry.id));
    if (selectedEntry?.id === entry.id) {
      setSelectedEntry(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--hb-bg)] px-4 py-20 text-[var(--hb-text)]">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="absolute inset-0 -z-10 opacity-30 blur-[120px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,var(--hb-primary-strong),transparent_50%)]" />
          <div className="absolute inset-y-10 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_20%,var(--hb-accent),transparent_55%)]" />
        </div>

        <section className="rounded-3xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-[var(--hb-primary-strong)]/20 flex h-14 w-14 items-center justify-center rounded-2xl text-[var(--hb-primary-strong)] shadow-[0_0_24px_rgba(229,9,20,0.35)]">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-[var(--hb-muted)]">
                  {username ? `${username} • ` : ''}
                  {category.toUpperCase()}
                </p>
                <h1 className="text-3xl font-bold text-[var(--hb-headline)] md:text-4xl">
                  {config.title}
                </h1>
                <p className="text-sm text-[var(--hb-muted)]">{config.subtitle}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="border-[var(--hb-primary-strong)]/40 text-[var(--hb-primary-strong)] hover:border-[var(--hb-primary-strong)]"
                onClick={() => setCtaMode('create')}
              >
                Νέα καταχώρηση
              </Button>
              <Button
                variant="primary"
                className="bg-[var(--hb-primary-strong)] text-[var(--hb-bg)] hover:brightness-110"
                onClick={() => setCtaMode('suggestions')}
              >
                Προτάσεις
              </Button>
            </div>
          </div>

          {ctaMode === 'create' && (
            <div className="mt-5 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4">
              <p className="text-sm font-semibold text-[var(--hb-headline)]">
                Αναζήτηση στη βάση μας, μετά{' '}
                {category === 'anime' || category === 'manga'
                  ? 'MAL'
                  : category === 'movies' || category === 'tv'
                    ? 'TMDB'
                    : 'Google Books'}{' '}
                για εμπλουτισμό
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <SearchBar
                  value={createQuery}
                  onChange={value => setCreateQuery(value)}
                  placeholder={config.searchPlaceholder}
                />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {createResults.map(entry => (
                  <div
                    key={`create-${entry.id}`}
                    className="flex items-center gap-3 rounded-xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-3"
                  >
                    <div className="relative h-16 w-12 overflow-hidden rounded-lg bg-[var(--hb-card)]">
                      <Image src={entry.cover} alt={entry.title} fill className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => openEntryDialog(entry)}
                        className="block truncate text-left text-sm font-semibold text-[var(--hb-headline)] transition hover:text-[var(--hb-primary-strong)]"
                      >
                        {entry.title}
                      </button>
                      <p className="truncate text-xs text-[var(--hb-muted)]">
                        {entry.subtitle} {entry.year ? `• ${entry.year}` : ''}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="border-[var(--hb-primary-strong)]/40 text-[var(--hb-primary-strong)]"
                      onClick={() => handleAddSuggestion(entry)}
                    >
                      Προσθήκη
                    </Button>
                  </div>
                ))}
                {createLoading && (
                  <div className="rounded-xl border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-4 text-center text-xs text-[var(--hb-muted)] md:col-span-2">
                    Αναζήτηση στη βάση μας...
                  </div>
                )}
                {!createLoading && createResults.length === 0 && (
                  <div className="rounded-xl border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-4 text-center text-xs text-[var(--hb-muted)] md:col-span-2">
                    Δεν βρέθηκαν αποτελέσματα.
                  </div>
                )}
              </div>
              <div className="mt-4">
                <Button variant="ghost" onClick={() => setCtaMode(null)}>
                  Κλείσιμο
                </Button>
              </div>
            </div>
          )}

          {ctaMode === 'suggestions' && (
            <div className="mt-5 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--hb-headline)]">
                  Προτάσεις από την κοινότητα
                </p>
                <button
                  type="button"
                  onClick={() => setCtaMode(null)}
                  className="rounded-full border border-[var(--hb-border)] px-3 py-1 text-xs text-[var(--hb-muted)] transition hover:text-[var(--hb-text)]"
                >
                  Κλείσιμο
                </button>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {suggestions.map(entry => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 rounded-xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-3"
                  >
                    <div className="relative h-16 w-12 overflow-hidden rounded-lg bg-[var(--hb-card)]">
                      <Image src={entry.cover} alt={entry.title} fill className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() =>
                          openEntryDialog({
                            ...entry,
                            source: 'local',
                          })
                        }
                        className="block truncate text-left text-sm font-semibold text-[var(--hb-headline)] transition hover:text-[var(--hb-primary-strong)]"
                      >
                        {entry.title}
                      </button>
                      <p className="truncate text-xs text-[var(--hb-muted)]">
                        {entry.subtitle} {entry.year ? `• ${entry.year}` : ''}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="border-[var(--hb-primary-strong)]/40 text-[var(--hb-primary-strong)]"
                      onClick={() =>
                        handleAddSuggestion({
                          ...entry,
                          source: 'local',
                        })
                      }
                    >
                      Προσθήκη
                    </Button>
                  </div>
                ))}
                {suggestionsLoading && (
                  <div className="rounded-xl border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-4 text-center text-xs text-[var(--hb-muted)] md:col-span-2">
                    Φόρτωση προτάσεων...
                  </div>
                )}
                {!suggestionsLoading && suggestions.length === 0 && (
                  <div className="rounded-xl border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-4 text-center text-xs text-[var(--hb-muted)] md:col-span-2">
                    Δεν υπάρχουν προτάσεις ακόμα.
                  </div>
                )}
              </div>
            </div>
          )}

          <div
            className={`mt-6 grid gap-4 ${
              category === 'movies'
                ? 'md:grid-cols-3'
                : category === 'books'
                  ? 'md:grid-cols-5'
                  : 'md:grid-cols-4'
            }`}
          >
            <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--hb-muted)]">Entries</p>
              <p className="mt-2 text-3xl font-bold text-[var(--hb-primary-strong)]">
                {libraryEntries.length}
              </p>
              <p className="text-xs text-[var(--hb-muted)]">Συνολικές καταχωρήσεις</p>
            </div>
            {category !== 'movies' ? (
              <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--hb-muted)]">
                  {config.currentLabel}
                </p>
                <p className="mt-2 text-3xl font-bold text-[var(--hb-headline)]">
                  {counts.current}
                </p>
                <p className="text-xs text-[var(--hb-muted)]">Σε εξέλιξη</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--hb-muted)]">
                  {config.droppedLabel}
                </p>
                <p className="mt-2 text-3xl font-bold text-[var(--hb-headline)]">
                  {counts.dropped}
                </p>
                <p className="text-xs text-[var(--hb-muted)]">Παρατημένα</p>
              </div>
            )}
            {category === 'books' && (
              <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--hb-muted)]">
                  {config.plannedLabel}
                </p>
                <p className="mt-2 text-3xl font-bold text-[var(--hb-headline)]">
                  {counts.planned}
                </p>
                <p className="text-xs text-[var(--hb-muted)]">Προς ανάγνωση</p>
              </div>
            )}
            <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--hb-muted)]">
                {config.completedLabel}
              </p>
              <p className="mt-2 text-3xl font-bold text-[var(--hb-headline)]">
                {counts.completed}
              </p>
              <p className="text-xs text-[var(--hb-muted)]">Ολοκληρωμένα</p>
            </div>
            {category !== 'movies' && (
              <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--hb-muted)]">
                  {config.droppedLabel}
                </p>
                <p className="mt-2 text-3xl font-bold text-[var(--hb-headline)]">
                  {counts.dropped}
                </p>
                <p className="text-xs text-[var(--hb-muted)]">Παρατημένα</p>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <SearchBar
                value={search}
                onChange={value => setSearch(value)}
                placeholder={config.searchPlaceholder}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveStatus('all')}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  activeStatus === 'all'
                    ? 'bg-[var(--hb-primary-strong)]/20 text-[var(--hb-primary-strong)]'
                    : 'border border-[var(--hb-border)] text-[var(--hb-muted)] hover:text-[var(--hb-text)]'
                }`}
              >
                Όλα
              </button>
              {category !== 'movies' && (
                <button
                  onClick={() => setActiveStatus('current')}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    activeStatus === 'current'
                      ? 'bg-[var(--hb-primary-strong)]/20 text-[var(--hb-primary-strong)]'
                      : 'border border-[var(--hb-border)] text-[var(--hb-muted)] hover:text-[var(--hb-text)]'
                  }`}
                >
                  {config.currentLabel}
                </button>
              )}
              <button
                onClick={() => setActiveStatus('planned')}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  activeStatus === 'planned'
                    ? 'bg-[var(--hb-primary-strong)]/20 text-[var(--hb-primary-strong)]'
                    : 'border border-[var(--hb-border)] text-[var(--hb-muted)] hover:text-[var(--hb-text)]'
                }`}
              >
                {config.plannedLabel}
              </button>
              <button
                onClick={() => setActiveStatus('completed')}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  activeStatus === 'completed'
                    ? 'bg-[var(--hb-primary-strong)]/20 text-[var(--hb-primary-strong)]'
                    : 'border border-[var(--hb-border)] text-[var(--hb-muted)] hover:text-[var(--hb-text)]'
                }`}
              >
                {config.completedLabel}
              </button>
              <button
                onClick={() => setActiveStatus('dropped')}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  activeStatus === 'dropped'
                    ? 'bg-[var(--hb-primary-strong)]/20 text-[var(--hb-primary-strong)]'
                    : 'border border-[var(--hb-border)] text-[var(--hb-muted)] hover:text-[var(--hb-text)]'
                }`}
              >
                {config.droppedLabel}
              </button>
            </div>
          </div>
        </section>

        {libraryError && (
          <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] px-4 py-3 text-sm text-[var(--hb-text)]">
            {libraryError}
          </div>
        )}

        <section className="max-h-[70vh] overflow-y-auto rounded-3xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-4 backdrop-blur">
          <div className="hidden gap-4 px-3 pb-2 text-xs uppercase tracking-[0.2em] text-[var(--hb-muted)] md:grid md:grid-cols-[72px,1.6fr,0.8fr,0.8fr,0.6fr,0.4fr]">
            <span>Cover</span>
            <span>Title</span>
            <span>Status</span>
            <span>{progressLabel} / Total</span>
            <span>Score</span>
            <span />
          </div>

          <div className="mt-2 space-y-3">
            {libraryLoading && (
              <div className="rounded-2xl border border-dashed border-[var(--hb-border)] bg-[var(--hb-card)] px-4 py-6 text-center text-sm text-[var(--hb-muted)]">
                Φόρτωση βιβλιοθήκης...
              </div>
            )}
            {!libraryLoading &&
              entries.map(entry => {
                const total = getTotalCount(entry);
                const statusLabel =
                  entry.status === 'current'
                    ? config.currentLabel
                    : entry.status === 'planned'
                      ? config.plannedLabel
                      : entry.status === 'dropped'
                        ? config.droppedLabel
                        : config.completedLabel;
                const progressValue = entry.progress ?? null;
                const progressDisplay =
                  progressValue !== null ? `${progressValue}${total ? ` / ${total}` : ''}` : '—';

                return (
                  <div
                    key={`${entry.entryId ?? entry.mediaId ?? entry.id}`}
                    className="grid items-center gap-4 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-3 md:grid-cols-[72px,1.6fr,0.8fr,0.8fr,0.6fr,0.4fr]"
                  >
                    <div className="relative h-20 w-14 overflow-hidden rounded-xl bg-[var(--hb-panel)]">
                      <Image
                        src={entry.cover}
                        alt={entry.title}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => openEntryDialog(entry)}
                        className="text-left text-base font-semibold text-[var(--hb-headline)] transition hover:text-[var(--hb-primary-strong)]"
                      >
                        {entry.title}
                      </button>
                      <p className="text-sm text-[var(--hb-muted)]">
                        {entry.subtitle}
                        {entry.year ? ` • ${entry.year}` : ''}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {entry.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="rounded-full border border-[var(--hb-border)] px-2 py-0.5 text-[11px] text-[var(--hb-muted)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="border-[var(--hb-primary-strong)]/40 bg-[var(--hb-primary-strong)]/10 rounded-full border px-3 py-1 text-xs font-semibold text-[var(--hb-primary-strong)]">
                        {statusLabel}
                      </span>
                    </div>
                    <div className="text-sm text-[var(--hb-muted)]">{progressDisplay}</div>
                    <div className="text-sm font-semibold text-[var(--hb-headline)]">
                      {entry.score ?? '—'}
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        className="text-[var(--hb-muted)] hover:text-[var(--hb-primary-strong)]"
                        onClick={() => handleDeleteEntry(entry)}
                        title="Διαγραφή"
                        ariaLabel="Διαγραφή"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                );
              })}
            {!libraryLoading && entries.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[var(--hb-border)] bg-[var(--hb-card)] px-4 py-6 text-center text-sm text-[var(--hb-muted)]">
                Δεν υπάρχουν καταχωρήσεις ακόμη.
              </div>
            )}
          </div>
        </section>

        {selectedEntry && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur"
            onClick={event => {
              if (event.target === event.currentTarget) {
                setSelectedEntry(null);
              }
            }}
          >
            <div className="w-full max-w-3xl rounded-3xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.7)]">
              <div className="flex flex-col gap-6 md:flex-row">
                <div className="relative h-52 w-36 overflow-hidden rounded-2xl bg-[var(--hb-card)]">
                  <Image
                    src={selectedEntry.cover}
                    alt={selectedEntry.title}
                    fill
                    className="object-cover"
                    sizes="144px"
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[var(--hb-muted)]">
                      {category.toUpperCase()}
                    </p>
                    <h2 className="text-2xl font-semibold text-[var(--hb-headline)]">
                      {selectedEntry.title}
                    </h2>
                    <p className="text-sm text-[var(--hb-muted)]">
                      {selectedEntry.subtitle}
                      {selectedEntry.year ? ` • ${selectedEntry.year}` : ''}
                    </p>
                  </div>
                  {selectedEntry.description && (
                    <p className="text-[var(--hb-text)]/90 text-sm">{selectedEntry.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {selectedEntry.tags.slice(0, 6).map(tag => (
                      <span
                        key={tag}
                        className="rounded-full border border-[var(--hb-border)] px-2 py-0.5 text-xs text-[var(--hb-muted)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4 md:grid-cols-2">
                <div>
                  <label className="text-xs text-[var(--hb-muted)]">Status</label>
                  <select
                    value={editState.status}
                    onChange={event => {
                      const nextStatus = event.target.value as MediaStatus;
                      const totalCount = getTotalCount(selectedEntry);
                      setEditState(prev => ({
                        ...prev,
                        status: nextStatus,
                        progress:
                          nextStatus === 'completed' && totalCount !== undefined
                            ? String(totalCount)
                            : prev.progress,
                      }));
                    }}
                    className="mt-2 w-full rounded-lg border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-2 text-sm text-[var(--hb-text)] focus:border-[var(--hb-primary-strong)] focus:outline-none"
                  >
                    <option value="planned">{config.plannedLabel}</option>
                    {category !== 'movies' && (
                      <option value="current">{config.currentLabel}</option>
                    )}
                    <option value="completed">{config.completedLabel}</option>
                    <option value="dropped">{config.droppedLabel}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[var(--hb-muted)]">
                    Πρόοδος ({progressLabel})
                  </label>
                  <input
                    value={editState.progress}
                    onChange={event => {
                      const nextProgress = event.target.value;
                      const totalCount = getTotalCount(selectedEntry);
                      const numericProgress = Number.parseInt(nextProgress, 10);
                      const shouldComplete =
                        totalCount !== undefined &&
                        Number.isFinite(numericProgress) &&
                        numericProgress >= totalCount;
                      setEditState(prev => ({
                        ...prev,
                        progress: nextProgress,
                        status: shouldComplete ? 'completed' : prev.status,
                      }));
                    }}
                    className="mt-2 w-full rounded-lg border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-2 text-sm text-[var(--hb-text)] focus:border-[var(--hb-primary-strong)] focus:outline-none"
                    inputMode="numeric"
                    placeholder="π.χ. 22"
                  />
                  <p className="mt-1 text-xs text-[var(--hb-muted)]">
                    Σύνολο: {getTotalCount(selectedEntry) ?? '—'}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-[var(--hb-muted)]">Βαθμολογία</label>
                  <input
                    value={editState.score}
                    onChange={event =>
                      setEditState(prev => ({ ...prev, score: event.target.value }))
                    }
                    className="mt-2 w-full rounded-lg border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-2 text-sm text-[var(--hb-text)] focus:border-[var(--hb-primary-strong)] focus:outline-none"
                    inputMode="decimal"
                    placeholder="0-10"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--hb-muted)]">Favorite</label>
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-2 text-sm text-[var(--hb-text)]">
                    <input
                      type="checkbox"
                      checked={editState.isFavorite}
                      onChange={event =>
                        setEditState(prev => ({ ...prev, isFavorite: event.target.checked }))
                      }
                      className="h-4 w-4 accent-[var(--hb-primary-strong)]"
                    />
                    <span>Αγαπημένο</span>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-[var(--hb-muted)]">Σημειώσεις</label>
                  <textarea
                    value={editState.notes}
                    onChange={event =>
                      setEditState(prev => ({ ...prev, notes: event.target.value }))
                    }
                    className="mt-2 min-h-[100px] w-full rounded-lg border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-2 text-sm text-[var(--hb-text)] focus:border-[var(--hb-primary-strong)] focus:outline-none"
                    placeholder="Προσωπικές σημειώσεις..."
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                {selectedEntry.mediaId && (
                  <Button variant="danger" onClick={() => handleDeleteEntry(selectedEntry)}>
                    Διαγραφή
                  </Button>
                )}
                <Button variant="ghost" onClick={() => setSelectedEntry(null)}>
                  Άκυρο
                </Button>
                <Button
                  variant="primary"
                  className="bg-[var(--hb-primary-strong)] text-[var(--hb-bg)] hover:brightness-110"
                  onClick={handleSaveEntry}
                >
                  Αποθήκευση
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
