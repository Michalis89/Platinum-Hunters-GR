import type { MediaSearchConfig } from '../../handlers/search';
import {
  searchIgdbGamesWithoutCategoryFilter,
  searchIgdbGames,
  mapIgdbToSearchResult,
  mapLocalGameItem,
  type IgdbGame,
  type GameSearchResult,
} from '@/lib/services/igdbService';
import { isAllowedIgdbGameCandidate } from '@/lib/igdb/categories';

type GamesCategory = 'games';

function buildGameLocalOrFilter(query: string): string {
  const strict = query.trim();
  const loose = strict.replace(/\s+/g, '%');
  const escapedStrict = strict.replace(/,/g, ' ');
  const escapedLoose = loose.replace(/,/g, ' ');

  return [
    `title.ilike.%${escapedStrict}%`,
    `title_english.ilike.%${escapedStrict}%`,
    `igdb_slug.ilike.%${escapedStrict}%`,
    `title.ilike.%${escapedLoose}%`,
    `title_english.ilike.%${escapedLoose}%`,
    `igdb_slug.ilike.%${escapedLoose}%`,
  ].join(',');
}

function normalizeGameSearchTerm(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ');
  if (!normalized) {return '';}

  const romanMap: Record<string, string> = {
    '2': 'ii',
    '3': 'iii',
    '4': 'iv',
    '5': 'v',
    '6': 'vi',
    '7': 'vii',
    '8': 'viii',
    '9': 'ix',
    '10': 'x',
  };

  return normalized
    .split(/\s+/)
    .map(part => romanMap[part] ?? part)
    .join(' ')
    .trim();
}

function isSearchAllowedGameCandidate(game: IgdbGame): boolean {
  return isAllowedIgdbGameCandidate({
    category: game.category,
    name: game.name,
    slug: game.slug ?? null,
  });
}

export const gamesSearchConfig: MediaSearchConfig<GamesCategory, IgdbGame, GameSearchResult> = {
  defaultCategory: 'games',
  supportedCategories: ['games'],
  limit: 12,
  logPrefix: 'Games',
  buildLocalOrFilter: buildGameLocalOrFilter,
  normalizeSearchTerm: normalizeGameSearchTerm,
  mapLocalItem: mapLocalGameItem,
  mapExternalItem: item => mapIgdbToSearchResult(item),
  getLocalExternalId: item => {
    const igdbId = item.igdb_id;
    return typeof igdbId === 'number' ? igdbId : null;
  },
  getExternalId: item => item.id,
  fetchExternal: async (search, { limit }) => {
    const strict = await searchIgdbGames(search, limit);
    if (strict.length > 0) {return strict;}

    const fallback = await searchIgdbGamesWithoutCategoryFilter(search, Math.max(limit * 2, 20));
    return fallback.filter(isSearchAllowedGameCandidate).slice(0, limit);
  },
};
