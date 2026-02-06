'use client';

import { useEffect, useMemo, useReducer, useCallback } from 'react';
import { mutate } from 'swr';
import ErrorState from '@/app/components/ui/ErrorState';
import AlertMessage from '@/app/components/ui/AlertMessage';
import { apiClient } from '@/lib/api/client';

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

type SelectedEntry = (MediaEntry & Partial<SearchResult>) | null;

type CategoryLibraryState = {
  search: string;
  activeStatus: MediaStatus | 'all';
  ctaMode: 'create' | 'suggestions' | null;
  libraryEntries: MediaEntry[];
  libraryLoading: boolean;
  libraryError: string | null;
  createQuery: string;
  createResults: SearchResult[];
  createLoading: boolean;
  suggestions: SearchResult[];
  suggestionsLoading: boolean;
  alert: AlertState;
  alertKey: number;
  selectedEntry: SelectedEntry;
};

type SelectedEntryDetails = {
  runtime?: number | null;
  number_of_episodes?: number | null;
  cover_image_large?: string | null;
  cover_image_medium?: string | null;
  banner_image?: string | null;
  genres?: string[] | null;
};

type CategoryLibraryAction =
  | { type: 'patch'; payload: Partial<CategoryLibraryState> }
  | {
      type: 'resetForCategory';
      payload: { search: string; activeStatus: MediaStatus | 'all' };
    }
  | { type: 'showAlert'; payload: AlertState }
  | { type: 'clearAlert' }
  | { type: 'applySelectedEntryDetails'; payload: SelectedEntryDetails };

const buildInitialState = (
  normalizedInitialSearch: string,
  normalizedInitialStatus: MediaStatus | 'all',
): CategoryLibraryState => ({
  search: normalizedInitialSearch,
  activeStatus: normalizedInitialStatus,
  ctaMode: null,
  libraryEntries: [],
  libraryLoading: false,
  libraryError: null,
  createQuery: '',
  createResults: [],
  createLoading: false,
  suggestions: [],
  suggestionsLoading: false,
  alert: null,
  alertKey: 0,
  selectedEntry: null,
});

