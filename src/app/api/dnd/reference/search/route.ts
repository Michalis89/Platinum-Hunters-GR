import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getUserSettings } from '@/lib/settings';
import type { DndReferenceCategory, ReferenceSearchResult } from '@/lib/dnd/types';

const OPEN5E_BASE_URL = 'https://api.open5e.com/v1';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Map our category names to Open5e endpoint names
const ENDPOINT_MAP: Record<DndReferenceCategory, string> = {
  spells: 'spells',
  monsters: 'monsters',
  'magic-items': 'magicitems',
  conditions: 'conditions',
  backgrounds: 'backgrounds',
  feats: 'feats',
  planes: 'planes',
  classes: 'classes',
  sections: 'sections',
  races: 'races',
  weapons: 'weapons',
  armor: 'armor',
};

const ALL_CATEGORIES: DndReferenceCategory[] = [
  'spells',
  'monsters',
  'magic-items',
  'conditions',
  'backgrounds',
  'feats',
  'planes',
  'classes',
  'sections',
  'races',
  'weapons',
  'armor',
];

// Categories shown in "all" fan-out (most DM-relevant)
const FAN_OUT_CATEGORIES: DndReferenceCategory[] = [
  'spells',
  'monsters',
  'magic-items',
  'conditions',
  'backgrounds',
  'feats',
  'planes',
  'races',
];

type SearchCategoryParam = DndReferenceCategory | 'all';
const VALID_CATEGORIES = new Set<string>(['all', ...ALL_CATEGORIES]);

type Open5eListRow = {
  slug: string;
  name: string;
  document__title?: string;
  document__slug?: string;
};

type Open5eListResponse = {
  count?: number;
  results?: Open5eListRow[];
};

type ApiCacheRow = {
  data: ReferenceSearchResult[];
  expires_at: string;
};

function sanitizeQuery(raw: string): string {
  return raw
    .replace(/[^a-zA-Z0-9\s'\-]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 100);
}

function parseCategory(value: string | null): SearchCategoryParam | null {
  if (!value || value === 'all') return 'all';
  return VALID_CATEGORIES.has(value) ? (value as DndReferenceCategory) : null;
}

function getCacheClient() {
  try {
    return createSupabaseAdminClient();
  } catch {
    return null;
  }
}

async function readFromCache(key: string): Promise<ReferenceSearchResult[] | null> {
  const cache = getCacheClient();
  if (!cache) return null;

  const { data, error } = await cache
    .from('api_cache')
    .select('data,expires_at')
    .eq('key', key)
    .maybeSingle<ApiCacheRow>();

  if (error || !data) return null;

  const expiresAt = Date.parse(data.expires_at);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;

  return Array.isArray(data.data) ? data.data : null;
}

async function writeToCache(key: string, payload: ReferenceSearchResult[]) {
  const cache = getCacheClient();
  if (!cache) return;

  await cache.from('api_cache').upsert({
    key,
    data: payload,
    expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
  });
}

async function searchCategory(
  category: DndReferenceCategory,
  query: string,
): Promise<ReferenceSearchResult[]> {
  const endpoint = ENDPOINT_MAP[category];
  const url = `${OPEN5E_BASE_URL}/${endpoint}/?search=${encodeURIComponent(query)}&limit=20&format=json`;

  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Open5e search failed for ${category} (${response.status})`);
  }

  const payload = (await response.json()) as Open5eListResponse;
  const rows = payload.results ?? [];

  return rows.map(row => ({
    index: row.slug,
    name: row.name,
    category,
    url: `${OPEN5E_BASE_URL}/${endpoint}/${row.slug}/`,
    source: row.document__title,
  }));
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
  const category = parseCategory(searchParams.get('category'));
  const query = sanitizeQuery(searchParams.get('q') ?? '');

  if (!category) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }

  if (query.length < 2) {
    return NextResponse.json({ data: [] as ReferenceSearchResult[] });
  }

  const cacheKey = `open5e:${category}:${query.toLowerCase()}`;
  const cached = await readFromCache(cacheKey);
  if (cached) {
    return NextResponse.json({ data: cached });
  }

  try {
    const categoriesToSearch = category === 'all' ? FAN_OUT_CATEGORIES : [category];

    const results = (
      await Promise.all(categoriesToSearch.map(cat => searchCategory(cat, query)))
    ).flat();

    // Sort by name relevance — exact prefix matches first
    const lowerQuery = query.toLowerCase();
    results.sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(lowerQuery) ? 0 : 1;
      const bStarts = b.name.toLowerCase().startsWith(lowerQuery) ? 0 : 1;
      return aStarts - bStarts || a.name.localeCompare(b.name);
    });

    await writeToCache(cacheKey, results);
    return NextResponse.json({ data: results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to search D&D reference';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
