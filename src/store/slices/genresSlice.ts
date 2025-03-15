import { Genre } from '@/types/interfaces';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface GenresState {
  genres: Genre[];
  selectedGenre: string | null;
}

export const initialState: GenresState = {
  genres: [],
  selectedGenre: null,
};

const genresSlice = createSlice({
  name: 'genres',
  initialState,
  reducers: {
    setGenres(state, action: PayloadAction<Genre[]>) {
      state.genres = action.payload;
    },
    setSelectedGenre(state, action: PayloadAction<string | null>) {
      state.selectedGenre = action.payload;
    },
    resetGenre(state) {
      state.selectedGenre = null;
    },
  },
});

export const { setGenres, setSelectedGenre, resetGenre } = genresSlice.actions;
export default genresSlice.reducer;