function categoryLibraryReducer(
  state: CategoryLibraryState,
  action: CategoryLibraryAction,
): CategoryLibraryState {
  switch (action.type) {
    case 'patch':
      return { ...state, ...action.payload };
    case 'resetForCategory':
      return {
        ...state,
        search: action.payload.search,
        activeStatus: action.payload.activeStatus,
        ctaMode: null,
        createQuery: '',
        createResults: [],
      };
    case 'showAlert':
      return {
        ...state,
        alert: action.payload,
        alertKey: state.alertKey + 1,
      };
    case 'clearAlert':
      return { ...state, alert: null };
    case 'applySelectedEntryDetails': {
      if (!state.selectedEntry) return state;
      const details = action.payload;
      const totalRuntime = state.selectedEntry.totalRuntime ?? details.runtime ?? undefined;
      const totalEpisodes =
        state.selectedEntry.totalEpisodes ?? details.number_of_episodes ?? undefined;

      return {
        ...state,
        selectedEntry: {
          ...state.selectedEntry,
          totalRuntime,
          totalEpisodes,
          tags:
            state.selectedEntry.tags.length > 0
              ? state.selectedEntry.tags
              : (details.genres ?? []),
          cover:
            state.selectedEntry.cover ||
            details.cover_image_large ||
            details.cover_image_medium ||
            state.selectedEntry.cover,
          payload: {
            ...(state.selectedEntry.payload || {}),
            runtime: totalRuntime ?? null,
            number_of_episodes: totalEpisodes ?? null,
            cover_image_large: details.cover_image_large ?? null,
            cover_image_medium: details.cover_image_medium ?? null,
            banner_image: details.banner_image ?? null,
            genres: details.genres ?? [],
          },
        },
      };
    }
    default:
      return state;
  }
}

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
  const [state, dispatch] = useReducer(
    categoryLibraryReducer,
    buildInitialState(normalizedInitialSearch, normalizedInitialStatus),
  );

  const showAlert = (payload: AlertState) => {
    dispatch({ type: 'showAlert', payload });
  };
  const {
    search,
    activeStatus,
    ctaMode,
    libraryEntries,
    libraryLoading,
    libraryError,
    createQuery,
    createResults,
    createLoading,
    suggestions,
    suggestionsLoading,
    alert,
    alertKey,
    selectedEntry,
  } = state;

  const supportsExternal = supportsExternalApi(category);
  const apiBase = getApiBase(category);

  const loadLibraryEntries = useCallback(
    async (forceMocks = false) => {
      if (!supportsExternal || forceMocks) {
        dispatch({ type: 'patch', payload: { libraryEntries: [] } });
        return;
      }

      dispatch({ type: 'patch', payload: { libraryLoading: true, libraryError: null } });
      try {
        if (!apiBase) {
          dispatch({ type: 'patch', payload: { libraryEntries: [] } });
          return;
        }
        const data = await apiClient.getJsonOrThrow<{ items?: MediaEntry[] }>(
          `${apiBase}/library?category=${category}`,
        );
        const items = Array.isArray(data.items) ? data.items : [];
        dispatch({ type: 'patch', payload: { libraryEntries: items } });
      } catch (error) {
        console.warn('Library fetch failed:', error);
        dispatch({
          type: 'patch',
          payload: {
            libraryError: 'Αποτυχία φόρτωσης βιβλιοθήκης',
            libraryEntries: [],
          },
        });
      } finally {
        dispatch({ type: 'patch', payload: { libraryLoading: false } });
      }
    },
    [apiBase, category, supportsExternal],
  );

  useEffect(() => {
    dispatch({
      type: 'resetForCategory',
      payload: {
        activeStatus: normalizedInitialStatus,
        search: normalizedInitialSearch,
      },
    });
    
    
    
    
    loadLibraryEntries();
  }, [category, normalizedInitialStatus, normalizedInitialSearch, loadLibraryEntries]);

  useEffect(() => {
    if (ctaMode !== 'create') return;

    if (!supportsExternal) {
      dispatch({ type: 'patch', payload: { createResults: [] } });
      return;
    }

    const query = createQuery.trim();
    if (!query) {
      dispatch({ type: 'patch', payload: { createResults: [] } });
      return;
    }

    const timeout = setTimeout(async () => {
      dispatch({ type: 'patch', payload: { createLoading: true } });
      try {
        if (!apiBase) {
          dispatch({ type: 'patch', payload: { createResults: [] } });
          return;
        }
        const response = await apiClient.request(
          `${apiBase}/search?category=${category}&q=${encodeURIComponent(query)}`,
        );
        if (!response.ok) {
          dispatch({ type: 'patch', payload: { createResults: [] } });
          return;
        }
        const data = (await response.json()) as { items?: SearchResult[] };
        const items = Array.isArray(data.items) ? data.items : [];
        dispatch({ type: 'patch', payload: { createResults: items } });
      } catch (error) {
        console.warn('Create search failed:', error);
        dispatch({ type: 'patch', payload: { createResults: [] } });
      } finally {
        dispatch({ type: 'patch', payload: { createLoading: false } });
      }
    }, 350);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, createQuery, ctaMode, supportsExternal]);

  useEffect(() => {
    if (ctaMode !== 'suggestions') return;
    if (!supportsExternal) {
      dispatch({ type: 'patch', payload: { suggestions: [] } });
      return;
    }
    let ignore = false;
    const loadSuggestions = async () => {
      dispatch({ type: 'patch', payload: { suggestionsLoading: true } });
      try {
        if (!apiBase) {
          dispatch({ type: 'patch', payload: { suggestions: [] } });
          return;
        }
        const data = await apiClient.getJsonOrThrow<{ items?: SearchResult[] }>(
          `${apiBase}/suggestions?category=${category}`,
        );
        const items = Array.isArray(data.items) ? data.items : [];
        if (!ignore) {
          dispatch({ type: 'patch', payload: { suggestions: items } });
        }
      } catch (error) {
        console.warn('Suggestions fetch failed:', error);
        if (!ignore) {
          dispatch({ type: 'patch', payload: { suggestions: [] } });
        }
      } finally {
        if (!ignore) {
          dispatch({ type: 'patch', payload: { suggestionsLoading: false } });
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
    dispatch({ type: 'patch', payload: { selectedEntry: nextEntry } });

    if (
      (category === 'movies' || category === 'tv') &&
      entry.externalId &&
      !nextEntry.totalRuntime &&
      !nextEntry.totalEpisodes
    ) {
      apiClient
        .request(`/api/movies/details?category=${category}&tmdb_id=${entry.externalId}`)
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
          dispatch({ type: 'applySelectedEntryDetails', payload: details });
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
        const response = await apiClient.request(`${apiBase}/library`, {
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
        showAlert({
          type: 'success',
          title: 'Αποθηκεύτηκε',
          message: 'Οι αλλαγές αποθηκεύτηκαν επιτυχώς.',
        });
      } catch (error) {
        console.warn('Update entry failed:', error);
        showAlert({
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
        const response = await apiClient.request(`${apiBase}/add`, {
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
        showAlert({
          type: 'success',
          title: 'Επιτυχής προσθήκη',
          message: `Το "${selectedEntry.title}" προστέθηκε στη βιβλιοθήκη σου.`,
        });
      } catch (error) {
        console.warn('Add entry failed:', error);
        showAlert({
          type: 'error',
          title: 'Σφάλμα',
          message: 'Αποτυχία προσθήκης. Δοκίμασε ξανά.',
        });
      }
    } else {
      dispatch({
        type: 'patch',
        payload: {
          libraryEntries: libraryEntries.map(entry =>
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
        },
      });
      showAlert({
        type: 'success',
        title: 'Αποθηκεύτηκε',
        message: 'Οι αλλαγές αποθηκεύτηκαν επιτυχώς.',
      });
    }

    dispatch({ type: 'patch', payload: { selectedEntry: null } });
  };

  const handleDeleteEntry = async (entry: MediaEntry) => {
    if (!entry.mediaId) {
      dispatch({
        type: 'patch',
        payload: { libraryEntries: libraryEntries.filter(item => item.id !== entry.id) },
      });
      if (selectedEntry?.id === entry.id) {
        dispatch({ type: 'patch', payload: { selectedEntry: null } });
      }
      return;
    }

    if (supportsExternal) {
      try {
        if (!apiBase) {
          throw new Error('Missing API base');
        }
        const response = await apiClient.request(`${apiBase}/library`, {
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
          dispatch({ type: 'patch', payload: { selectedEntry: null } });
        }
        showAlert({
          type: 'success',
          title: 'Διαγράφηκε',
          message: `Το "${entry.title}" αφαιρέθηκε από τη βιβλιοθήκη.`,
        });
        return;
      } catch (error) {
        console.warn('Delete entry failed:', error);
        showAlert({
          type: 'error',
          title: 'Σφάλμα',
          message: 'Αποτυχία διαγραφής. Δοκίμασε ξανά.',
        });
      }
    }

    dispatch({
      type: 'patch',
      payload: { libraryEntries: libraryEntries.filter(item => item.id !== entry.id) },
    });
    if (selectedEntry?.id === entry.id) {
      dispatch({ type: 'patch', payload: { selectedEntry: null } });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--hb-bg)] px-3 py-20 text-[var(--hb-text)] sm:px-4">
      {alert && (
        <AlertMessage
          key={alertKey}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          duration={2000}
          onClose={() => dispatch({ type: 'clearAlert' })}
        />
      )}

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className="absolute inset-0 -z-10 opacity-30 blur-[120px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,var(--hb-primary-strong),transparent_50%)]" />
          <div className="absolute inset-y-10 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_20%,var(--hb-accent),transparent_55%)]" />
        </div>

        <section className="rounded-3xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-4 shadow-[var(--hb-shadow-md)] backdrop-blur sm:p-6">
          <CategoryHeader
            category={category}
            username={username}
            onCreateClick={() => dispatch({ type: 'patch', payload: { ctaMode: 'create' } })}
            onSuggestionsClick={() =>
              dispatch({ type: 'patch', payload: { ctaMode: 'suggestions' } })
            }
          />

          {ctaMode === 'create' && (
            <CreateEntryPanel
              category={category}
              searchQuery={createQuery}
              onSearchChange={value =>
                dispatch({ type: 'patch', payload: { createQuery: value } })
              }
              searchResults={createResults}
              isLoading={createLoading}
              onOpenDialog={openEntryDialog}
              onClose={() => dispatch({ type: 'patch', payload: { ctaMode: null } })}
              libraryEntries={libraryEntries}
            />
          )}

          {ctaMode === 'suggestions' && (
            <SuggestionsPanel
              suggestions={suggestions}
              isLoading={suggestionsLoading}
              onOpenDialog={openEntryDialog}
              onClose={() => dispatch({ type: 'patch', payload: { ctaMode: null } })}
              libraryEntries={libraryEntries}
            />
          )}

          <CategoryStats category={category} totalEntries={libraryEntries.length} counts={counts} />
        </section>

        <StatusFilterBar
          category={category}
          search={search}
          onSearchChange={value => dispatch({ type: 'patch', payload: { search: value } })}
          activeStatus={activeStatus}
          onStatusChange={value => dispatch({ type: 'patch', payload: { activeStatus: value } })}
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
          onClose={() => dispatch({ type: 'patch', payload: { selectedEntry: null } })}
          onSave={handleSaveEntry}
          onDelete={handleDeleteEntry}
        />
      </div>
    </div>
  );
}

