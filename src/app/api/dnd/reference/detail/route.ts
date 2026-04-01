import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/lib/supabase/database.types';
import { getUserSettings } from '@/lib/settings';

const OPEN5E_BASE_URL = 'https://api.open5e.com/v1/';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type ApiCacheRow = {
  data: unknown;
  expires_at: string;
};

function getCacheClient() {
  try {
    return createSupabaseAdminClient();
  } catch {
    return null;
  }
}

function isAllowedDndApiUrl(url: string): boolean {
  if (!url.startsWith(OPEN5E_BASE_URL)) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === 'api.open5e.com' && parsed.pathname.startsWith('/v1/');
  } catch {
    return false;
  }
}

async function readFromCache(cacheKey: string): Promise<unknown | null> {
  const cache = getCacheClient();
  if (!cache) {
    return null;
  }

  const { data, error } = await cache
    .from('api_cache')
    .select('data,expires_at')
    .eq('key', cacheKey)
    .maybeSingle<ApiCacheRow>();

  if (error || !data) {
    return null;
  }

  const expiresAt = Date.parse(data.expires_at);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return null;
  }

  return data.data;
}

async function writeToCache(cacheKey: string, payload: Json) {
  const cache = getCacheClient();
  if (!cache) {
    return;
  }

  await cache.from('api_cache').upsert({
    key: cacheKey,
    data: payload,
    expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
  });
}

export async function GET(request: Request) {
  const supabase = await createRouteHandlerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await getUserSettings(session.user.id, { supabase });
  if (!settings.dnd_enabled) {
    return NextResponse.json({ error: 'D&D module is disabled' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const detailUrl = searchParams.get('url');

  if (!detailUrl) {
    return NextResponse.json({ error: 'Missing detail url' }, { status: 400 });
  }

  if (!isAllowedDndApiUrl(detailUrl)) {
    return NextResponse.json({ error: 'Invalid detail url' }, { status: 400 });
  }

  const cacheKey = `dnd5e:detail:${detailUrl}`;
  const cached = await readFromCache(cacheKey);

  if (cached) {
    return NextResponse.json({ data: cached });
  }

  try {
    const response = await fetch(detailUrl, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`D&D API detail fetch failed (${response.status})`);
    }

    const payload = (await response.json()) as Json;
    await writeToCache(cacheKey, payload);
    return NextResponse.json({ data: payload });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch detail';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
