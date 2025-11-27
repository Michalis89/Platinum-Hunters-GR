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
  totalTrophies: {
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
    totalTrophies: {
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
};

/**
 * Thunk: Fetch backlog
 */
export const fetchBacklog = createAsyncThunk('backlog/fetch', async () => {
  const response = await fetch('/api/backlog', {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Σφάλμα φόρτωσης backlog');
  }

  const data = await response.json();
  return data as UserBacklogWithGame[];
});

/**
 * Thunk: Add to backlog
 */
export const addToBacklog = createAsyncThunk(
  'backlog/add',
  async ({ game_id, priority = 0, notes = null }: { game_id: number; priority?: number; notes?: string | null }) => {
    const response = await fetch('/api/backlog', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game_id, priority, notes }),
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
    would_recommend
  }: {
    id: number;
    status?: 'to_play' | 'playing' | 'completed' | 'platinumed' | 'dropped';
    priority?: number;
    notes?: string | null;
    actual_hours_casual?: number | null;
    actual_hours_platinum?: number | null;
    personal_rating?: number | null;
    would_recommend?: boolean | null;
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
        would_recommend
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
  const totalGames = items.length;
  const totalHours = items.reduce((sum, item) => sum + (item.game?.average_hours || 0), 0);

  const totalTrophies = items.reduce(
    (acc, item) => {
      const game = item.game;
      if (game) {
        acc.platinum += game.trophy_platinum || 0;
        acc.gold += game.trophy_gold || 0;
        acc.silver += game.trophy_silver || 0;
        acc.bronze += game.trophy_bronze || 0;
        acc.total += game.trophy_total || 0;
      }
      return acc;
    },
    { platinum: 0, gold: 0, silver: 0, bronze: 0, total: 0 },
  );

  // Platform breakdown would require platform data from games
  // For now, we'll leave it empty - can be enhanced later
  const platformBreakdown: Record<string, number> = {};

  const difficultyAverage =
    items.reduce((sum, item) => sum + (item.game?.average_difficulty || 0), 0) / (totalGames || 1);

  const recentlyAdded = [...items]
    .sort((a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime())
    .slice(0, 5);

  return {
    totalGames,
    totalHours: Math.round(totalHours * 10) / 10,
    totalTrophies,
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
      .addCase(fetchBacklog.fulfilled, (state, action: PayloadAction<UserBacklogWithGame[]>) => {
        state.isLoading = false;
        state.items = action.payload;
        state.stats = calculateStats(action.payload);
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
