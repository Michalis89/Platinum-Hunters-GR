/**
 * @jest-environment node
 */

const mockSearchIgdbGames = jest.fn();
const mockFetchIgdbGameDetails = jest.fn();

jest.mock('@/lib/services/igdbService', () => ({
  searchIgdbGames: (...args: unknown[]) => mockSearchIgdbGames(...args),
  fetchIgdbGameDetails: (...args: unknown[]) => mockFetchIgdbGameDetails(...args),
}));

// helpers are real (not mocked)
jest.mock('../helpers', () => jest.requireActual('../helpers'));

import { matchSteamGamesToIgdb, enrichIgdbMatches } from '../igdbMatching';
import type { SteamOwnedGame } from '@/lib/integrations/steam';
import type { IgdbGame } from '@/lib/services/igdbService';

function makeGame(appid: number, name?: string): SteamOwnedGame {
  return { appid, name, playtime_forever: 0 } as SteamOwnedGame;
}

function makeIgdb(id: number, name: string): IgdbGame {
  return { id, name } as IgdbGame;
}

// ─── matchSteamGamesToIgdb ────────────────────────────────────────────────

describe('matchSteamGamesToIgdb', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns empty map for empty games list', async () => {
    const result = await matchSteamGamesToIgdb([]);
    expect(result.size).toBe(0);
  });

  it('maps null for game with empty name', async () => {
    const result = await matchSteamGamesToIgdb([makeGame(1, '')]);
    expect(result.get(1)).toBeNull();
    expect(mockSearchIgdbGames).not.toHaveBeenCalled();
  });

  it('maps null for game with undefined name', async () => {
    const result = await matchSteamGamesToIgdb([makeGame(1, undefined)]);
    expect(result.get(1)).toBeNull();
    expect(mockSearchIgdbGames).not.toHaveBeenCalled();
  });

  it('returns matched IGDB game when title normalizes match', async () => {
    const igdb = makeIgdb(42, 'The Witcher 3');
    mockSearchIgdbGames.mockResolvedValue([igdb]);

    const result = await matchSteamGamesToIgdb([makeGame(1, 'The Witcher 3')]);
    expect(result.get(1)).toEqual(igdb);
  });

  it('returns null when no IGDB candidate matches normalized title', async () => {
    const igdb = makeIgdb(99, 'Something Completely Different');
    mockSearchIgdbGames.mockResolvedValue([igdb]);

    const result = await matchSteamGamesToIgdb([makeGame(1, 'The Witcher 3')]);
    expect(result.get(1)).toBeNull();
  });

  it('caches results for same normalized title', async () => {
    const igdb = makeIgdb(42, 'Portal 2');
    mockSearchIgdbGames.mockResolvedValue([igdb]);

    // 4 games: items 0 and 3 have the same title "Portal 2"
    // Workers: limit=3 → 3 workers start simultaneously on items 0,1,2
    // When item 0 finishes, worker takes item 3 → cache hit for "portal2"
    // Items 1,2 have different titles, so portal2 cache is only used for item 3
    const games = [
      makeGame(1, 'Portal 2'), // item 0: worker 1, cache miss
      makeGame(2, 'Dota 2'), // item 1: worker 2, different title
      makeGame(3, 'Dota 3'), // item 2: worker 3, different title
      makeGame(4, 'Portal 2'), // item 3: taken after item 0 finishes → cache hit
    ];

    mockSearchIgdbGames.mockImplementation(async (title: string) => {
      if (title === 'Portal 2') {
        return [igdb];
      }
      return [];
    });

    const result = await matchSteamGamesToIgdb(games);
    // Portal 2 searched only once, item 3 uses cache
    expect(mockSearchIgdbGames).toHaveBeenCalledTimes(3); // portal2, dota2, dota3
    expect(result.get(1)).toEqual(igdb);
    expect(result.get(4)).toEqual(igdb);
  });

  it('returns null on cache hit for a null-valued entry (covers ?? null branch)', async () => {
    // 4 games: items 0 and 3 share the title "Dota 2" (no IGDB match for any)
    // limit=3 → workers 1,2,3 start on items 0,1,2 simultaneously
    // Item 0 (Dota 2) finishes first → cache.set('dota2', null)
    // Worker takes item 3 (Dota 2) → cache hit → cache.get('dota2') = null → null ?? null
    mockSearchIgdbGames.mockResolvedValue([]); // no match for any title

    const games = [
      makeGame(1, 'Dota 2'), // item 0: cache miss → null stored
      makeGame(2, 'Portal 2'), // item 1: different title
      makeGame(3, 'HL3'), // item 2: different title
      makeGame(4, 'Dota 2'), // item 3: cache hit → null ?? null (right side taken)
    ];

    const result = await matchSteamGamesToIgdb(games);
    expect(mockSearchIgdbGames).toHaveBeenCalledTimes(3); // dota2, portal2, hl3
    expect(result.get(1)).toBeNull();
    expect(result.get(4)).toBeNull();
  });

  it('returns null and caches null when IGDB search throws', async () => {
    mockSearchIgdbGames.mockRejectedValue(new Error('network error'));

    const result = await matchSteamGamesToIgdb([makeGame(1, 'Fallout 4')]);
    expect(result.get(1)).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('IGDB search failed'),
      expect.any(Error),
    );
  });

  it('calls onItemComplete callback', async () => {
    mockSearchIgdbGames.mockResolvedValue([]);

    const calls: [number, number][] = [];
    await matchSteamGamesToIgdb([makeGame(1, 'Game A'), makeGame(2, 'Game B')], (done, total) => {
      calls.push([done, total]);
    });

    expect(calls.length).toBe(2);
    expect(calls.map(([, t]) => t)).toEqual([2, 2]);
  });
});

