import { UNTITLED_FALLBACK, DEFAULT_COVER } from '@/lib/constants/messages';
import { igdbImage, igdbPost, normalizeHttpsUrl, unixToDate } from '@/lib/igdb/igdbClient';
import { igdbAllowedCategoriesWhereClause } from '@/lib/igdb/categories';

export type IgdbGame = {
  id: number;
  name: string;
  category?: number | null;
  parent_game?: number | null;
  version_parent?: number | null;
  slug?: string | null;
  summary?: string | null;
  storyline?: string | null;
  first_release_date?: number | null;
  updated_at?: number | null;
  cover?: { image_id?: string | null } | null;
  artworks?: Array<{ image_id?: string | null } | null> | null;
  screenshots?: Array<{ image_id?: string | null } | null> | null;
  platforms?: Array<{ name?: string | null } | null> | null;
  genres?: Array<{ name?: string | null } | null> | null;
  themes?: Array<{ name?: string | null } | null> | null;
  game_modes?: Array<{ name?: string | null } | null> | null;
  player_perspectives?: Array<{ name?: string | null } | null> | null;
  involved_companies?: Array<{
    developer?: boolean | null;
    publisher?: boolean | null;
    company?: { name?: string | null } | null;
  } | null> | null;
  aggregated_rating?: number | null;
  aggregated_rating_count?: number | null;
  rating?: number | null;
  rating_count?: number | null;
  websites?: Array<{ url?: string | null; category?: number | null } | null> | null;
};

export type GameSearchResult = {
  source: 'local' | 'external';
  id: string;
  mediaId?: number;
  externalId?: number;
  title: string;
  subtitle: string;
  year?: string;
  status: string;
  score: string | null;
  tags: string[];
  cover: string;
  igdbCategory?: number;
  payload?: GamePayload;
};

export type GamePayload = {
  igdb_id: number;
  igdb_category: number | null;
  igdb_slug: string | null;
  category: 'games';
  source: 'igdb';
  title: string;
  title_english: string;
  summary: string | null;
  storyline: string | null;
  description: string | null;
  cover_image_id: string | null;
  cover_url_thumb: string | null;
  cover_url_big: string | null;
  cover_image_large: string | null;
  cover_image_medium: string | null;
  season_year: number | null;
  first_release_date: string | null;
  release_date: string | null;
  aggregated_rating: number | null;
  aggregated_rating_count: number | null;
  rating: number | null;
  rating_count: number | null;
  platforms: string[];
  genres: string[];
  igdb_themes: string[];
  igdb_game_modes: string[];
  igdb_player_perspectives: string[];
  igdb_artwork_image_ids: string[];
  igdb_screenshot_image_ids: string[];
  official_website: string | null;
  developer: string | null;
  publisher: string | null;
  igdb_updated_at: string | null;
};

const WEBSITE_CATEGORY_OFFICIAL = new Set<number>([1]);
const PREFERRED_STORE_DOMAINS = [
  'playstation.com',
  'xbox.com',
  'nintendo.com',
  'steampowered.com',
  'gog.com',
  'epicgames.com',
];
const REJECTED_WEBSITE_DOMAINS = [
  'wikipedia.org',
  'fandom.com',
  'twitch.tv',
  'reddit.com',
  'twitter.com',
  'x.com',
  'instagram.com',
  'facebook.com',
  'discord.gg',
  'youtube.com',
];

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function toNames(rows: Array<{ name?: string | null } | null> | null | undefined): string[] {
  if (!Array.isArray(rows)) {return [];}
  return uniqueSorted(rows.map(row => row?.name?.trim() ?? '').filter(Boolean));
}

function toImageIds(
  rows: Array<{ image_id?: string | null } | null> | null | undefined,
  limit: number,
): string[] {
  if (!Array.isArray(rows)) {return [];}
  return uniqueSorted(rows.map(row => row?.image_id?.trim() ?? '').filter(Boolean)).slice(0, limit);
}

function normalizeWebsite(url: string | null | undefined): string | null {
  const normalized = normalizeHttpsUrl(url ?? null);
  if (!normalized) {return null;}
  return normalized.trim() || null;
}

