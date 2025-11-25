import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FullGameData } from '@/types/interfaces';

interface GamesState {
  games: FullGameData[];
}

export const initialState: GamesState = {
  games: [],
};

const gamesSlice = createSlice({
  name: 'games',
  initialState,
  reducers: {
    setGames(state, action: PayloadAction<FullGameData[]>) {
      state.games = action.payload;
    },
  },
});

export const { setGames } = gamesSlice.actions;
export default gamesSlice.reducer;
