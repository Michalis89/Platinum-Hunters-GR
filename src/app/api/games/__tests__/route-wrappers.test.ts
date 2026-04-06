import {
  createMediaAddRoute,
  createMediaLibraryRoute,
  createMediaSearchRoute,
  createSuggestionsRoute,
} from '@/lib/api/media/factories';
import { gamesSearchConfig } from '@/lib/api/media/search/providers/games';
import { gamesSuggestionsConfig } from '@/lib/api/media/suggestionsConfigs';

jest.mock('@/lib/api/media/factories', () => ({
  createMediaAddRoute: jest.fn(),
  createMediaLibraryRoute: jest.fn(),
  createMediaSearchRoute: jest.fn(),
  createSuggestionsRoute: jest.fn(),
}));

jest.mock('@/lib/api/media/search/providers/games', () => ({
  gamesSearchConfig: { __type: 'games-search-config' },
}));

jest.mock('@/lib/api/media/suggestionsConfigs', () => ({
  gamesSuggestionsConfig: { __type: 'games-suggestions-config' },
}));

describe('games API route wrappers', () => {
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

  it('wires library route handlers from createMediaLibraryRoute(games)', async () => {
    const mod = await import('@/app/api/games/library/route');

    expect(createMediaLibraryRoute).toHaveBeenCalledWith('games');
    expect(mod.GET).toBe(libraryGet);
    expect(mod.PATCH).toBe(libraryPatch);
    expect(mod.DELETE).toBe(libraryDelete);
  });

  it('wires add route POST from createMediaAddRoute(games)', async () => {
    const mod = await import('@/app/api/games/add/route');

    expect(createMediaAddRoute).toHaveBeenCalledWith('games');
    expect(mod.POST).toBe(addPost);
  });

  it('wires search route GET from createMediaSearchRoute(gamesSearchConfig)', async () => {
    const mod = await import('@/app/api/games/search/route');

    expect(createMediaSearchRoute).toHaveBeenCalledWith(gamesSearchConfig);
    expect(mod.GET).toBe(searchGet);
  });

  it('wires suggestions route GET from createSuggestionsRoute(gamesSuggestionsConfig)', async () => {
    const mod = await import('@/app/api/games/suggestions/route');

    expect(createSuggestionsRoute).toHaveBeenCalledWith(gamesSuggestionsConfig);
    expect(mod.GET).toBe(suggestionsGet);
  });
});
