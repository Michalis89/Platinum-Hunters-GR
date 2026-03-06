type TokenCache = {
  accessToken: string;
  expiresAtMs: number;
};

let cache: TokenCache | null = null;
// Coalesce concurrent token fetches into one in-flight request
let inflight: Promise<string> | null = null;

function assertEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing env var: ${name}`);
  }
  return v;
}

export async function getIgdbAccessToken(): Promise<string> {
  const now = Date.now();

  // 30s safety margin
  if (cache && cache.expiresAtMs - 30_000 > now) {
    return cache.accessToken;
  }

  // If a fetch is already in-flight, reuse it instead of stampeding
  if (inflight) {
    return inflight;
  }

  inflight = (async () => {
    const clientId = assertEnv('TWITCH_CLIENT_ID');
    const clientSecret = assertEnv('TWITCH_CLIENT_SECRET');

    const url = new URL('https://id.twitch.tv/oauth2/token');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('client_secret', clientSecret);
    url.searchParams.set('grant_type', 'client_credentials');

    const res = await fetch(url.toString(), { method: 'POST' });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Twitch token error: ${res.status} ${res.statusText} ${text}`);
    }

    const data = (await res.json()) as {
      access_token: string;
      expires_in: number;
      token_type: string;
    };

    cache = {
      accessToken: data.access_token,
      expiresAtMs: now + data.expires_in * 1000,
    };

    return cache.accessToken;
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}

export function getIgdbClientId(): string {
  return assertEnv('TWITCH_CLIENT_ID');
}
