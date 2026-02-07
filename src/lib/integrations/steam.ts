const STEAM_RESOLVE_VANITY_URL =
  'https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/';
const STEAM_OWNED_GAMES_URL =
  'https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/';

export type SteamOwnedGame = {
  appid: number;
  name?: string;
  playtime_forever?: number;
  playtime_2weeks?: number;
  rtime_last_played?: number;
  has_community_visible_stats?: boolean;
  img_icon_url?: string;
  img_logo_url?: string;
};

type SteamResolveVanityResponse = {
  response?: {
    success?: number;
    steamid?: string;
    message?: string;
  };
};

type SteamOwnedGamesResponse = {
  response?: {
    game_count?: number;
    games?: SteamOwnedGame[];
  };
};

export function getSteamApiKey(): string {
  const value = process.env.STEAM_API_KEY;
  if (!value) {
    throw new Error('Missing required env var: STEAM_API_KEY');
  }
  return value;
}

export function normalizeSteamInput(value: string): { steamId64?: string; vanity?: string } {
  const trimmed = value.trim();
  if (!trimmed) {
    return {};
  }

  const profileIdMatch = trimmed.match(/steamcommunity\.com\/profiles\/(\d{17})/i);
  if (profileIdMatch?.[1]) {
    return { steamId64: profileIdMatch[1] };
  }

  const vanityMatch = trimmed.match(/steamcommunity\.com\/id\/([^/\s?#]+)/i);
  if (vanityMatch?.[1]) {
    return { vanity: vanityMatch[1] };
  }

  if (/^\d{17}$/.test(trimmed)) {
    return { steamId64: trimmed };
  }

  return { vanity: trimmed };
}

export async function resolveSteamId64(params: {
  apiKey: string;
  steamInput: string;
}): Promise<string> {
  const parsed = normalizeSteamInput(params.steamInput);

  if (parsed.steamId64) {
    return parsed.steamId64;
  }

  if (!parsed.vanity) {
    throw new Error('Steam ID is empty');
  }

  const url = new URL(STEAM_RESOLVE_VANITY_URL);
  url.searchParams.set('key', params.apiKey);
  url.searchParams.set('vanityurl', parsed.vanity);
  url.searchParams.set('format', 'json');

  const response = await fetch(url.toString(), {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Steam vanity resolve failed (${response.status}): ${body}`);
  }

  const payload = (await response.json()) as SteamResolveVanityResponse;
  const steamId = payload.response?.steamid;
  const success = payload.response?.success;

  if (!steamId || success !== 1) {
    throw new Error(payload.response?.message || 'Unable to resolve Steam vanity URL');
  }

  return steamId;
}

function buildSteamCoverUrl(appId: number, hash?: string): string | null {
  if (!hash) {
    return null;
  }
  return `https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/${appId}/${hash}.jpg`;
}

export function getSteamCoverUrls(game: SteamOwnedGame): {
  large: string | null;
  medium: string | null;
} {
  const large = buildSteamCoverUrl(game.appid, game.img_logo_url);
  const medium = buildSteamCoverUrl(game.appid, game.img_icon_url) || large;
  return { large, medium };
}

export async function fetchSteamOwnedGames(params: {
  apiKey: string;
  steamId64: string;
}): Promise<SteamOwnedGame[]> {
  const url = new URL(STEAM_OWNED_GAMES_URL);
  url.searchParams.set('key', params.apiKey);
  url.searchParams.set('steamid', params.steamId64);
  url.searchParams.set('include_appinfo', '1');
  url.searchParams.set('include_played_free_games', '1');
  url.searchParams.set('format', 'json');

  const response = await fetch(url.toString(), {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Steam owned games fetch failed (${response.status}): ${body}`);
  }

  const payload = (await response.json()) as SteamOwnedGamesResponse;
  return payload.response?.games ?? [];
}
