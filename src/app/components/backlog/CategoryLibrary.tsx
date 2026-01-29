'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { mutate } from 'swr';
import ErrorState from '@/app/components/ui/ErrorState';
import AlertMessage from '@/app/components/ui/AlertMessage';

import CategoryHeader from './CategoryHeader';
import CategoryStats from './CategoryStats';
import CreateEntryPanel from './CreateEntryPanel';
import SuggestionsPanel from './SuggestionsPanel';
import StatusFilterBar from './StatusFilterBar';
import LibraryEntryList from './LibraryEntryList';
import EntryEditDialog, { EditState } from './EntryEditDialog';
import {
  MediaCategory,
  MediaEntry,
  MediaStatus,
  SearchResult,
  isMediaCategory,
  getApiBase,
  supportsExternalApi,
  getTotalCount,
} from './types';

export { isMediaCategory };
export type { MediaCategory };

type AlertState = {
  type: 'success' | 'error';
  message: string;
  title?: string;
} | null;

export default function CategoryLibrary({
  category,
  username,
  initialStatus = 'all',
  initialSearch,
}: Readonly<{
  category: MediaCategory;
  username?: string | null;
  initialStatus?: MediaStatus | 'all';
  initialSearch?: string;
}>) {
  const normalizedInitialStatus = initialStatus ?? 'all';
  const normalizedInitialSearch = initialSearch?.trim() ?? '';
  const [search, setSearch] = useState(normalizedInitialSearch);
  const [activeStatus, setActiveStatus] = useState<MediaStatus | 'all'>(normalizedInitialStatus);
  const [ctaMode, setCtaMode] = useState<'create' | 'suggestions' | null>(null);
  const [libraryEntries, setLibraryEntries] = useState<MediaEntry[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [createQuery, setCreateQuery] = useState('');
  const [createResults, setCreateResults] = useState<SearchResult[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState>(null);

  const [selectedEntry, setSelectedEntry] = useState<(MediaEntry & Partial<SearchResult>) | null>(
    null,
  );

  const supportsExternal = supportsExternalApi(category);
  const apiBase = getApiBase(category);

  const loadLibraryEntries = useCallback(
    async (forceMocks = false) => {
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
    },
    [apiBase, category, supportsExternal],
  );

  useEffect(() => {
    setActiveStatus(normalizedInitialStatus);
    setSearch(normalizedInitialSearch);
    setCreateQuery('');
    setCreateResults([]);
    setCtaMode(null);
    loadLibraryEntries();
  }, [category, normalizedInitialStatus, normalizedInitialSearch, loadLibraryEntries]);

  useEffect(() => {
    if (ctaMode !== 'create') return;

    if (!supportsExternal) {
      setCreateResults([]);
      return;
    }

    const query = createQuery.trim();
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
    if (!supportsExternal) {
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
  }, [apiBase, category, ctaMode, supportsExternal]);

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
        })
        .catch(error => {
          console.warn('TMDB details fetch failed:', error);
        });
    }
  };

  const handleSaveEntry = async (editState: EditState) => {
    if (!selectedEntry) return;
    const progressValue = Number.parseInt(editState.progress, 10);
    const scoreValue = Number.parseFloat(editState.score);
    const nextProgress = Number.isFinite(progressValue) ? progressValue : null;
    const nextScore = Number.isFinite(scoreValue) ? scoreValue : null;
    const totalCount = getTotalCount(selectedEntry, category);

    // Respect user's explicit status choice - only auto-complete if user hasn't changed status
    // or if they explicitly set it to completed
    const nextStatus = editState.status;
    const shouldAutoCompleteProgress = category !== 'games';
    const nextProgressValue =
      shouldAutoCompleteProgress && editState.status === 'completed' && totalCount !== undefined
        ? totalCount
        : nextProgress;
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
        await mutate('/api/user/continue');
        setAlert({
          type: 'success',
          title: 'Αποθηκεύτηκε',
          message: 'Οι αλλαγές αποθηκεύτηκαν επιτυχώς.',
        });
      } catch (error) {
        console.warn('Update entry failed:', error);
        setAlert({
          type: 'error',
          title: 'Σφάλμα',
          message: 'Αποτυχία αποθήκευσης. Δοκίμασε ξανά.',
        });
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
        await mutate('/api/user/continue');
        setAlert({
          type: 'success',
          title: 'Επιτυχής προσθήκη',
          message: `Το "${selectedEntry.title}" προστέθηκε στη βιβλιοθήκη σου.`,
        });
      } catch (error) {
        console.warn('Add entry failed:', error);
        setAlert({
          type: 'error',
          title: 'Σφάλμα',
          message: 'Αποτυχία προσθήκης. Δοκίμασε ξανά.',
        });
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
      setAlert({
        type: 'success',
        title: 'Αποθηκεύτηκε',
        message: 'Οι αλλαγές αποθηκεύτηκαν επιτυχώς.',
      });
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
        await mutate('/api/user/continue');
        if (selectedEntry?.id === entry.id) {
          setSelectedEntry(null);
        }
        setAlert({
          type: 'success',
          title: 'Διαγράφηκε',
          message: `Το "${entry.title}" αφαιρέθηκε από τη βιβλιοθήκη.`,
        });
        return;
      } catch (error) {
        console.warn('Delete entry failed:', error);
        setAlert({
          type: 'error',
          title: 'Σφάλμα',
          message: 'Αποτυχία διαγραφής. Δοκίμασε ξανά.',
        });
      }
    }

    setLibraryEntries(prev => prev.filter(item => item.id !== entry.id));
    if (selectedEntry?.id === entry.id) {
      setSelectedEntry(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--hb-bg)] px-4 py-20 text-[var(--hb-text)]">
      {alert && (
        <AlertMessage
          key={`${alert.type}-${alert.message}-${Date.now()}`}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          duration={2000}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className="absolute inset-0 -z-10 opacity-30 blur-[120px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,var(--hb-primary-strong),transparent_50%)]" />
          <div className="absolute inset-y-10 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_20%,var(--hb-accent),transparent_55%)]" />
        </div>

        <section className="rounded-3xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 shadow-[var(--hb-shadow-md)] backdrop-blur">
          <CategoryHeader
            category={category}
            username={username}
            onCreateClick={() => setCtaMode('create')}
            onSuggestionsClick={() => setCtaMode('suggestions')}
          />

          {ctaMode === 'create' && (
            <CreateEntryPanel
              category={category}
              searchQuery={createQuery}
              onSearchChange={setCreateQuery}
              searchResults={createResults}
              isLoading={createLoading}
              onOpenDialog={openEntryDialog}
              onClose={() => setCtaMode(null)}
              libraryEntries={libraryEntries}
            />
          )}

          {ctaMode === 'suggestions' && (
            <SuggestionsPanel
              suggestions={suggestions}
              isLoading={suggestionsLoading}
              onOpenDialog={openEntryDialog}
              onClose={() => setCtaMode(null)}
              libraryEntries={libraryEntries}
            />
          )}

          <CategoryStats category={category} totalEntries={libraryEntries.length} counts={counts} />
        </section>

        <StatusFilterBar
          category={category}
          search={search}
          onSearchChange={setSearch}
          activeStatus={activeStatus}
          onStatusChange={setActiveStatus}
        />

        {libraryError && <ErrorState error={libraryError} />}

        <LibraryEntryList
          category={category}
          entries={entries}
          isLoading={libraryLoading}
          onOpenDialog={openEntryDialog}
          onDelete={handleDeleteEntry}
        />

        <EntryEditDialog
          entry={selectedEntry}
          category={category}
          onClose={() => setSelectedEntry(null)}
          onSave={handleSaveEntry}
          onDelete={handleDeleteEntry}
        />
      </div>
    </div>
  );
}
