/**
 * Backlog Redux Slice
 * PH-31: User Backlog System
 */

import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import type { UserBacklogWithGame } from '@/types/interfaces';
import type { RootState } from '../store';

/**
 * Backlog Stats Interface
 */
interface BacklogStats {
  totalGames: number;
  totalHours: number;
  totalPlayedHours: number;
  trophiesRemaining: {
    platinum: number;
    gold: number;
    silver: number;
    bronze: number;
    total: number;
  };
  trophiesEarned: {
    platinum: number;
    gold: number;
    silver: number;
    bronze: number;
    total: number;
  };
  platformBreakdown: Record<string, number>;
  difficultyAverage: number;
  recentlyAdded: UserBacklogWithGame[];
}

/**
 * Backlog State Interface
 */
interface BacklogState {
  items: UserBacklogWithGame[];
  isLoading: boolean;
  error: string | null;
  stats: BacklogStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

/**
 * Initial state
 */
const initialState: BacklogState = {
  items: [],
  isLoading: false,
  error: null,
  stats: {
    totalGames: 0,
    totalHours: 0,
    totalPlayedHours: 0,
    trophiesRemaining: {
      platinum: 0,
      gold: 0,
      silver: 0,
      bronze: 0,
      total: 0,
    },
    trophiesEarned: {
      platinum: 0,
      gold: 0,
      silver: 0,
      bronze: 0,
      total: 0,
    },
    platformBreakdown: {},
    difficultyAverage: 0,
    recentlyAdded: [],
  },
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
  },
};

/**
 * Thunk: Fetch backlog
 */
