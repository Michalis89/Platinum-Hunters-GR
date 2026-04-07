/**
 * @jest-environment node
 */

const mockUserBacklog = jest.fn();
const mockUserLibrary = jest.fn();
const mockPath = jest.fn();

jest.mock('@/lib/cache/tags', () => ({
  revalidateCache: {
    userBacklog: (...args: unknown[]) => mockUserBacklog(...args),
    userLibrary: (...args: unknown[]) => mockUserLibrary(...args),
    path: (...args: unknown[]) => mockPath(...args),
  },
}));

describe('revalidateUserMediaMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('revalidates backlog, anime library, and dashboard for anime key', async () => {
    const { revalidateUserMediaMutation } = await import('@/lib/api/media/utils/revalidation');
    revalidateUserMediaMutation('u1', 'anime');

    expect(mockUserBacklog).toHaveBeenCalledWith('u1');
    expect(mockUserLibrary).toHaveBeenCalledWith('u1', 'anime');
    expect(mockPath).toHaveBeenCalledWith('/dashboard');
  });

  it('revalidates backlog and dashboard for games key (no category library tag)', async () => {
    const { revalidateUserMediaMutation } = await import('@/lib/api/media/utils/revalidation');
    revalidateUserMediaMutation('u2', 'games');

    expect(mockUserBacklog).toHaveBeenCalledWith('u2');
    expect(mockUserLibrary).not.toHaveBeenCalled();
    expect(mockPath).toHaveBeenCalledWith('/dashboard');
  });
});

