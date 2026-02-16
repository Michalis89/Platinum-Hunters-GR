'use client';

import {
  useEffect,
  useMemo,
  useReducer,
  useCallback,
  useState,
  useTransition,
  useRef,
} from 'react';
import { mutate } from 'swr';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle, ErrorAlert } from '@/components/ui/alert';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { apiClient } from '@/lib/api/client';
import { yieldToMain } from '@/lib/performance';

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
  type: 'success' | 'error' | 'warning' | 'info';
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
            state.selectedEntry.tags.length > 0 ? state.selectedEntry.tags : (details.genres ?? []),
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
  const steamPollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const normalizedInitialStatus = initialStatus ?? 'all';
  const normalizedInitialSearch = initialSearch?.trim() ?? '';
  const [state, dispatch] = useReducer(
    categoryLibraryReducer,
    buildInitialState(normalizedInitialSearch, normalizedInitialStatus),
  );

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (steamPollIntervalRef.current) {
        clearInterval(steamPollIntervalRef.current);
      }
    };
  }, []);

  const showAlert = useCallback(
    (payload: AlertState) => {
      dispatch({ type: 'showAlert', payload });
    },
    [dispatch],
  );
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
  const selectedEntryRef = useRef<SelectedEntry | null>(selectedEntry);

  useEffect(() => {
    selectedEntryRef.current = selectedEntry;
  }, [selectedEntry]);

  const loadLibraryEntries = useCallback(
    async (forceMocks = false, refreshSelectedEntry = false) => {
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
        if (refreshSelectedEntry && selectedEntryRef.current) {
          const refreshed = items.find(item => item.id === selectedEntryRef.current?.id);
          if (refreshed) {
            dispatch({
              type: 'patch',
              payload: {
                selectedEntry: {
                  ...selectedEntryRef.current,
                  ...refreshed,
                },
              },
            });
          }
        }
      } catch (error) {
        console.warn('Library fetch failed:', error);
        dispatch({
          type: 'patch',
          payload: {
            libraryError: 'Failed to load library.',
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
          `/api/backlog/personal-suggestions?category=${category}`,
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

  const [, startTransition] = useTransition();
  const openEntryDialog = useCallback(
    (entry: MediaEntry & Partial<SearchResult>) => {
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
      startTransition(() => {
        dispatch({ type: 'patch', payload: { selectedEntry: nextEntry } });
      });

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
            startTransition(() => {
              dispatch({ type: 'applySelectedEntryDetails', payload: details });
            });
          })
          .catch(error => {
            console.warn('TMDB details fetch failed:', error);
          });
      }

      // Fetch IGDB details for games from external source
      if (
        category === 'games' &&
        entry.source === 'external' &&
        entry.externalId &&
        !entry.description
      ) {
        apiClient
          .request(`/api/games/igdb-details?igdbId=${entry.externalId}`)
          .then(async response => {
            if (!response.ok) {
              return null;
            }
            return (await response.json()) as {
              description?: string | null;
              platforms?: string[] | null;
              payload?: Record<string, unknown>;
            };
          })
          .then(details => {
            if (!details) return;
            startTransition(() => {
              dispatch({
                type: 'patch',
                payload: {
                  selectedEntry: selectedEntryRef.current
                    ? {
                        ...selectedEntryRef.current,
                        description: details.description ?? selectedEntryRef.current.description,
                        platforms: details.platforms ?? selectedEntryRef.current.platforms,
                        payload: details.payload ?? selectedEntryRef.current.payload,
                      }
                    : null,
                },
              });
            });
          })
          .catch(error => {
            console.warn('IGDB details fetch failed:', error);
          });
      }
    },
    [category, dispatch, startTransition],
  );

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
    const hasPlayedHours =
      typeof nextProgressValue === 'number' &&
      Number.isFinite(nextProgressValue) &&
      nextProgressValue > 0;
    let finalStatus = nextStatus;
    if (category === 'games' && nextStatus === 'current' && !hasPlayedHours) {
      finalStatus = 'planned';
    }
    const nextFavorite = editState.isFavorite;

    // Close dialog immediately for instant feedback (improves INP)
    startTransition(() => {
      dispatch({ type: 'patch', payload: { selectedEntry: null } });
    });

    // Yield to main thread to allow browser to paint the closed dialog
    await yieldToMain();

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
            status: finalStatus,
            is_favorite: nextFavorite,
            selected_platform:
              category === 'games' ? editState.selectedPlatform || null : undefined,
            progress: nextProgressValue,
            score: nextScore,
            notes: editState.notes || null,
          }),
        });
        if (!response.ok) {
          throw new Error('Failed to update entry');
        }

        // Defer expensive operations
        await yieldToMain();
        await loadLibraryEntries();
        await yieldToMain();
        await mutate('/api/user/continue');

        showAlert({
          type: 'success',
          title: 'Saved',
          message: 'Changes saved.',
        });
      } catch (error) {
        console.warn('Update entry failed:', error);
        showAlert({
          type: 'error',
          title: 'Error',
          message: 'Could not save changes. Try again.',
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

        // Defer expensive operations
        await yieldToMain();
        await loadLibraryEntries();
        await yieldToMain();
        await mutate('/api/user/continue');

        showAlert({
          type: 'success',
          title: 'Added',
          message: `"${selectedEntry.title}" was added to your library.`,
        });
      } catch (error) {
        console.warn('Add entry failed:', error);
        showAlert({
          type: 'error',
          title: 'Error',
          message: 'Could not add entry. Try again.',
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
        title: 'Saved',
        message: 'Changes saved.',
      });
    }
  };

  const normalizedProgressPercent = (() => {
    const percent = steamSyncProgress?.percent;
    if (typeof percent === 'number' && Number.isFinite(percent)) {
      return Math.max(0, Math.min(100, percent));
    }
    return 0;
  })();
  const stepLabel = `${steamSyncProgress?.completedSteps ?? 0} / ${
    steamSyncProgress?.totalSteps ?? 0
  } steps`;
  const statusLabel = steamSyncProgress?.status
    ? steamSyncProgress.status.charAt(0).toUpperCase() + steamSyncProgress.status.slice(1)
    : 'Running';

  const handleDeleteEntry = useCallback(
    async (entry: MediaEntry) => {
      const clearSelection = () => {
        startTransition(() => {
          dispatch({ type: 'patch', payload: { selectedEntry: null } });
        });
      };

      if (!entry.mediaId) {
        dispatch({
          type: 'patch',
          payload: { libraryEntries: libraryEntries.filter(item => item.id !== entry.id) },
        });
        clearSelection();
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
          clearSelection();
          showAlert({
            type: 'success',
            title: 'Removed',
            message: `"${entry.title}" was removed from your library.`,
          });
          return;
        } catch (error) {
          console.warn('Delete entry failed:', error);
          showAlert({
            type: 'error',
            title: 'Error',
            message: 'Could not remove entry. Try again.',
          });
        }
      }

      dispatch({
        type: 'patch',
        payload: { libraryEntries: libraryEntries.filter(item => item.id !== entry.id) },
      });
      clearSelection();
    },
    [
      apiBase,
      dispatch,
      libraryEntries,
      loadLibraryEntries,
      showAlert,
      startTransition,
      supportsExternal,
    ],
  );

  const handleSteamSync = async () => {
    try {
      // Clear any existing poll interval
      if (steamPollIntervalRef.current) {
        clearInterval(steamPollIntervalRef.current);
        steamPollIntervalRef.current = null;
      }

      setSteamSyncing(true);
      setSteamSyncProgress({
        id: 'starting',
        status: 'running',
        message: 'Starting sync...',
        percent: 0,
        completedSteps: 0,
        totalSteps: 1,
      });

      // Step 1: Start the sync (fetch Steam games and create job)
      const startResponse = await apiClient.request('/api/integrations/steam/sync/start', {
        method: 'POST',
      });

      if (!startResponse.ok) {
        const data = (await startResponse.json()) as { error?: string };
        throw new Error(data.error || 'Failed to start Steam sync');
      }

      const startData = (await startResponse.json()) as {
        jobId: string | null;
        totalGames: number;
        batchSize: number;
        estimatedBatches: number;
        message: string;
      };

      if (!startData.jobId) {
        // No games found
        showAlert({
          type: 'info',
          title: 'Steam Sync',
          message: startData.message || 'No games found.',
        });
        setSteamSyncing(false);
        setSteamSyncProgress(null);
        return;
      }

      const jobId = startData.jobId;

      setSteamSyncProgress({
        id: jobId,
        status: 'running',
        message: `Found ${startData.totalGames} games. Processing...`,
        percent: 0,
        completedSteps: 0,
        totalSteps: startData.totalGames,
      });

      // Step 2: Process batches in a loop
      let isComplete = false;
      let processBatchCount = 0;

      while (!isComplete) {
        processBatchCount += 1;
        console.log(`ðŸ”„ Processing batch ${processBatchCount}...`);

        const processResponse = await apiClient.request(
          `/api/integrations/steam/sync/process?jobId=${jobId}`,
          { method: 'POST' },
        );

        if (!processResponse.ok) {
          const data = (await processResponse.json()) as { error?: string };
          throw new Error(data.error || 'Failed to process batch');
        }

        const processData = (await processResponse.json()) as {
          processed: number;
          totalGames: number;
          isComplete: boolean;
          percent: number;
          message: string;
        };

        isComplete = processData.isComplete;

        // Update progress
        setSteamSyncProgress({
          id: jobId,
          status: isComplete ? 'completed' : 'running',
          message: processData.message,
          percent: processData.percent,
          completedSteps: processData.processed,
          totalSteps: processData.totalGames,
        });

        // Add a small delay between batches to avoid rate limiting
        if (!isComplete) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Step 3: Sync completed successfully
      await loadLibraryEntries();
      await mutate('/api/user/continue');

      showAlert({
        type: 'success',
        title: 'Steam sync complete',
        message: `Synced ${startData.totalGames} games from Steam.`,
      });

      setSteamSyncing(false);
      setSteamSyncProgress(null);
    } catch (error) {
      console.warn('Steam sync failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showAlert({
        type: 'error',
        title: 'Error',
        message: `Steam sync failed. ${errorMessage}`,
      });
      setSteamSyncing(false);
      setSteamSyncProgress(null);

      if (steamPollIntervalRef.current) {
        clearInterval(steamPollIntervalRef.current);
        steamPollIntervalRef.current = null;
      }
    }
  };

  return (
    <div className="relative min-h-screen px-3 py-12 text-foreground sm:px-4 sm:py-16">
      {alert && (
        <Alert
          key={alertKey}
          variant={
            alert.type === 'error'
              ? 'destructive'
              : alert.type === 'success'
                ? 'success'
                : alert.type === 'warning'
                  ? 'warning'
                  : 'info'
          }
          className="mb-6"
        >
          {alert.type === 'success' && <CheckCircle className="h-4 w-4" />}
          {alert.type === 'error' && <XCircle className="h-4 w-4" />}
          {alert.type === 'warning' && <AlertTriangle className="h-4 w-4" />}
          {alert.type === 'info' && <Info className="h-4 w-4" />}
          {alert.title && <AlertTitle>{alert.title}</AlertTitle>}
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <div className="relative mx-auto flex w-full max-w-screen-2xl flex-col gap-5 sm:gap-6">
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_16%,hsl(var(--primary)/0.2),transparent_54%)]" />
          <div className="absolute inset-y-10 right-0 w-1/2 bg-[radial-gradient(circle_at_82%_20%,hsl(var(--primary)/0.16),transparent_58%)]" />
        </div>

        <section className="space-y-6">
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
              onSearchChange={value => dispatch({ type: 'patch', payload: { createQuery: value } })}
              searchResults={createResults}
              isLoading={createLoading}
              onOpenDialog={openEntryDialog}
              onClose={() => dispatch({ type: 'patch', payload: { ctaMode: null } })}
              libraryEntries={libraryEntries}
            />
          )}

          <CategoryStats
            category={category}
            totalEntries={libraryEntries.length}
            activeStatus={activeStatus}
            onStatusChange={value => dispatch({ type: 'patch', payload: { activeStatus: value } })}
            counts={counts}
          />
        </section>

        <div className="px-1 sm:px-0">
          <StatusFilterBar
            category={category}
            search={search}
            onSearchChange={value => dispatch({ type: 'patch', payload: { search: value } })}
            activeStatus={activeStatus}
            onStatusChange={value => dispatch({ type: 'patch', payload: { activeStatus: value } })}
          />
        </div>

        {libraryError && (
          <div className="rounded-[20px] p-2 sm:p-3">
            <ErrorAlert message={libraryError} />
          </div>
        )}

        <div className="rounded-2xl border border-border/70 bg-card/40 p-3 sm:p-4">
          <LibraryEntryList
            category={category}
            entries={entries}
            isLoading={libraryLoading}
            onOpenDialog={openEntryDialog}
            onDelete={handleDeleteEntry}
            onCreateClick={() => dispatch({ type: 'patch', payload: { ctaMode: 'create' } })}
          />
        </div>

        <EntryEditDialog
          entry={selectedEntry}
          category={category}
          onClose={() => dispatch({ type: 'patch', payload: { selectedEntry: null } })}
          onSave={handleSaveEntry}
          onDelete={handleDeleteEntry}
          onRefreshEntry={loadLibraryEntries}
        />
      </div>

      <Sheet
        open={ctaMode === 'suggestions'}
        onOpenChange={open => {
          dispatch({ type: 'patch', payload: { ctaMode: open ? 'suggestions' : null } });
        }}
      >
        <SheetContent side="right" className="w-full max-w-xl border-border/70 bg-card p-0">
          <div className="flex h-full flex-col">
            <SheetHeader className="border-b border-border/70 px-6 py-5">
              <SheetTitle>Personal Suggestions</SheetTitle>
              <SheetDescription>Recommendations based on your taste profile.</SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-6">
              <SuggestionsPanel
                suggestions={suggestions}
                isLoading={suggestionsLoading}
                onOpenDialog={openEntryDialog}
                libraryEntries={libraryEntries}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {steamSyncing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm">
          <div className="pointer-events-auto w-full max-w-2xl rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-slate-950/90 p-6 text-white shadow-2xl shadow-violet-500/20">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-white">Steam sync with IGDB metadata</p>
                <p className="text-sm text-slate-300">
                  {steamSyncProgress?.message ??
                    'Fetching metadata, cover images, and updating entries. Please wait...'}
                </p>
              </div>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-100">
                {statusLabel}
              </span>
            </div>
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                <span>Progress</span>
                <span>{normalizedProgressPercent}%</span>
              </div>
              <div className="overflow-hidden rounded-full border border-white/10 bg-slate-900/70">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 shadow-[0_0_18px_rgba(192,132,252,0.65)] transition-[width] duration-700 ease-out"
                  style={{ width: `${normalizedProgressPercent}%` }}
                />
              </div>
              <p className="text-xs text-slate-300">{stepLabel}</p>
            </div>
            {steamSyncProgress?.error && (
              <p className="mt-2 text-xs font-semibold text-rose-400">
                Error: {steamSyncProgress.error}
              </p>
            )}
            {steamSyncProgress?.result && (
              <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-100 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.15em] text-slate-400">Games</p>
                  <p className="text-lg font-semibold text-white">
                    {steamSyncProgress.result.totalFetched ?? 0}
                  </p>
                  <p className="text-xs text-slate-400">total</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.15em] text-slate-400">Imported</p>
                  <p className="text-lg font-semibold text-white">
                    {steamSyncProgress.result.mediaInserted ?? 0}
                  </p>
                  <p className="text-xs text-slate-400">new entries</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.15em] text-slate-400">Updated</p>
                  <p className="text-lg font-semibold text-white">
                    {steamSyncProgress.result.mediaUpdated ?? 0}
                  </p>
                  <p className="text-xs text-slate-400">updated entries</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
