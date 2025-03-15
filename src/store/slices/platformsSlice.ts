import { Platform } from '@/types/interfaces';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PlatformsState {
  platforms: Platform[];
  selectedPlatform: string | null;
}

export const initialState: PlatformsState = {
  platforms: [],
  selectedPlatform: null,
};

const platformsSlice = createSlice({
  name: 'platforms',
  initialState,
  reducers: {
    setPlatforms(state, action: PayloadAction<Platform[]>) {
      state.platforms = action.payload;
    },
    setSelectedPlatform(state, action: PayloadAction<string | null>) {
      state.selectedPlatform = action.payload;
    },
    resetPlatform(state) {
      state.selectedPlatform = null;
    },
  },
});

export const { setPlatforms, setSelectedPlatform, resetPlatform } = platformsSlice.actions;
export default platformsSlice.reducer;
