import { searchIgdbGames, fetchIgdbGameDetails, type IgdbGame } from '@/lib/services/igdbService';
import { type SteamOwnedGame } from '@/lib/integrations/steam';
import { mapWithConcurrency, normalizeForMatch } from './helpers';

export async function matchSteamGamesToIgdb(
  games: SteamOwnedGame[],
  onItemComplete?: (completed: number, total: number) => Promise<void> | void,
) {
  const cache = new Map<string, IgdbGame | null>();

  const pairs = await mapWithConcurrency(
    games,
    3,
    async game => {
      const title = game.name ?? '';
      const key = normalizeForMatch(title);
      if (!key) {
        return [game.appid, null] as const;
      }

      if (cache.has(key)) {
        return [game.appid, cache.get(key) ?? null] as const;
      }

      try {
        const candidates = await searchIgdbGames(title, 8);
        const matched =
          candidates.find(candidate => normalizeForMatch(candidate.name) === key) ?? null;

        cache.set(key, matched);
        return [game.appid, matched] as const;
      } catch (error) {
        console.warn(`IGDB search failed for "${title}":`, error);
        cache.set(key, null);
        return [game.appid, null] as const;
      }
    },
    onItemComplete,
  );

  return new Map<number, IgdbGame | null>(pairs);
}

export async function enrichIgdbMatches(
  matchByAppId: Map<number, IgdbGame | null>,
  onItemComplete?: (completed: number, total: number) => Promise<void> | void,
) {
  const matchedIgdbIds = Array.from(
    new Set(
      Array.from(matchByAppId.values())
        .map(item => item?.id)
        .filter((id): id is number => typeof id === 'number'),
    ),
  );
  const detailsCache = new Map<number, IgdbGame | null>();

  if (matchedIgdbIds.length === 0) {
    return new Map<number, IgdbGame | null>();
  }

  await mapWithConcurrency(
    matchedIgdbIds,
    3,
    async igdbId => {
      try {
        const details = await fetchIgdbGameDetails(igdbId, { mainGameOnly: false });
        detailsCache.set(igdbId, details);
        return details;
      } catch (error) {
        console.warn(`IGDB details fetch failed for ID ${igdbId}:`, error);
        detailsCache.set(igdbId, null);
        return null;
      }
    },
    onItemComplete,
  );

  const enrichedByAppId = new Map<number, IgdbGame | null>();
  for (const [appid, matched] of matchByAppId.entries()) {
    if (!matched) {
      enrichedByAppId.set(appid, null);
      continue;
    }
    enrichedByAppId.set(appid, detailsCache.get(matched.id) ?? matched);
  }

  return enrichedByAppId;
}
