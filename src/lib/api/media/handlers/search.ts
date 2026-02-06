import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

export type SearchSource = 'local' | 'external' | 'mixed';
export type SearchExternalId = number | string;
export type SearchLocalItem = Record<string, unknown>;

type SearchFetchContext<TCategory extends string> = {
  category: TCategory;
  limit: number;
};

export type MediaSearchConfig<TCategory extends string, TExternalItem, TResultItem> = {
  defaultCategory: TCategory;
  supportedCategories: readonly TCategory[];
  limit?: number;
  logPrefix: string;
  buildLocalOrFilter: (query: string) => string;
  mapLocalItem: (item: SearchLocalItem) => TResultItem;
  mapExternalItem: (item: TExternalItem, category: TCategory) => TResultItem;
  getLocalExternalId: (item: SearchLocalItem) => SearchExternalId | null;
  getExternalId: (item: TExternalItem) => SearchExternalId;
  fetchExternal: (
    query: string,
    context: SearchFetchContext<TCategory>,
  ) => Promise<TExternalItem[]>;
  normalizeSearchTerm?: (value: string) => string;
};

function resolveSource(localCount: number, externalCount: number): SearchSource {
  if (localCount > 0 && externalCount > 0) {
    return 'mixed';
  }
  if (localCount > 0) {
    return 'local';
  }
  return 'external';
}

async function fetchWithNormalization<TCategory extends string, TExternalItem>(
  query: string,
  category: TCategory,
  limit: number,
  normalize: ((value: string) => string) | undefined,
  fetchExternal: (
    search: string,
    context: SearchFetchContext<TCategory>,
  ) => Promise<TExternalItem[]>,
) {
  let items = await fetchExternal(query, { category, limit });
  const normalized = normalize?.(query);

  if (
    items.length === 0 &&
    typeof normalized === 'string' &&
    normalized.length > 0 &&
    normalized !== query
  ) {
    items = await fetchExternal(normalized, { category, limit });
  }

  return items;
}

export async function handleMediaSearch<TCategory extends string, TExternalItem, TResultItem>(
  req: Request,
  config: MediaSearchConfig<TCategory, TExternalItem, TResultItem>,
): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() || '';
    const category = (searchParams.get('category') || config.defaultCategory) as TCategory;
    const limit = config.limit ?? 12;

    if (!q) {
      return NextResponse.json({ source: 'local' as SearchSource, items: [] as TResultItem[] });
    }

    if (!config.supportedCategories.includes(category)) {
      return NextResponse.json({ error: 'Unsupported category' }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();
    const { data: localItems, error: localError } = await supabase
      .from('media_items')
      .select('*')
      .eq('category', category)
      .or(config.buildLocalOrFilter(q))
      .limit(limit);

    if (localError) {
      console.warn(`Local ${config.logPrefix.toLowerCase()} search error:`, localError);
    }

    const typedLocalItems = (localItems as SearchLocalItem[] | null) ?? [];
    const localResults = typedLocalItems.map(config.mapLocalItem);
    const remaining = Math.max(limit - localResults.length, 0);
    const localExternalIds = new Set(
      typedLocalItems
        .map(config.getLocalExternalId)
        .filter((id): id is SearchExternalId => id !== null),
    );

    let externalFetched: TExternalItem[] = [];
    if (remaining > 0) {
      externalFetched = await fetchWithNormalization(
        q,
        category,
        limit,
        config.normalizeSearchTerm,
        config.fetchExternal,
      );
    }

    const externalResults = externalFetched
      .filter(item => !localExternalIds.has(config.getExternalId(item)))
      .slice(0, remaining)
      .map(item => config.mapExternalItem(item, category));

    if (localResults.length > 0 || externalResults.length > 0) {
      return NextResponse.json({
        source: resolveSource(localResults.length, externalResults.length),
        items: [...localResults, ...externalResults],
      });
    }

    const fallback = await fetchWithNormalization(
      q,
      category,
      limit,
      config.normalizeSearchTerm,
      config.fetchExternal,
    );

    return NextResponse.json({
      source: 'external' as SearchSource,
      items: fallback.map(item => config.mapExternalItem(item, category)),
    });
  } catch (error) {
    console.error(`${config.logPrefix} search error:`, error);
    return NextResponse.json({ source: 'external', items: [] }, { status: 500 });
  }
}
