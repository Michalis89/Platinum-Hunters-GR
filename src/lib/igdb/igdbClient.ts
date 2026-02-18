import { getIgdbAccessToken, getIgdbClientId } from './token';
import { cachedExternalFetch } from '@/lib/api-cache/external';

const IGDB_BASE_URL = 'https://api.igdb.com/v4';

export async function igdbPost(endpoint: string, body: string): Promise<unknown> {
  const token = await getIgdbAccessToken();
  const clientId = getIgdbClientId();
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${IGDB_BASE_URL}${normalizedEndpoint}`;

  const cached = await cachedExternalFetch<unknown>({
    apiName: 'igdb',
    endpoint: url,
    ttlSeconds: 6 * 60 * 60,
    init: {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/plain',
        Accept: 'application/json',
      },
      body,
    },
  });

  // Guard against stale-empty cache entries for IGDB list/search calls.
  // If cached result is an empty array, retry uncached once.
  if (Array.isArray(cached) && cached.length === 0) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/plain',
        Accept: 'application/json',
      },
      body,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`IGDB uncached error: ${response.status} ${response.statusText} ${text}`);
    }

    return (await response.json()) as unknown;
  }

  return cached;
}

export function igdbImage(imageId: string | null | undefined, size: string): string | null {
  if (!imageId) {
    return null;
  }
  return `https://images.igdb.com/igdb/image/upload/${size}/${imageId}.jpg`;
}

export function normalizeHttpsUrl(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  if (value.startsWith('//')) {
    return `https:${value}`;
  }
  return value;
}

export function unixToDate(value: number | null | undefined): Date | null {
  if (!Number.isFinite(value)) {
    return null;
  }
  return new Date(Number(value) * 1000);
}
