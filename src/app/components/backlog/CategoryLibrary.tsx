'use client';

import { useEffect, useMemo, useReducer, useCallback, useState } from 'react';
import { mutate } from 'swr';
import ErrorState from '@/app/components/ui/ErrorState';
import AlertMessage from '@/app/components/ui/AlertMessage';
import { apiClient } from '@/lib/api/client';
import { Progress } from '@/components/ui/progress';

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

type SteamSyncStatus = 'running' | 'completed' | 'failed';

type SteamSyncJobSnapshot = {
  id: string;
  status: SteamSyncStatus;
  message: string;
  percent: number;
  completedSteps: number;
  totalSteps: number;
  error?: string;
  result?: {
    totalFetched: number;
    mediaInserted: number;
    mediaUpdated: number;
    mediaInsertFailed?: number;
    mediaUpdateFailed?: number;
    entriesInserted: number;
    entriesUpdated: number;
    entriesUpsertFailed?: number;
    warnings?: string[];
  };
};

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
  steamId,
  initialStatus = 'all',
  initialSearch,
}: Readonly<{
  category: MediaCategory;
  username?: string | null;
  steamId?: string | null;
  initialStatus?: MediaStatus | 'all';
  initialSearch?: string;
}>) {
  const [steamSyncing, setSteamSyncing] = useState(false);
  const [steamSyncProgress, setSteamSyncProgress] = useState<SteamSyncJobSnapshot | null>(null);
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
            selected_platform:
              category === 'games' ? (editState.selectedPlatform || null) : undefined,
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
                selectedPlatform: editState.selectedPlatform || undefined,
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

  const handleSteamSync = async () => {
    try {
      setSteamSyncing(true);
      setSteamSyncProgress({
        id: 'starting',
        status: 'running',
        message: 'Ξεκινά ο συγχρονισμός Steam...',
        percent: 0,
        completedSteps: 0,
        totalSteps: 1,
      });

      const response = await apiClient.request('/api/integrations/steam/sync?async=1', {
        method: 'POST',
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || 'Steam sync failed');
      }

      const startData = (await response.json()) as { jobId?: string };
      if (!startData.jobId) {
        throw new Error('Steam sync job did not start');
      }

      let finalSnapshot: SteamSyncJobSnapshot | null = null;
      while (true) {
        const jobResponse = await apiClient.request(
          `/api/integrations/steam/sync?jobId=${encodeURIComponent(startData.jobId)}`,
          { cache: 'no-store' },
        );
        if (!jobResponse.ok) {
          throw new Error('Steam sync progress failed');
        }

        const snapshot = (await jobResponse.json()) as SteamSyncJobSnapshot;
        setSteamSyncProgress(snapshot);
        if (snapshot.status === 'completed' || snapshot.status === 'failed') {
          finalSnapshot = snapshot;
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 900));
      }

      if (!finalSnapshot || finalSnapshot.status !== 'completed') {
        throw new Error(finalSnapshot?.error || 'Steam sync failed');
      }

      await loadLibraryEntries();
      await mutate('/api/user/continue');
      showAlert({
        type: 'success',
        title: 'Ο συγχρονισμός Steam ολοκληρώθηκε',
        message:
          (finalSnapshot.result?.warnings?.length ?? 0) > 0
            ? `Ολοκληρώθηκε με προειδοποιήσεις: ${finalSnapshot.result?.warnings?.join(' | ')}`
            : `Έγινε enrich σε ${finalSnapshot.result?.totalFetched ?? 0} παιχνίδια από RAWG/Steam.`,
      });
    } catch (error) {
      console.warn('Steam sync failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Άγνωστο σφάλμα';
      showAlert({
        type: 'error',
        title: 'Σφάλμα',
        message: `Ο συγχρονισμός Steam απέτυχε. ${errorMessage}`,
      });
    } finally {
      setSteamSyncing(false);
      setSteamSyncProgress(null);
    }
  };

  if (steamSyncing) {
    return (
      <div className="apple-page-background min-h-screen px-3 py-16 text-[var(--hb-text)] sm:px-4 sm:py-20">
        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 sm:gap-8">
          <section className="apple-material-surface p-4 sm:p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-56 rounded-[12px] bg-[var(--hb-card)]" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="h-10 rounded-[12px] bg-[var(--hb-card)]" />
                <div className="h-10 rounded-[12px] bg-[var(--hb-card)]" />
                <div className="h-10 rounded-[12px] bg-[var(--hb-card)]" />
              </div>
            </div>
          </section>
          <section className="apple-material-surface p-4 sm:p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-12 rounded-[12px] bg-[var(--hb-card)]" />
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-24 rounded-[12px] bg-[var(--hb-card)]" />
              ))}
            </div>
          </section>

          <div className="hb-dialog-overlay absolute inset-0 z-10 flex items-center justify-center rounded-[28px] p-3 sm:p-6">
            <div className="hb-dialog-surface w-full max-w-xl rounded-[20px] border border-[var(--hb-dialog-border)] p-4 sm:p-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="apple-body-tracking text-sm font-semibold text-[var(--apple-label)]">
                  Συγχρονισμός Steam με RAWG metadata
                </p>
                <span className="text-xs font-semibold text-[var(--apple-secondary-label)]">
                  {steamSyncProgress?.percent ?? 0}%
                </span>
              </div>
              <Progress
                value={steamSyncProgress?.percent ?? 0}
                className="apple-progress-track h-2.5 rounded-full"
              />
              <p className="mt-3 text-xs text-[var(--apple-secondary-label)]">
                {steamSyncProgress?.message ??
                  'Γίνεται ανάκτηση metadata, cover images και ενημέρωση entries. Παρακαλώ περίμενε...'}
              </p>
              <p className="mt-1 text-xs text-[var(--apple-secondary-label)]/80">
                {steamSyncProgress?.completedSteps ?? 0} / {steamSyncProgress?.totalSteps ?? 0}{' '}
                βήματα
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="apple-page-background min-h-screen px-3 py-16 text-[var(--hb-text)] sm:px-4 sm:py-20">
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

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 sm:gap-8">
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-40 blur-[110px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,color-mix(in_srgb,var(--apple-system-blue)_20%,transparent),transparent_52%)]" />
          <div className="absolute inset-y-10 right-0 w-1/2 bg-[radial-gradient(circle_at_82%_20%,color-mix(in_srgb,var(--apple-system-blue)_14%,#34c759),transparent_58%)]" />
        </div>

        <section className="apple-material-surface p-4 sm:p-6">
          <CategoryHeader
            category={category}
            username={username}
            steamId={steamId}
            isSteamSyncing={steamSyncing}
            onSteamSyncClick={handleSteamSync}
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

        {libraryError && (
          <div className="apple-card rounded-[20px] border-[var(--apple-separator)] p-4">
            <ErrorState error={libraryError} />
          </div>
        )}

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
          onRefreshEntry={loadLibraryEntries}
        />
      </div>
    </div>
  );
}

