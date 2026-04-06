import 'whatwg-fetch';

jest.mock('next/server', () => ({
  __esModule: true,
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    })),
  },
}));

jest.mock('@/lib/observability/withApiRoute', () => ({
  __esModule: true,
  withApiRoute: (handler: unknown) => handler,
}));

jest.mock('@/lib/services/igdbService', () => ({
  __esModule: true,
  fetchIgdbGameDetails: jest.fn(),
  mapIgdbToPayload: jest.fn(),
}));

jest.mock('@/lib/igdb/categories', () => ({
  __esModule: true,
  getIgdbCategoryLabel: jest.fn(),
  isAllowedIgdbGameCandidate: jest.fn(),
}));

import { GET } from '@/app/api/games/igdb-details/route';
import { fetchIgdbGameDetails, mapIgdbToPayload } from '@/lib/services/igdbService';
import { getIgdbCategoryLabel, isAllowedIgdbGameCandidate } from '@/lib/igdb/categories';

describe('app/api/games/igdb-details/route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 400 when igdbId is missing', async () => {
    const response = await GET(new Request('https://example.com/api/games/igdb-details'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Missing igdbId parameter' });
    expect(fetchIgdbGameDetails).not.toHaveBeenCalled();
  });

  it('returns 400 when igdbId is invalid', async () => {
    const response = await GET(new Request('https://example.com/api/games/igdb-details?igdbId=0'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid igdbId' });
    expect(fetchIgdbGameDetails).not.toHaveBeenCalled();
  });

  it('returns 404 when no IGDB details are found', async () => {
    (fetchIgdbGameDetails as jest.Mock).mockResolvedValue(null);

    const response = await GET(new Request('https://example.com/api/games/igdb-details?igdbId=42'));

    expect(fetchIgdbGameDetails).toHaveBeenCalledWith(42, { mainGameOnly: false });
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Game not found' });
  });

  it('returns 422 when the game category is unsupported', async () => {
    (fetchIgdbGameDetails as jest.Mock).mockResolvedValue({
      category: 9,
      name: 'Denied Game',
      slug: 'denied-game',
    });
    (isAllowedIgdbGameCandidate as jest.Mock).mockReturnValue(false);
    (getIgdbCategoryLabel as jest.Mock).mockReturnValue('Category 9');

    const response = await GET(new Request('https://example.com/api/games/igdb-details?igdbId=7'));

    expect(isAllowedIgdbGameCandidate).toHaveBeenCalledWith({
      category: 9,
      name: 'Denied Game',
      slug: 'denied-game',
    });
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: 'Unsupported IGDB category',
      category: 'Category 9',
    });
    expect(mapIgdbToPayload).not.toHaveBeenCalled();
  });

  it('normalizes an undefined slug to null before category filtering', async () => {
    (fetchIgdbGameDetails as jest.Mock).mockResolvedValue({
      category: 10,
      name: 'Slugless Game',
      slug: undefined,
    });
    (isAllowedIgdbGameCandidate as jest.Mock).mockReturnValue(false);
    (getIgdbCategoryLabel as jest.Mock).mockReturnValue('Category 10');

    const response = await GET(new Request('https://example.com/api/games/igdb-details?igdbId=8'));

    expect(isAllowedIgdbGameCandidate).toHaveBeenCalledWith({
      category: 10,
      name: 'Slugless Game',
      slug: null,
    });
    expect(response.status).toBe(422);
  });

  it('returns the mapped payload for supported games', async () => {
    const details = {
      category: 1,
      name: 'Allowed Game',
      slug: 'allowed-game',
    };
    const payload = {
      description: 'An excellent game',
      platforms: ['PC', 'PS5'],
      extra: 'value',
    };
    (fetchIgdbGameDetails as jest.Mock).mockResolvedValue(details);
    (isAllowedIgdbGameCandidate as jest.Mock).mockReturnValue(true);
    (mapIgdbToPayload as jest.Mock).mockReturnValue(payload);

    const response = await GET(new Request('https://example.com/api/games/igdb-details?igdbId=99'));

    expect(mapIgdbToPayload).toHaveBeenCalledWith(details);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      description: 'An excellent game',
      platforms: ['PC', 'PS5'],
      payload,
    });
  });

  it('returns 500 when fetching IGDB details throws', async () => {
    const error = new Error('boom');
    (fetchIgdbGameDetails as jest.Mock).mockRejectedValue(error);

    const response = await GET(new Request('https://example.com/api/games/igdb-details?igdbId=12'));

    expect(console.error).toHaveBeenCalledWith('IGDB details fetch error:', error);
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Internal server error' });
  });
});
