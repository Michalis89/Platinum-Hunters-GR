import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CombinedGame } from '@/types/interfaces';

interface GamesState {
  games: CombinedGame[];
}

export const initialState: GamesState = {
  games: [],
};

const gamesSlice = createSlice({
  name: 'games',
  initialState,
  reducers: {
    setGames(state, action: PayloadAction<CombinedGame[]>) {
      state.games = action.payload;
    },
  },
});

export const { setGames } = gamesSlice.actions;
export default gamesSlice.reducer;
