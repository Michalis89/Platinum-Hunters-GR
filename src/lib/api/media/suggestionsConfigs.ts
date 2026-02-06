import { MEDIA_CATEGORY_CONFIGS } from './config';
import type { SuggestionsConfig } from './handlers/suggestions';
import {
  mapAnimeSuggestion,
  mapBooksSuggestion,
  mapGamesSuggestion,
  mapMoviesSuggestion,
  mapTmdbPopularItem,
  fetchTmdbPopular,
  type AnimeMediaItem,
  type BooksMediaItem,
  type GamesMediaItem,
  type MoviesMediaItem,
} from './handlers/suggestionsMappers';

/**
 * Anime/Manga suggestions config
 */
export const animeSuggestionsConfig: SuggestionsConfig<AnimeMediaItem, ReturnType<typeof mapAnimeSuggestion>> = {
  allowedCategories: MEDIA_CATEGORY_CONFIGS.anime.subcategories,
  defaultCategory: MEDIA_CATEGORY_CONFIGS.anime.defaultCategory,
  selectFields: MEDIA_CATEGORY_CONFIGS.anime.suggestionsSelectFields,
  mapper: mapAnimeSuggestion,
  logPrefix: MEDIA_CATEGORY_CONFIGS.anime.logPrefix,
};

/**
 * Books suggestions config
 */
export const booksSuggestionsConfig: SuggestionsConfig<BooksMediaItem, ReturnType<typeof mapBooksSuggestion>> = {
  allowedCategories: MEDIA_CATEGORY_CONFIGS.books.subcategories,
  defaultCategory: MEDIA_CATEGORY_CONFIGS.books.defaultCategory,
  selectFields: MEDIA_CATEGORY_CONFIGS.books.suggestionsSelectFields,
  mapper: mapBooksSuggestion,
  logPrefix: MEDIA_CATEGORY_CONFIGS.books.logPrefix,
};

/**
 * Games suggestions config
 */
export const gamesSuggestionsConfig: SuggestionsConfig<GamesMediaItem, ReturnType<typeof mapGamesSuggestion>> = {
  allowedCategories: MEDIA_CATEGORY_CONFIGS.games.subcategories,
  defaultCategory: MEDIA_CATEGORY_CONFIGS.games.defaultCategory,
  selectFields: MEDIA_CATEGORY_CONFIGS.games.suggestionsSelectFields,
  mapper: mapGamesSuggestion,
  logPrefix: MEDIA_CATEGORY_CONFIGS.games.logPrefix,
};

/**
 * Movies/TV suggestions config (with TMDB fallback)
 */
export const moviesSuggestionsConfig: SuggestionsConfig<MoviesMediaItem, ReturnType<typeof mapMoviesSuggestion> | ReturnType<typeof mapTmdbPopularItem>> = {
  allowedCategories: MEDIA_CATEGORY_CONFIGS.movies.subcategories,
  defaultCategory: MEDIA_CATEGORY_CONFIGS.movies.defaultCategory,
  selectFields: MEDIA_CATEGORY_CONFIGS.movies.suggestionsSelectFields,
  mapper: mapMoviesSuggestion,
  logPrefix: MEDIA_CATEGORY_CONFIGS.movies.logPrefix,
  // Fallback to TMDB popular when no suggestions found
  fallback: async (category, userMediaIds) => {
    const popular = await fetchTmdbPopular(category as 'movies' | 'tv', 8);
    const filteredPopular = popular
      .filter(item => !userMediaIds.has(item.id))
      .slice(0, 4);
    return filteredPopular.map(item => mapTmdbPopularItem(item, category as 'movies' | 'tv'));
  },
};
