import {
  createMediaAddRoute,
  createMediaLibraryRoute,
  createMediaSearchRoute,
  createSuggestionsRoute,
} from '@/lib/api/media/factories';
import { moviesSearchConfig } from '@/lib/api/media/search/providers/movies';
import { moviesSuggestionsConfig } from '@/lib/api/media/suggestionsConfigs';

jest.mock('@/lib/api/media/factories', () => ({
  createMediaAddRoute: jest.fn(),
  createMediaLibraryRoute: jest.fn(),
  createMediaSearchRoute: jest.fn(),
  createSuggestionsRoute: jest.fn(),
}));

jest.mock('@/lib/api/media/search/providers/movies', () => ({
  moviesSearchConfig: { __type: 'movies-search-config' },
}));

jest.mock('@/lib/api/media/suggestionsConfigs', () => ({
  moviesSuggestionsConfig: { __type: 'movies-suggestions-config' },
}));

describe('movies API route wrappers', () => {
  const libraryGet = jest.fn();
  const libraryPatch = jest.fn();
  const libraryDelete = jest.fn();
  const addPost = jest.fn();
  const searchGet = jest.fn();
  const suggestionsGet = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    const factories = jest.requireMock('@/lib/api/media/factories') as {
      createMediaAddRoute: jest.Mock;
      createMediaLibraryRoute: jest.Mock;
      createMediaSearchRoute: jest.Mock;
      createSuggestionsRoute: jest.Mock;
    };

    factories.createMediaAddRoute.mockReturnValue({ POST: addPost });
    factories.createMediaLibraryRoute.mockReturnValue({
      GET: libraryGet,
      PATCH: libraryPatch,
      DELETE: libraryDelete,
    });
    factories.createMediaSearchRoute.mockReturnValue({ GET: searchGet });
    factories.createSuggestionsRoute.mockReturnValue({ GET: suggestionsGet });
  });

  it('wires library route handlers from createMediaLibraryRoute(movies)', async () => {
    const mod = await import('@/app/api/movies/library/route');

    expect(createMediaLibraryRoute).toHaveBeenCalledWith('movies');
    expect(mod.GET).toBe(libraryGet);
    expect(mod.PATCH).toBe(libraryPatch);
    expect(mod.DELETE).toBe(libraryDelete);
  });

  it('wires add route POST from createMediaAddRoute(movies)', async () => {
    const mod = await import('@/app/api/movies/add/route');

    expect(createMediaAddRoute).toHaveBeenCalledWith('movies');
    expect(mod.POST).toBe(addPost);
  });

  it('wires search route GET from createMediaSearchRoute(moviesSearchConfig)', async () => {
    const mod = await import('@/app/api/movies/search/route');

    expect(createMediaSearchRoute).toHaveBeenCalledWith(moviesSearchConfig);
    expect(mod.GET).toBe(searchGet);
  });

  it('wires suggestions route GET from createSuggestionsRoute(moviesSuggestionsConfig)', async () => {
    const mod = await import('@/app/api/movies/suggestions/route');

    expect(createSuggestionsRoute).toHaveBeenCalledWith(moviesSuggestionsConfig);
    expect(mod.GET).toBe(suggestionsGet);
  });
});
