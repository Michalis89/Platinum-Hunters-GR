/**
 * @jest-environment node
 */

jest.mock('@/lib/services/igdbService', () => ({
  mapIgdbToPayload: jest.fn(),
}));

jest.mock('@/lib/integrations/steam', () => ({
  getSteamCoverUrls: jest.fn(),
}));

import {
  SyncAlreadyRunningError,
  extractErrorMessage,
  normalizeTitle,
  cleanTitleForStorage,
  normalizeForMatch,
  deriveStatusFromSteamData,
  buildDebugSample,
  mapWithConcurrency,
  mergePlatforms,
  getSteamHours,
  buildGameMetadataPatch,
  buildBacklogRedirect,
} from '../helpers';
import { mapIgdbToPayload } from '@/lib/services/igdbService';
import { getSteamCoverUrls } from '@/lib/integrations/steam';
import type { SteamOwnedGame } from '@/lib/integrations/steam';
import type { IgdbGame } from '@/lib/services/igdbService';

const mockMapIgdbToPayload = mapIgdbToPayload as jest.MockedFunction<typeof mapIgdbToPayload>;
const mockGetSteamCoverUrls = getSteamCoverUrls as jest.MockedFunction<typeof getSteamCoverUrls>;

// ─── SyncAlreadyRunningError ───────────────────────────────────────────────

describe('SyncAlreadyRunningError', () => {
  it('sets message and jobId', () => {
    const err = new SyncAlreadyRunningError('job-123');
    expect(err.message).toBe('A sync is already in progress.');
    expect(err.name).toBe('SyncAlreadyRunningError');
    expect(err.jobId).toBe('job-123');
    expect(err).toBeInstanceOf(Error);
  });

  it('accepts null jobId', () => {
    const err = new SyncAlreadyRunningError(null);
    expect(err.jobId).toBeNull();
  });
});

// ─── extractErrorMessage ───────────────────────────────────────────────────

describe('extractErrorMessage', () => {
  it('returns message from Error instance', () => {
    expect(extractErrorMessage(new Error('boom'), 'fallback')).toBe('boom');
  });

  it('returns message from plain object with message string', () => {
    expect(extractErrorMessage({ message: 'obj error' }, 'fallback')).toBe('obj error');
  });

  it('returns fallback for object with empty message', () => {
    expect(extractErrorMessage({ message: '   ' }, 'fallback')).toBe('fallback');
  });

  it('returns fallback for object without message', () => {
    expect(extractErrorMessage({ code: 500 }, 'fallback')).toBe('fallback');
  });

  it('returns fallback for null', () => {
    expect(extractErrorMessage(null, 'fallback')).toBe('fallback');
  });

  it('returns fallback for string (non-Error)', () => {
    expect(extractErrorMessage('some string', 'fallback')).toBe('fallback');
  });

  it('returns fallback for number', () => {
    expect(extractErrorMessage(42, 'fallback')).toBe('fallback');
  });
});

// ─── normalizeTitle ────────────────────────────────────────────────────────

