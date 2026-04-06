import {
  createMediaAddRoute,
  createMediaLibraryRoute,
  createMediaSearchRoute,
  createSuggestionsRoute,
} from '@/lib/api/media/factories';
import { animeSearchConfig } from '@/lib/api/media/search/providers/anime';
import { animeSuggestionsConfig } from '@/lib/api/media/suggestionsConfigs';

jest.mock('@/lib/api/media/factories', () => ({
  createMediaAddRoute: jest.fn(),
  createMediaLibraryRoute: jest.fn(),
  createMediaSearchRoute: jest.fn(),
  createSuggestionsRoute: jest.fn(),
}));

jest.mock('@/lib/api/media/search/providers/anime', () => ({
  animeSearchConfig: { __type: 'anime-search-config' },
}));

jest.mock('@/lib/api/media/suggestionsConfigs', () => ({
  animeSuggestionsConfig: { __type: 'anime-suggestions-config' },
}));

describe('anime API route wrappers', () => {
  const addPost = jest.fn();
  const libraryGet = jest.fn();
  const libraryPatch = jest.fn();
  const libraryDelete = jest.fn();
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

  it('wires add route POST from createMediaAddRoute(anime)', async () => {
    const mod = await import('@/app/api/anime/add/route');

    expect(createMediaAddRoute).toHaveBeenCalledWith('anime');
    expect(mod.POST).toBe(addPost);
  });

  it('wires library route handlers from createMediaLibraryRoute(anime)', async () => {
    const mod = await import('@/app/api/anime/library/route');

    expect(createMediaLibraryRoute).toHaveBeenCalledWith('anime');
    expect(mod.GET).toBe(libraryGet);
    expect(mod.PATCH).toBe(libraryPatch);
    expect(mod.DELETE).toBe(libraryDelete);
  });

  it('wires search route GET from createMediaSearchRoute(animeSearchConfig)', async () => {
    const mod = await import('@/app/api/anime/search/route');

    expect(createMediaSearchRoute).toHaveBeenCalledWith(animeSearchConfig);
    expect(mod.GET).toBe(searchGet);
  });

  it('wires suggestions route GET from createSuggestionsRoute(animeSuggestionsConfig)', async () => {
    const mod = await import('@/app/api/anime/suggestions/route');

    expect(createSuggestionsRoute).toHaveBeenCalledWith(animeSuggestionsConfig);
    expect(mod.GET).toBe(suggestionsGet);
  });
});
