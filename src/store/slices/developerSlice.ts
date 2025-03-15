import { Genre } from '@/types/interfaces';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DeveloperState {
  developer: Genre[];
  selectedDeveloper: string | null;
}

export const initialState: DeveloperState = {
  developer: [],
  selectedDeveloper: null,
};

const developerSlice = createSlice({
  name: 'developer',
  initialState,
  reducers: {
    setDeveloper(state, action: PayloadAction<Genre[]>) {
      state.developer = action.payload;
    },
    setSelectedDeveloper(state, action: PayloadAction<string | null>) {
      state.selectedDeveloper = action.payload;
    },
    resetDeveloper(state) {
      state.selectedDeveloper = null;
    },
  },
});

export const { setDeveloper, setSelectedDeveloper, resetDeveloper } = developerSlice.actions;
export default developerSlice.reducer;
