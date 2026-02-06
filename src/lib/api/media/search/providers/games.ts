import type { MediaSearchConfig } from '../../handlers/search';
import {
  searchRawgGames,
  mapRawgToSearchResult,
  mapLocalGameItem,
  type RawgGame,
  type GameSearchResult,
} from '@/lib/services/rawgService';

type GamesCategory = 'games';

export const gamesSearchConfig: MediaSearchConfig<
  GamesCategory,
  RawgGame,
  GameSearchResult
> = {
  defaultCategory: 'games',
  supportedCategories: ['games'],
  limit: 12,
  logPrefix: 'Games',
  buildLocalOrFilter: query => `title.ilike.%${query}%,title_english.ilike.%${query}%`,
  mapLocalItem: mapLocalGameItem,
  mapExternalItem: mapRawgToSearchResult,
  getLocalExternalId: item => {
    const rawgId = item.rawg_id;
    return typeof rawgId === 'number' ? rawgId : null;
  },
  getExternalId: item => item.id,
  fetchExternal: async (search, { limit }) => searchRawgGames(search, limit),
};
