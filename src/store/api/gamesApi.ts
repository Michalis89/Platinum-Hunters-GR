import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { CombinedGame, GamesResponse } from '@/types/interfaces';

export const gamesApi = createApi({
  reducerPath: 'gamesApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: builder => ({
    getGames: builder.query<GamesResponse, void>({
      query: () => '/combined-games',
      transformResponse: (response: CombinedGame[]) => {
        const games = response.map(game => ({
          ...game,
          difficulty: game.difficulty ? Number(game.difficulty.split('/')[0]) || 0 : 0,
          trophies: {
            platinum: game.platinum || 0,
            gold: game.gold || 0,
            silver: game.silver || 0,
            bronze: game.bronze || 0,
          },
          totalPoints:
            (game.platinum || 0) * 300 +
            (game.gold || 0) * 90 +
            (game.silver || 0) * 30 +
            (game.bronze || 0) * 15,
        }));

        const uniquePlatforms = Array.from(
          new Set(response.map(game => game.platform).filter(Boolean)),
        );

        const uniqueGenres = Array.from(
          new Set(
            response.flatMap(game => game.genre?.split(',').map(g => g.trim())).filter(Boolean),
          ),
        ) as string[];

        const uniqueDeveloper = Array.from(
          new Set(
            response.flatMap(game => game.developer?.split(',').map(g => g.trim())).filter(Boolean),
          ),
        ) as string[];

        const numberedDifficulty = Array.from(
          new Set(
            response.map(game =>
              game.difficulty ? Number(game.difficulty.split('/')[0]) || 0 : 0,
            ),
          ),
        );

        return {
          games,
          genres: uniqueGenres,
          platforms: uniquePlatforms,
          developer: uniqueDeveloper,
          difficulty: numberedDifficulty,
        };
      },
    }),
  }),
});

export const { useGetGamesQuery } = gamesApi;