function getHostname(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

function hostMatches(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

export function pickOfficialWebsite(
  websites: Array<{ url?: string | null; category?: number | null } | null> | null | undefined,
): string | null {
  if (!Array.isArray(websites) || websites.length === 0) {return null;}

  const normalized = websites
    .map(site => {
      const url = normalizeWebsite(site?.url ?? null);
      if (!url) {return null;}
      const host = getHostname(url);
      if (!host) {return null;}
      if (REJECTED_WEBSITE_DOMAINS.some(domain => hostMatches(host, domain))) {return null;}
      return {
        url,
        host,
        category: typeof site?.category === 'number' ? site.category : null,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (normalized.length === 0) {return null;}

  const official = normalized.find(
    item => item.category !== null && WEBSITE_CATEGORY_OFFICIAL.has(item.category),
  );
  if (official) {return official.url;}

  const preferredDomain = normalized.find(item =>
    PREFERRED_STORE_DOMAINS.some(domain => hostMatches(item.host, domain)),
  );
  if (preferredDomain) {return preferredDomain.url;}

  return normalized[0]?.url ?? null;
}

function resolveDevelopers(game: IgdbGame): string[] {
  return Array.from(
    new Set(
      (game.involved_companies ?? [])
        .filter(row => row?.developer)
        .map(row => row?.company?.name?.trim() ?? '')
        .filter(Boolean),
    ),
  );
}

function resolvePublishers(game: IgdbGame): string[] {
  return Array.from(
    new Set(
      (game.involved_companies ?? [])
        .filter(row => row?.publisher)
        .map(row => row?.company?.name?.trim() ?? '')
        .filter(Boolean),
    ),
  );
}

export async function searchIgdbGames(query: string, limit = 12): Promise<IgdbGame[]> {
  const escaped = query.replace(/"/g, '\\"');
  const body = `
fields id,name,category,slug,first_release_date,cover.image_id,summary,platforms.name,genres.name;
search "${escaped}";
where category = ${igdbAllowedCategoriesWhereClause()};
limit ${Math.max(1, Math.min(limit, 50))};
`;
  const data = (await igdbPost('/games', body)) as IgdbGame[];
  return Array.isArray(data) ? data : [];
}

export async function searchIgdbGamesWithoutCategoryFilter(
  query: string,
  limit = 12,
): Promise<IgdbGame[]> {
  const escaped = query.replace(/"/g, '\\"');
  const body = `
fields id,name,category,parent_game,version_parent,slug,first_release_date,cover.image_id,summary,platforms.name,genres.name;
search "${escaped}";
limit ${Math.max(1, Math.min(limit, 50))};
`;
  const data = (await igdbPost('/games', body)) as IgdbGame[];
  return Array.isArray(data) ? data : [];
}

export async function findIgdbGameIdBySteamAppId(steamAppId: number): Promise<number | null> {
  if (!Number.isFinite(steamAppId) || steamAppId <= 0) {return null;}

  // IGDB external_games category=1 -> Steam
  const body = `
fields game,uid,category;
where uid = "${Math.floor(steamAppId)}" & category = 1;
limit 1;
`;
  const data = (await igdbPost('/external_games', body)) as Array<{
    game?: number | { id?: number | null } | null;
  }>;
  if (!Array.isArray(data) || data.length === 0) {return null;}
  const gameField = data[0]?.game;
  if (typeof gameField === 'number') {return gameField;}
  if (typeof gameField?.id === 'number') {return gameField.id;}
  return null;
}

export async function fetchIgdbGameDetails(
  igdbId: number,
  options?: { mainGameOnly?: boolean },
): Promise<IgdbGame | null> {
  if (!Number.isFinite(igdbId) || igdbId <= 0) {return null;}
  const mainGameOnly = options?.mainGameOnly ?? true;
  const whereClause = mainGameOnly
    ? `where id = ${Math.floor(igdbId)} & category = ${igdbAllowedCategoriesWhereClause()};`
    : `where id = ${Math.floor(igdbId)};`;

  const body = `
fields id,name,category,parent_game,version_parent,slug,summary,storyline,first_release_date,updated_at,cover.image_id,artworks.image_id,screenshots.image_id,platforms.name,genres.name,themes.name,game_modes.name,player_perspectives.name,involved_companies.company.name,involved_companies.developer,involved_companies.publisher,aggregated_rating,aggregated_rating_count,rating,rating_count,websites.url,websites.category;
${whereClause}
limit 1;
`;
  const data = (await igdbPost('/games', body)) as IgdbGame[];
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

export function mapIgdbToPayload(game: IgdbGame): GamePayload {
  const releaseDate = unixToDate(game.first_release_date ?? null);
  const updatedAt = unixToDate(game.updated_at ?? null);
  const coverImageId = game.cover?.image_id ?? null;
  const coverThumb = igdbImage(coverImageId, 't_cover_small');
  const coverBig = igdbImage(coverImageId, 't_cover_big');
  const developers = resolveDevelopers(game);
  const publishers = resolvePublishers(game);

  return {
    igdb_id: game.id,
    igdb_category: typeof game.category === 'number' ? game.category : null,
    igdb_slug: game.slug ?? null,
    category: 'games',
    source: 'igdb',
    title: game.name,
    title_english: game.name,
    summary: game.summary ?? null,
    storyline: game.storyline ?? null,
    description: game.storyline ?? game.summary ?? null,
    cover_image_id: coverImageId,
    cover_url_thumb: coverThumb,
    cover_url_big: coverBig,
    cover_image_large: coverBig,
    cover_image_medium: coverThumb,
    season_year: releaseDate ? releaseDate.getUTCFullYear() : null,
    first_release_date: releaseDate ? releaseDate.toISOString().slice(0, 10) : null,
    release_date: releaseDate ? releaseDate.toISOString().slice(0, 10) : null,
    aggregated_rating: game.aggregated_rating ?? null,
    aggregated_rating_count: game.aggregated_rating_count ?? null,
    rating: game.rating ?? null,
    rating_count: game.rating_count ?? null,
    igdb_themes: toNames(game.themes),
    igdb_game_modes: toNames(game.game_modes),
    igdb_player_perspectives: toNames(game.player_perspectives),
    igdb_artwork_image_ids: toImageIds(game.artworks, 12),
    igdb_screenshot_image_ids: toImageIds(game.screenshots, 24),
    official_website: pickOfficialWebsite(game.websites),
    platforms: toNames(game.platforms),
    genres: toNames(game.genres),
    developer: developers[0] ?? null,
    publisher: publishers[0] ?? null,
    igdb_updated_at: updatedAt ? updatedAt.toISOString() : null,
  };
}

export function mapIgdbToSearchResult(game: IgdbGame): GameSearchResult {
  const payload = mapIgdbToPayload(game);
  return {
    source: 'external',
    id: `igdb-${game.id}`,
    externalId: game.id,
    title: game.name,
    subtitle: payload.developer ?? '',
    year: payload.season_year ? String(payload.season_year) : undefined,
    status: 'planned',
    score:
      typeof payload.aggregated_rating === 'number'
        ? payload.aggregated_rating.toFixed(1)
        : typeof payload.rating === 'number'
          ? payload.rating.toFixed(1)
          : null,
    tags: payload.genres ?? [],
    cover: payload.cover_image_large ?? payload.cover_image_medium ?? DEFAULT_COVER,
    igdbCategory: payload.igdb_category ?? undefined,
    payload,
  };
}

export function mapLocalGameItem(item: Record<string, unknown>): GameSearchResult {
  const title =
    (typeof item.title === 'string' && item.title.trim()) ||
    (typeof item.title_english === 'string' && item.title_english.trim()) ||
    UNTITLED_FALLBACK;
  const subtitle = (item.developer as string | undefined) || '';
  const igdbId = item.igdb_id as number | undefined;
  const year =
    typeof item.season_year === 'number'
      ? String(item.season_year)
      : typeof item.first_release_date === 'string'
        ? item.first_release_date.slice(0, 4)
        : undefined;

  return {
    source: 'local',
    id: `local-${item.id}`,
    mediaId: item.id as number,
    externalId: igdbId,
    title,
    subtitle,
    year,
    status: 'planned',
    score:
      typeof item.aggregated_rating === 'number'
        ? String(item.aggregated_rating)
        : typeof item.rating === 'number'
          ? String(item.rating)
          : null,
    tags: (item.genres as string[] | undefined) ?? [],
    igdbCategory: typeof item.igdb_category === 'number' ? item.igdb_category : undefined,
    cover:
      (item.cover_url_big as string | undefined) ||
      (item.cover_image_large as string | undefined) ||
      (item.cover_image_medium as string | undefined) ||
      DEFAULT_COVER,
  };
}