export const fetchBacklog = createAsyncThunk(
  'backlog/fetch',
  async ({ page = 1, limit = 50 }: { page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    qs.set('page', page.toString());
    qs.set('limit', limit.toString());
    const response = await fetch(`/api/backlog?${qs.toString()}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const message = error.error || 'Σφάλμα φόρτωσης backlog';
      if (response.status === 401 || response.status === 403) {
        throw new Error('UNAUTHORIZED');
      }
      throw new Error(message);
    }

    const data = await response.json();
    return data as {
      data: UserBacklogWithGame[];
      pagination?: { page: number; limit: number; total: number };
    };
  },
);

/**
 * Thunk: Add to backlog
 */
export const addToBacklog = createAsyncThunk(
  'backlog/add',
  async ({
    game_id,
    priority = 0,
    notes = null,
    personal_rating = null,
    personal_difficulty = null,
    would_recommend = null,
    is_favorite = false,
  }: {
    game_id: number;
    priority?: number;
    notes?: string | null;
    personal_rating?: number | null;
    personal_difficulty?: number | null;
    would_recommend?: boolean | null;
    is_favorite?: boolean;
  }) => {
    const response = await fetch('/api/backlog', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game_id,
        priority,
        notes,
        personal_rating,
        personal_difficulty,
        would_recommend,
        is_favorite,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Σφάλμα προσθήκης στο backlog');
    }

    const data = await response.json();
    return data as UserBacklogWithGame;
  },
);

/**
 * Thunk: Update backlog item
 */
export const updateBacklogItem = createAsyncThunk(
  'backlog/update',
  async ({
    id,
    status,
    priority,
    notes,
    actual_hours_casual,
    actual_hours_platinum,
    personal_rating,
    personal_difficulty,
    would_recommend,
    is_favorite,
  }: {
    id: number;
    status?: 'to_play' | 'playing' | 'completed' | 'platinumed' | 'dropped';
    priority?: number;
    notes?: string | null;
    actual_hours_casual?: number | null;
    actual_hours_platinum?: number | null;
    personal_rating?: number | null;
    personal_difficulty?: number | null;
    would_recommend?: boolean | null;
    is_favorite?: boolean;
  }) => {
    const response = await fetch(`/api/backlog/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        priority,
        notes,
        actual_hours_casual,
        actual_hours_platinum,
        personal_rating,
        personal_difficulty,
        would_recommend,
        is_favorite,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Σφάλμα ενημέρωσης παιχνιδιού');
    }

    const data = await response.json();
    return data as UserBacklogWithGame;
  },
);

/**
 * Thunk: Remove from backlog
 */
export const removeFromBacklog = createAsyncThunk('backlog/remove', async (id: number) => {
  const response = await fetch(`/api/backlog/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Σφάλμα διαγραφής από backlog');
  }

  return id;
});

/**
 * Calculate stats from backlog items
 */
const calculateStats = (items: UserBacklogWithGame[]): BacklogStats => {
  const sumTrophies = (list: UserBacklogWithGame[]) =>
    list.reduce(
      (acc, item) => {
        const game = item.game;
        if (game) {
          acc.platinum += game.trophy_platinum || 0;
          acc.gold += game.trophy_gold || 0;
          acc.silver += game.trophy_silver || 0;
          acc.bronze += game.trophy_bronze || 0;
        }
        return acc;
      },
      { platinum: 0, gold: 0, silver: 0, bronze: 0, total: 0 },
    );

  const activeItems = items.filter(item => item.status === 'to_play' || item.status === 'playing');
  const finishedItems = items.filter(item => item.status === 'completed' || item.status === 'platinumed');
  const platinumedItems = items.filter(item => item.status === 'platinumed');
  const totalGames = items.length;
  const totalHours = activeItems.reduce((sum, item) => sum + (item.game?.average_hours || 0), 0);
  const totalPlayedHours = finishedItems.reduce((sum, item) => {
    const actual =
      item.actual_hours_casual ??
      item.actual_hours_platinum ??
      item.game?.average_hours ??
      0;
    return sum + (actual || 0);
  }, 0);

  const trophiesRemaining = sumTrophies(activeItems);
  trophiesRemaining.total =
    trophiesRemaining.platinum +
    trophiesRemaining.gold +
    trophiesRemaining.silver +
    trophiesRemaining.bronze;

  const trophiesEarned = sumTrophies(platinumedItems);
  trophiesEarned.total =
    trophiesEarned.platinum +
    trophiesEarned.gold +
    trophiesEarned.silver +
    trophiesEarned.bronze;

  // Platform breakdown would require platform data from games
  // For now, we'll leave it empty - can be enhanced later
  const platformBreakdown: Record<string, number> = {};

  const difficultyAverage =
    activeItems.reduce((sum, item) => sum + (item.game?.average_difficulty || 0), 0) /
    (activeItems.length || 1);

  const recentlyAdded = [...items]
    .sort((a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime())
    .slice(0, 5);

  return {
    totalGames,
    totalHours: Math.round(totalHours * 10) / 10,
    totalPlayedHours: Math.round(totalPlayedHours * 10) / 10,
    trophiesRemaining,
    trophiesEarned,
    platformBreakdown,
    difficultyAverage: Math.round(difficultyAverage * 10) / 10,
    recentlyAdded,
  };
};

/**
 * Backlog Slice
 */
const backlogSlice = createSlice({
  name: 'backlog',
  initialState,
  reducers: {
    clearBacklog: state => {
      state.items = [];
      state.error = null;
      state.stats = initialState.stats;
    },
    clearBacklogError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch backlog
      .addCase(fetchBacklog.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchBacklog.fulfilled,
        (
          state,
          action: PayloadAction<{
            data: UserBacklogWithGame[];
            pagination?: { page: number; limit: number; total: number };
          }>,
        ) => {
        state.isLoading = false;
          state.items =
            action.payload.pagination?.page && action.payload.pagination.page > 1
              ? [...state.items, ...action.payload.data]
              : action.payload.data;
          state.stats = calculateStats(state.items);
          state.pagination = {
            page: action.payload.pagination?.page ?? 1,
            limit: action.payload.pagination?.limit ?? state.pagination.limit,
            total: action.payload.pagination?.total ?? action.payload.data.length,
          };
      })
      .addCase(fetchBacklog.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Σφάλμα φόρτωσης backlog';
      })
      // Add to backlog
      .addCase(addToBacklog.pending, state => {
        state.error = null;
      })
      .addCase(addToBacklog.fulfilled, (state, action: PayloadAction<UserBacklogWithGame>) => {
        state.items.unshift(action.payload);
        state.stats = calculateStats(state.items);
      })
      .addCase(addToBacklog.rejected, (state, action) => {
        state.error = action.error.message || 'Σφάλμα προσθήκης στο backlog';
      })
      // Update backlog item
      .addCase(updateBacklogItem.pending, state => {
        state.error = null;
      })
      .addCase(updateBacklogItem.fulfilled, (state, action: PayloadAction<UserBacklogWithGame>) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
          state.stats = calculateStats(state.items);
        }
      })
      .addCase(updateBacklogItem.rejected, (state, action) => {
        state.error = action.error.message || 'Σφάλμα ενημέρωσης backlog';
      })
      // Remove from backlog
      .addCase(removeFromBacklog.pending, state => {
        state.error = null;
      })
      .addCase(removeFromBacklog.fulfilled, (state, action: PayloadAction<number>) => {
        state.items = state.items.filter(item => item.id !== action.payload);
        state.stats = calculateStats(state.items);
      })
      .addCase(removeFromBacklog.rejected, (state, action) => {
        state.error = action.error.message || 'Σφάλμα διαγραφής από backlog';
      });
  },
});

export const { clearBacklog, clearBacklogError } = backlogSlice.actions;

/**
 * Selectors
 */
export const selectBacklogItems = (state: RootState) => state.backlog.items;
export const selectBacklogLoading = (state: RootState) => state.backlog.isLoading;
export const selectBacklogError = (state: RootState) => state.backlog.error;
export const selectBacklogStats = (state: RootState) => state.backlog.stats;
export const selectIsInBacklog = (gameId: number) => (state: RootState) =>
  state.backlog.items.some(item => item.game_id === gameId);

// Filter by status
export const selectGamesByStatus = (status: 'to_play' | 'playing' | 'completed' | 'platinumed' | 'dropped') =>
  (state: RootState) => state.backlog.items.filter(item => item.status === status);

// Count by status - memoized to prevent unnecessary re-renders
export const selectStatusCounts = createSelector(
  [selectBacklogItems],
  (items) => {
    return items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
);

export default backlogSlice.reducer;
