import { getIgdbAccessToken, getIgdbClientId } from './token';

const IGDB_BASE_URL = 'https://api.igdb.com/v4';

export async function igdbPost(endpoint: string, body: string): Promise<unknown> {
  const token = await getIgdbAccessToken();
  const clientId = getIgdbClientId();
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${IGDB_BASE_URL}${normalizedEndpoint}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Client-ID': clientId,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'text/plain',
      Accept: 'application/json',
    },
    body,
    cache: 'no-store',
  });

  const text = await response.text().catch(() => '');
  if (!response.ok) {
    throw new Error(`IGDB request failed (${response.status}): ${text}`);
  }

  return text ? (JSON.parse(text) as unknown) : [];
}

export function igdbImage(imageId: string | null | undefined, size: string): string | null {
  if (!imageId) return null;
  return `https://images.igdb.com/igdb/image/upload/${size}/${imageId}.jpg`;
}

export function normalizeHttpsUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith('//')) return `https:${value}`;
  return value;
}

export function unixToDate(value: number | null | undefined): Date | null {
  if (!Number.isFinite(value)) return null;
  return new Date(Number(value) * 1000);
}