describe('normalizeTitle', () => {
  it('lowercases and trims', () => {
    expect(normalizeTitle('  Hello World  ')).toBe('hello world');
  });

  it('returns empty string for null', () => {
    expect(normalizeTitle(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(normalizeTitle(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(normalizeTitle('')).toBe('');
  });
});

// ─── cleanTitleForStorage ──────────────────────────────────────────────────

describe('cleanTitleForStorage', () => {
  it('removes trademark symbols', () => {
    expect(cleanTitleForStorage('Game™')).toBe('Game');
    expect(cleanTitleForStorage('Game®')).toBe('Game');
    expect(cleanTitleForStorage('Game©')).toBe('Game');
  });

  it('trims whitespace after removal', () => {
    expect(cleanTitleForStorage('  My Game™  ')).toBe('My Game');
  });

  it('returns empty string for null', () => {
    expect(cleanTitleForStorage(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(cleanTitleForStorage(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(cleanTitleForStorage('')).toBe('');
  });

  it('leaves clean titles unchanged', () => {
    expect(cleanTitleForStorage('The Witcher 3')).toBe('The Witcher 3');
  });
});

// ─── normalizeForMatch ─────────────────────────────────────────────────────

describe('normalizeForMatch', () => {
  it('returns empty string for null', () => {
    expect(normalizeForMatch(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(normalizeForMatch(undefined)).toBe('');
  });

  it('lowercases and removes non-alphanumeric', () => {
    expect(normalizeForMatch('Hello World!')).toBe('helloworld');
  });

  it('removes trademark symbols', () => {
    expect(normalizeForMatch('Game™')).toBe('game');
  });

  it('strips edition tokens', () => {
    expect(normalizeForMatch('The Witcher - Complete Edition')).toBe('thewitcher');
    expect(normalizeForMatch('Skyrim - Definitive Edition')).toBe('skyrim');
    expect(normalizeForMatch('Some Game Remastered')).toBe('somegame');
    expect(normalizeForMatch('Game - Enhanced Edition')).toBe('game');
    expect(normalizeForMatch('Game of the Year Edition')).toBe('');
    expect(normalizeForMatch('RPG GOTY')).toBe('rpg');
    expect(normalizeForMatch('Game - Ultimate Edition')).toBe('game');
    expect(normalizeForMatch('Game Deluxe Edition')).toBe('game');
    expect(normalizeForMatch('Game Special Edition')).toBe('game');
    expect(normalizeForMatch("Game - Collector's Edition")).toBe('game');
    expect(normalizeForMatch("Game - Director's Cut")).toBe('game');
    expect(normalizeForMatch('Franchise Bundle')).toBe('franchise');
    expect(normalizeForMatch('Game DLC')).toBe('game');
  });

  it('normalizes accented characters', () => {
    const result = normalizeForMatch('Pokémon');
    // After NFKD normalization, accents are stripped
    expect(result).toBe('pokemon');
  });
});

// ─── deriveStatusFromSteamData ─────────────────────────────────────────────

describe('deriveStatusFromSteamData', () => {
  it('returns planned when playtime and lastPlayed are both 0', () => {
    expect(deriveStatusFromSteamData({ playtimeMinutes: 0, lastPlayedUnix: 0 })).toBe('planned');
  });

  it('returns planned when params are omitted', () => {
    expect(deriveStatusFromSteamData({})).toBe('planned');
  });

  it('returns completed when achievementsPercent is 100', () => {
    expect(
      deriveStatusFromSteamData({
        playtimeMinutes: 100,
        lastPlayedUnix: 1000,
        achievementsPercent: 100,
      }),
    ).toBe('completed');
  });

  it('returns dropped when last played > threshold days ago', () => {
    const oldTimestamp = Math.floor((Date.now() - 200 * 24 * 60 * 60 * 1000) / 1000);
    expect(deriveStatusFromSteamData({ playtimeMinutes: 60, lastPlayedUnix: oldTimestamp })).toBe(
      'dropped',
    );
  });

  it('returns current when last played recently', () => {
    const recentTimestamp = Math.floor((Date.now() - 5 * 24 * 60 * 60 * 1000) / 1000);
    expect(
      deriveStatusFromSteamData({ playtimeMinutes: 60, lastPlayedUnix: recentTimestamp }),
    ).toBe('current');
  });

  it('returns current when has playtime but no lastPlayed', () => {
    expect(deriveStatusFromSteamData({ playtimeMinutes: 60, lastPlayedUnix: 0 })).toBe('current');
  });

  it('respects custom droppedThresholdDays', () => {
    // 10 days ago, threshold 5 days → dropped
    const timestamp = Math.floor((Date.now() - 10 * 24 * 60 * 60 * 1000) / 1000);
    expect(
      deriveStatusFromSteamData({
        playtimeMinutes: 60,
        lastPlayedUnix: timestamp,
        droppedThresholdDays: 5,
      }),
    ).toBe('dropped');
  });

  it('returns planned when playtime is 0 even if lastPlayed is set', () => {
    // This case: playtimeMinutes=0 lastPlayedUnix>0 → not caught by first check
    // achievementsPercent not 100 → skips completed
    // lastPlayedUnix > 0 AND playtimeMinutes > 0 → false, skips dropped
    // playtimeMinutes > 0 → false, skips current
    // falls through to planned
    expect(deriveStatusFromSteamData({ playtimeMinutes: 0, lastPlayedUnix: 1000 })).toBe('planned');
  });
});

// ─── buildDebugSample ──────────────────────────────────────────────────────

describe('buildDebugSample', () => {
  const makeGame = (appid: number, overrides?: Partial<SteamOwnedGame>): SteamOwnedGame => ({
    appid,
    name: `Game ${appid}`,
    playtime_forever: 0,
    playtime_2weeks: 0,
    rtime_last_played: 0,
    has_community_visible_stats: false,
    ...overrides,
  });

  it('returns sample with correct fields', () => {
    const games = [makeGame(1, { playtime_forever: 120 })];
    const result = buildDebugSample(games);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      appid: 1,
      name: 'Game 1',
      playtime_forever: 120,
      mappedStatus: 'current',
    });
  });

  it('limits to 20 games', () => {
    const games = Array.from({ length: 30 }, (_, i) => makeGame(i + 1));
    expect(buildDebugSample(games)).toHaveLength(20);
  });

  it('uses achievements percent from map', () => {
    const games = [makeGame(1, { playtime_forever: 60 })];
    const achievMap = new Map([[1, 100]]);
    const result = buildDebugSample(games, achievMap);
    expect(result[0].achievementsPercent).toBe(100);
    expect(result[0].mappedStatus).toBe('completed');
  });

  it('handles missing achievement map', () => {
    const games = [makeGame(1)];
    const result = buildDebugSample(games, undefined);
    expect(result[0].achievementsPercent).toBeUndefined();
  });
});

// ─── mapWithConcurrency ────────────────────────────────────────────────────

describe('mapWithConcurrency', () => {
  it('processes empty array', async () => {
    const result = await mapWithConcurrency([], 3, async x => x);
    expect(result).toEqual([]);
  });

  it('maps items and preserves order', async () => {
    const result = await mapWithConcurrency([1, 2, 3], 2, async x => x * 2);
    expect(result).toEqual([2, 4, 6]);
  });

  it('calls onItemComplete for each item', async () => {
    const calls: [number, number][] = [];
    await mapWithConcurrency(
      [1, 2, 3],
      2,
      async x => x,
      (done, total) => {
        calls.push([done, total]);
      },
    );
    expect(calls).toEqual([
      [1, 3],
      [2, 3],
      [3, 3],
    ]);
  });

  it('respects concurrency limit (limit=1 → serial)', async () => {
    const order: number[] = [];
    await mapWithConcurrency([1, 2, 3], 1, async x => {
      order.push(x);
      return x;
    });
    expect(order).toEqual([1, 2, 3]);
  });

  it('clamps limit to at least 1', async () => {
    const result = await mapWithConcurrency([10, 20], 0, async x => x + 1);
    expect(result).toEqual([11, 21]);
  });

  it('handles async callbacks in onItemComplete', async () => {
    const calls: number[] = [];
    await mapWithConcurrency(
      [1, 2],
      2,
      async x => x,
      async done => {
        calls.push(done);
      },
    );
    expect(calls.sort()).toEqual([1, 2]);
  });
});

// ─── mergePlatforms ───────────────────────────────────────────────────────

describe('mergePlatforms', () => {
  it('always includes PC first', () => {
    expect(mergePlatforms(null)).toEqual(['PC']);
  });

  it('includes PC and other platforms, deduped', () => {
    expect(mergePlatforms(['PC', 'PlayStation 5'])).toEqual(['PC', 'PlayStation 5']);
  });

  it('deduplicates PC', () => {
    const result = mergePlatforms(['PC', 'Xbox']);
    expect(result).toEqual(['PC', 'Xbox']);
    expect(result.filter(p => p === 'PC')).toHaveLength(1);
  });

  it('handles undefined', () => {
    expect(mergePlatforms(undefined)).toEqual(['PC']);
  });

  it('adds platforms after PC', () => {
    expect(mergePlatforms(['Switch', 'PS4'])).toEqual(['PC', 'Switch', 'PS4']);
  });
});

// ─── getSteamHours ────────────────────────────────────────────────────────

describe('getSteamHours', () => {
  const makeGame = (overrides?: Partial<SteamOwnedGame>): SteamOwnedGame =>
    ({
      appid: 1,
      name: 'Game',
      ...overrides,
    }) as SteamOwnedGame;

  it('returns null when playtime_forever is not a number', () => {
    expect(getSteamHours(makeGame({ playtime_forever: undefined }))).toBeNull();
  });

  it('converts minutes to hours (floor)', () => {
    expect(getSteamHours(makeGame({ playtime_forever: 90 }))).toBe(1);
  });

  it('returns 0 for 0 playtime', () => {
    expect(getSteamHours(makeGame({ playtime_forever: 0 }))).toBe(0);
  });

  it('floors decimal hours', () => {
    expect(getSteamHours(makeGame({ playtime_forever: 119 }))).toBe(1);
    expect(getSteamHours(makeGame({ playtime_forever: 120 }))).toBe(2);
  });
});

// ─── buildGameMetadataPatch ───────────────────────────────────────────────

describe('buildGameMetadataPatch', () => {
  const makeGame = (overrides?: Partial<SteamOwnedGame>): SteamOwnedGame =>
    ({
      appid: 100,
      name: 'My Game',
      playtime_forever: 60,
      ...overrides,
    }) as SteamOwnedGame;

  const makeIgdb = (overrides?: Partial<IgdbGame>): IgdbGame =>
    ({
      id: 42,
      name: 'My Game',
      ...overrides,
    }) as IgdbGame;

  beforeEach(() => {
    mockMapIgdbToPayload.mockReturnValue({
      igdb_id: 42,
      title: 'My Game',
      title_english: 'My Game',
      description: 'desc',
      cover_image_large: 'https://igdb/large.jpg',
      cover_image_medium: 'https://igdb/medium.jpg',
      season_year: 2023,
      release_date: '2023-01-01',
      rating: 85,
      platforms: ['PC', 'Xbox'],
      genres: ['RPG'],
      developer: 'Dev Co',
      publisher: 'Pub Co',
    } as ReturnType<typeof mapIgdbToPayload>);

    mockGetSteamCoverUrls.mockReturnValue({
      large: 'https://steam/large.jpg',
      medium: 'https://steam/medium.jpg',
    });
  });

  it('returns correct patch with IGDB covers', () => {
    const patch = buildGameMetadataPatch(makeGame(), makeIgdb());

    expect(patch.source).toBe('igdb');
    expect(patch.rawg_id).toBe(42);
    expect(patch.steam_app_id).toBe(100);
    expect(patch.title).toBe('My Game');
    expect(patch.cover_image_large).toBe('https://igdb/large.jpg');
    expect(patch.platforms).toEqual(['PC', 'Xbox']);
  });

  it('falls back to Steam covers when IGDB has no cover', () => {
    mockMapIgdbToPayload.mockReturnValue({
      igdb_id: 42,
      title: 'My Game',
      cover_image_large: null,
      cover_image_medium: undefined,
      platforms: [],
    } as unknown as ReturnType<typeof mapIgdbToPayload>);

    const patch = buildGameMetadataPatch(makeGame(), makeIgdb());
    expect(patch.cover_image_large).toBe('https://steam/large.jpg');
    expect(patch.cover_image_medium).toBe('https://steam/medium.jpg');
  });

  it('uses game.name when payload.title is missing', () => {
    mockMapIgdbToPayload.mockReturnValue({
      igdb_id: 42,
      title: null,
      cover_image_large: null,
      cover_image_medium: null,
      platforms: [],
    } as unknown as ReturnType<typeof mapIgdbToPayload>);

    const patch = buildGameMetadataPatch(makeGame({ name: 'Fallback Name' }), makeIgdb());
    expect(patch.title).toBe('Fallback Name');
  });

  it('uses Steam App ID fallback when game has no name', () => {
    mockMapIgdbToPayload.mockReturnValue({
      igdb_id: 42,
      title: null,
      cover_image_large: null,
      cover_image_medium: null,
      platforms: [],
    } as unknown as ReturnType<typeof mapIgdbToPayload>);

    const patch = buildGameMetadataPatch(makeGame({ name: undefined }), makeIgdb());
    expect(patch.title).toBe('Steam App 100');
  });

  it('strips trademark symbols from title', () => {
    mockMapIgdbToPayload.mockReturnValue({
      igdb_id: 42,
      title: 'Game™',
      cover_image_large: null,
      cover_image_medium: null,
      platforms: [],
    } as unknown as ReturnType<typeof mapIgdbToPayload>);

    const patch = buildGameMetadataPatch(makeGame(), makeIgdb());
    expect(patch.title).toBe('Game');
  });
});

// ─── buildBacklogRedirect ─────────────────────────────────────────────────

describe('buildBacklogRedirect', () => {
  it('returns success URL', () => {
    const url = buildBacklogRedirect('http://localhost/api/integrations/steam/sync', 'success');
    expect(url.pathname).toBe('/backlog');
    expect(url.searchParams.get('category')).toBe('games');
    expect(url.searchParams.get('steam')).toBe('success');
    expect(url.searchParams.get('steam_reason')).toBeNull();
  });

  it('returns error URL with reason', () => {
    const url = buildBacklogRedirect(
      'http://localhost/api/integrations/steam/sync',
      'error',
      'unauthorized',
    );
    expect(url.searchParams.get('steam')).toBe('error');
    expect(url.searchParams.get('steam_reason')).toBe('unauthorized');
  });

  it('returns error URL without reason when reason is undefined', () => {
    const url = buildBacklogRedirect('http://localhost/api/integrations/steam/sync', 'error');
    expect(url.searchParams.get('steam_reason')).toBeNull();
  });
});
