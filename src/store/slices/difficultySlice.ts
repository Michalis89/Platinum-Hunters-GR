import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DifficultyState {
  difficulties: number[];
  selectedDifficulty: number | null;
}

export const initialState: DifficultyState = {
  difficulties: [],
  selectedDifficulty: null,
};

const difficultySlice = createSlice({
  name: 'difficulty',
  initialState,
  reducers: {
    setDifficulties(state, action: PayloadAction<number[]>) {
      state.difficulties = action.payload;
    },
    setSelectedDifficulty(state, action: PayloadAction<number | null>) {
      state.selectedDifficulty = action.payload;
    },
    resetDifficulty(state) {
      state.selectedDifficulty = null;
    },
  },
});

export const { setDifficulties, setSelectedDifficulty, resetDifficulty } = difficultySlice.actions;
export default difficultySlice.reducer;