// ─── enrichIgdbMatches ────────────────────────────────────────────────────

describe('enrichIgdbMatches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns empty map when input is empty', async () => {
    const result = await enrichIgdbMatches(new Map());
    expect(result.size).toBe(0);
    expect(mockFetchIgdbGameDetails).not.toHaveBeenCalled();
  });

  it('returns empty map when all inputs have null IGDB match (early exit)', async () => {
    // When all values are null, matchedIgdbIds is empty → early return of empty Map
    const input = new Map<number, IgdbGame | null>([
      [1, null],
      [2, null],
    ]);
    const result = await enrichIgdbMatches(input);
    // The function returns an empty map (no iteration happens) when no IGDB IDs exist
    expect(result.size).toBe(0);
    expect(mockFetchIgdbGameDetails).not.toHaveBeenCalled();
  });

  it('enriches matched games with details', async () => {
    const igdb = makeIgdb(42, 'Portal 2');
    const enriched = makeIgdb(42, 'Portal 2 - enriched');
    mockFetchIgdbGameDetails.mockResolvedValue(enriched);

    const input = new Map<number, IgdbGame | null>([[1, igdb]]);
    const result = await enrichIgdbMatches(input);

    expect(mockFetchIgdbGameDetails).toHaveBeenCalledWith(42, { mainGameOnly: false });
    expect(result.get(1)).toEqual(enriched);
  });

  it('deduplicates IGDB IDs (two games sharing same IGDB ID)', async () => {
    const igdb = makeIgdb(42, 'Portal');
    const enriched = makeIgdb(42, 'Portal enriched');
    mockFetchIgdbGameDetails.mockResolvedValue(enriched);

    const input = new Map<number, IgdbGame | null>([
      [1, igdb],
      [2, igdb],
    ]);
    const result = await enrichIgdbMatches(input);

    expect(mockFetchIgdbGameDetails).toHaveBeenCalledTimes(1);
    expect(result.get(1)).toEqual(enriched);
    expect(result.get(2)).toEqual(enriched);
  });

  it('falls back to original match when details fetch returns null', async () => {
    const igdb = makeIgdb(42, 'Portal 2');
    mockFetchIgdbGameDetails.mockResolvedValue(null);

    const input = new Map<number, IgdbGame | null>([[1, igdb]]);
    const result = await enrichIgdbMatches(input);

    // detailsCache.get(42) is null → uses matched (igdb) as fallback via ?? matched
    expect(result.get(1)).toEqual(igdb);
  });

  it('falls back to original match on fetch error', async () => {
    const igdb = makeIgdb(42, 'Portal 2');
    mockFetchIgdbGameDetails.mockRejectedValue(new Error('api down'));

    const input = new Map<number, IgdbGame | null>([[1, igdb]]);
    const result = await enrichIgdbMatches(input);

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('IGDB details fetch failed'),
      expect.any(Error),
    );
    // detailsCache.get(42) is null → fallback to igdb
    expect(result.get(1)).toEqual(igdb);
  });

  it('handles mixed null and non-null inputs (covers null branch in output loop)', async () => {
    const igdbA = makeIgdb(1, 'Game A');
    const enriched = makeIgdb(1, 'Game A enriched');
    mockFetchIgdbGameDetails.mockResolvedValue(enriched);

    // game 10 has an IGDB match, game 20 has null → mixed input
    const input = new Map<number, IgdbGame | null>([
      [10, igdbA],
      [20, null], // This null entry triggers the !matched branch (lines 85-87)
    ]);
    const result = await enrichIgdbMatches(input);

    expect(result.get(10)).toEqual(enriched);
    expect(result.get(20)).toBeNull();
  });

  it('calls onItemComplete for each fetched IGDB ID', async () => {
    const igdbA = makeIgdb(1, 'Game A');
    const igdbB = makeIgdb(2, 'Game B');
    mockFetchIgdbGameDetails.mockResolvedValue(makeIgdb(99, 'enriched'));

    const input = new Map<number, IgdbGame | null>([
      [10, igdbA],
      [20, igdbB],
    ]);

    const calls: [number, number][] = [];
    await enrichIgdbMatches(input, (done, total) => {
      calls.push([done, total]);
    });

    expect(calls.length).toBe(2);
    expect(calls.map(([, t]) => t)).toEqual([2, 2]);
  });
});
