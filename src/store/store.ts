import { configureStore } from '@reduxjs/toolkit';
import gamesReducer from './slices/gamesSlice';
import platformsReducer from './slices/platformsSlice';
import genresReducer from './slices/genresSlice';
import developerReducer from './slices/developerSlice';
import difficultyReducer from './slices/difficultySlice';
import processedGamesReducer from './slices/processedGamesSlice';

import { gamesApi } from './api/gamesApi';

export const store = configureStore({
  reducer: {
    games: gamesReducer,
    platforms: platformsReducer,
    genres: genresReducer,
    developer: developerReducer,
    difficulty: difficultyReducer,
    processedGames: processedGamesReducer,
    [gamesApi.reducerPath]: gamesApi.reducer,
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware().concat(gamesApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
