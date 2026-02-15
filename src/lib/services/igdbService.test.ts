import { getIgdbCategoryLabel, isAllowedIgdbCategory } from '@/lib/igdb/categories';
import { fetchIgdbGameDetails, searchIgdbGames } from './igdbService';

jest.mock('@/lib/igdb/igdbClient', () => ({
  igdbPost: jest.fn(),
  igdbImage: jest.fn(() => null),
  normalizeHttpsUrl: jest.fn((value: string | null | undefined) => value ?? null),
  unixToDate: jest.fn((value: number | null | undefined) =>
    typeof value === 'number' ? new Date(value * 1000) : null,
  ),
}));

const igdbClient = jest.requireMock('@/lib/igdb/igdbClient') as {
  igdbPost: jest.Mock;
};

describe('igdbService bundle exclusions', () => {
  beforeEach(() => {
    igdbClient.igdbPost.mockReset();
  });

  it('keeps IGDB category filtering active for search queries', async () => {
    igdbClient.igdbPost.mockResolvedValueOnce([]);

    const results = await searchIgdbGames("Assassin's Creed Bundle", 12);

    expect(results).toEqual([]);
    expect(igdbClient.igdbPost).toHaveBeenCalledTimes(1);
    expect(igdbClient.igdbPost.mock.calls[0][1]).toContain(
      'where category = (0,1,2,3,4,8,9,13,14);',
    );
  });

  it('allows bundle category after policy change', () => {
    expect(isAllowedIgdbCategory(3)).toBe(true);
    expect(isAllowedIgdbCategory(9)).toBe(true);
    expect(isAllowedIgdbCategory(14)).toBe(true);
    expect(getIgdbCategoryLabel(3)).toBe('bundle');
  });

  it('applies allowed categories filter in details query by default', async () => {
    igdbClient.igdbPost.mockResolvedValueOnce([]);

    const result = await fetchIgdbGameDetails(164698);

    expect(result).toBeNull();
    expect(igdbClient.igdbPost).toHaveBeenCalledTimes(1);
    expect(igdbClient.igdbPost.mock.calls[0][1]).toContain(
      'where id = 164698 & category = (0,1,2,3,4,8,9,13,14);',
    );
  });
});
