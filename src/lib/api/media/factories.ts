import { withApiRoute } from '@/lib/observability/withApiRoute';
import { MEDIA_CATEGORY_CONFIGS, type MediaCategoryKey } from './config';
import { handleMediaAdd } from './handlers/add';
import {
  handleLibraryGet,
  handleLibraryPatch,
  handleLibraryDelete,
} from './handlers/library';
import { handleMediaSearch, type MediaSearchConfig } from './handlers/search';
import {
  handleSuggestionsGet,
  type SuggestionsConfig,
} from './handlers/suggestions';

/**
 * Creates a complete add route with POST handler
 *
 * @param categoryKey - Media category key ('anime', 'books', 'games', 'movies')
 * @returns Object with POST handler wrapped in withApiRoute
 *
 * @example
 * // In src/app/api/anime/add/route.ts
 * import { createMediaAddRoute } from '@/lib/api/media/factories';
 * export const { POST } = createMediaAddRoute('anime');
 */
export function createMediaAddRoute(categoryKey: MediaCategoryKey) {
  const config = MEDIA_CATEGORY_CONFIGS[categoryKey];

  if (!config) {
    throw new Error(`Invalid category key: ${categoryKey}`);
  }

  return {
    POST: withApiRoute(async (req: Request) => handleMediaAdd(req, config)),
  };
}

/**
 * Creates a complete library route with GET, PATCH, and DELETE handlers
 *
 * @param categoryKey - Media category key ('anime', 'books', 'games', 'movies')
 * @returns Object with GET, PATCH, DELETE handlers wrapped in withApiRoute
 *
 * @example
 * // In src/app/api/anime/library/route.ts
 * import { createMediaLibraryRoute } from '@/lib/api/media/factories';
 * export const { GET, PATCH, DELETE } = createMediaLibraryRoute('anime');
 */
export function createMediaLibraryRoute(categoryKey: MediaCategoryKey) {
  const config = MEDIA_CATEGORY_CONFIGS[categoryKey];

  if (!config) {
    throw new Error(`Invalid category key: ${categoryKey}`);
  }

  return {
    GET: withApiRoute(async (req: Request) => handleLibraryGet(req, config)),
    PATCH: withApiRoute(async (req: Request) => handleLibraryPatch(req, config)),
    DELETE: withApiRoute(async (req: Request) => handleLibraryDelete(req, config)),
  };
}

/**
 * Creates a complete search route with GET handler
 *
 * @param config - Search configuration for the category/provider
 * @returns Object with GET handler wrapped in withApiRoute
 *
 * @example
 * // In src/app/api/movies/search/route.ts
 * import { createMediaSearchRoute } from '@/lib/api/media/factories';
 * export const { GET } = createMediaSearchRoute(moviesSearchConfig);
 */
export function createMediaSearchRoute<TCategory extends string, TExternalItem, TResultItem>(
  config: MediaSearchConfig<TCategory, TExternalItem, TResultItem>,
) {
  return {
    GET: withApiRoute(async (req: Request) => handleMediaSearch(req, config)),
  };
}

/**
 * Creates a complete suggestions route with GET handler
 *
 * @param config - Suggestions configuration for the category
 * @returns Object with GET handler wrapped in withApiRoute
 *
 * @example
 * // In src/app/api/anime/suggestions/route.ts
 * import { createSuggestionsRoute } from '@/lib/api/media/factories';
 * import { animeSuggestionsConfig } from '@/lib/api/media/suggestionsConfigs';
 * export const { GET } = createSuggestionsRoute(animeSuggestionsConfig);
 */
export function createSuggestionsRoute<TMediaItem, TResult>(
  config: SuggestionsConfig<TMediaItem, TResult>,
) {
  return {
    GET: withApiRoute(async (req: Request) => handleSuggestionsGet(req, config)),
  };
}
