import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { FullGameData, GamesResponse, ProcessedGame } from '@/types/interfaces';

export const gamesApi = createApi({
  reducerPath: 'gamesApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: builder => ({
    getGames: builder.query<GamesResponse, void>({
      query: () => '/full-game-data',
      transformResponse: (response: FullGameData[]) => {
        // Transform games to include computed fields
        const games: ProcessedGame[] = response.map(game => ({
          ...game,
          // Compute total points from trophy counts
          totalPoints:
            (game.trophy_platinum || 0) * 300 +
            (game.trophy_gold || 0) * 90 +
            (game.trophy_silver || 0) * 30 +
            (game.trophy_bronze || 0) * 15,
          // Convert difficulty to number for filtering
          difficultyNumber: game.average_difficulty || 0,
        }));

        // Extract unique values for filters
        const uniquePlatforms = Array.from(
          new Set(response.flatMap(game => game.platforms || []).filter(Boolean)),
        );

        const uniqueGenres = Array.from(
          new Set(response.flatMap(game => game.genres || []).filter(Boolean)),
        );

        const uniqueDevelopers = Array.from(
          new Set(response.map(game => game.developer).filter(Boolean)),
        ) as string[];

        const uniqueDifficulties = Array.from(
          new Set(
            response.map(game => game.average_difficulty).filter((d): d is number => d !== null && d !== undefined),
          ),
        ).sort((a, b) => a - b);

        return {
          games,
          genres: uniqueGenres,
          developers: uniqueDevelopers,
          platforms: uniquePlatforms,
          difficulties: uniqueDifficulties,
        };
      },
    }),
  }),
});

export const { useGetGamesQuery } = gamesApi;
