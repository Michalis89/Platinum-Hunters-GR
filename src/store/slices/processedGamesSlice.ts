import { ProcessedGame } from '@/types/interfaces';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ProcessedGamesState {
  games: ProcessedGame[];
}

export const initialState: ProcessedGamesState = {
  games: [],
};

const processedGamesSlice = createSlice({
  name: 'processedGames',
  initialState,
  reducers: {
    setProcessedGames(state, action: PayloadAction<ProcessedGame[]>) {
      state.games = action.payload;
    },
  },
});

export const { setProcessedGames } = processedGamesSlice.actions;
export default processedGamesSlice.reducer;
