import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { FullGameData, GamesResponse, ProcessedGame, Step, TrophiesRecord } from '@/types/interfaces';

type GetGamesArgs = {
  page?: number;
  limit?: number;
  search?: string;
  platform?: string;
  genre?: string;
  developer?: string;
  minYear?: number;
  maxYear?: number;
} | void;

type LegacyGameExtras = {
  playthroughs?: string;
  difficulty?: string;
  difficultyColor?: string;
  playthroughsColor?: string;
  hours?: string;
  hoursColor?: string;
  gameImage?: string;
  platform?: string;
  trophies?: Record<string, unknown>;
  steps?: unknown[];
};

const defaultTrophies: TrophiesRecord = {
  Platinum: '',
  Gold: '',
  Silver: '',
  Bronze: '',
};

export const gamesApi = createApi({
  reducerPath: 'gamesApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: builder => ({
    getGames: builder.query<GamesResponse, GetGamesArgs>({
      query: params => {
        const {
          page = 1,
          limit = 500,
          search,
          platform,
          genre,
          developer,
          minYear,
          maxYear,
        } = params ?? {};
        const qs = new URLSearchParams();
        qs.set('page', page.toString());
        qs.set('limit', limit.toString());
        if (search) qs.set('search', search);
        if (platform) qs.set('platform', platform);
        if (genre) qs.set('genre', genre);
        if (developer) qs.set('developer', developer);
        if (minYear !== undefined) qs.set('minYear', String(minYear));
        if (maxYear !== undefined) qs.set('maxYear', String(maxYear));
        return `/full-game-data?${qs.toString()}`;
      },
      transformResponse: (response: { data: FullGameData[]; pagination?: unknown }) => {
        const payload = response?.data ?? [];
        // Transform games to include computed fields
        const games: ProcessedGame[] = payload.map(game => {
          const legacyGame = game as FullGameData & LegacyGameExtras;

          const steps = Array.isArray(legacyGame.steps) ? (legacyGame.steps as Step[]) : [];
          const trophies = (legacyGame.trophies ?? defaultTrophies) as TrophiesRecord;

          return {
            ...game,
            // Legacy scraped fields with safe fallbacks
            playthroughs: legacyGame.playthroughs ?? '',
            difficulty: legacyGame.difficulty ?? '',
            difficultyColor: legacyGame.difficultyColor ?? '',
            playthroughsColor: legacyGame.playthroughsColor ?? '',
            hours: legacyGame.hours ?? '',
            hoursColor: legacyGame.hoursColor ?? '',
            gameImage:
              legacyGame.gameImage ?? game.cover_image ?? game.background_image ?? '/og-image.png',
            platform:
              legacyGame.platform ??
              (Array.isArray(game.platforms) && game.platforms.length > 0 ? game.platforms[0] : ''),
            trophies,
            steps,
            // Compute total points from trophy counts
            totalPoints:
              (game.trophy_platinum || 0) * 300 +
              (game.trophy_gold || 0) * 90 +
              (game.trophy_silver || 0) * 30 +
              (game.trophy_bronze || 0) * 15,
            // Convert difficulty to number for filtering
            difficultyNumber: game.average_difficulty || 0,
          };
        });

        // Extract unique values for filters
        const uniquePlatforms = Array.from(
          new Set(payload.flatMap(game => game.platforms || []).filter(Boolean)),
        );

        const uniqueGenres = Array.from(
          new Set(payload.flatMap(game => game.genres || []).filter(Boolean)),
        );

        const uniqueDevelopers = Array.from(
          new Set(payload.map(game => game.developer).filter(Boolean)),
        ) as string[];

        const uniqueDifficulties = Array.from(
          new Set(
            payload
              .map(game => game.average_difficulty)
              .filter((d): d is number => d !== null && d !== undefined),
          ),
        ).sort((a, b) => a - b);

        return {
          games,
          genres: uniqueGenres,
          developers: uniqueDevelopers,
          platforms: uniquePlatforms,
          difficulties: uniqueDifficulties,
          pagination: (
            response as {
              pagination?: {
                page: number;
                limit: number;
                total: number;
                meta?: {
                  developersCount?: number;
                  genresCount?: number;
                  maxHours?: number | null;
                  minYearMeta?: number | null;
                  maxYearMeta?: number | null;
                };
              };
            }
          ).pagination,
        };
      },
    }),
  }),
});

export const { useGetGamesQuery } = gamesApi;
