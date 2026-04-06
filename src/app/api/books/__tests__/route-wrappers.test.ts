import {
  createMediaAddRoute,
  createMediaLibraryRoute,
  createMediaSearchRoute,
  createSuggestionsRoute,
} from '@/lib/api/media/factories';
import { booksSearchConfig } from '@/lib/api/media/search/providers/books';
import { booksSuggestionsConfig } from '@/lib/api/media/suggestionsConfigs';

jest.mock('@/lib/api/media/factories', () => ({
  createMediaAddRoute: jest.fn(),
  createMediaLibraryRoute: jest.fn(),
  createMediaSearchRoute: jest.fn(),
  createSuggestionsRoute: jest.fn(),
}));

jest.mock('@/lib/api/media/search/providers/books', () => ({
  booksSearchConfig: { __type: 'books-search-config' },
}));

jest.mock('@/lib/api/media/suggestionsConfigs', () => ({
  booksSuggestionsConfig: { __type: 'books-suggestions-config' },
}));

describe('books API route wrappers', () => {
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

  it('wires add route POST from createMediaAddRoute(books)', async () => {
    const mod = await import('@/app/api/books/add/route');

    expect(createMediaAddRoute).toHaveBeenCalledWith('books');
    expect(mod.POST).toBe(addPost);
  });

  it('wires library route handlers from createMediaLibraryRoute(books)', async () => {
    const mod = await import('@/app/api/books/library/route');

    expect(createMediaLibraryRoute).toHaveBeenCalledWith('books');
    expect(mod.GET).toBe(libraryGet);
    expect(mod.PATCH).toBe(libraryPatch);
    expect(mod.DELETE).toBe(libraryDelete);
  });

  it('wires search route GET from createMediaSearchRoute(booksSearchConfig)', async () => {
    const mod = await import('@/app/api/books/search/route');

    expect(createMediaSearchRoute).toHaveBeenCalledWith(booksSearchConfig);
    expect(mod.GET).toBe(searchGet);
  });

  it('wires suggestions route GET from createSuggestionsRoute(booksSuggestionsConfig)', async () => {
    const mod = await import('@/app/api/books/suggestions/route');

    expect(createSuggestionsRoute).toHaveBeenCalledWith(booksSuggestionsConfig);
    expect(mod.GET).toBe(suggestionsGet);
  });
});
