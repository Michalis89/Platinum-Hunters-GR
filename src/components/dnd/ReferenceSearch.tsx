'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Feather,
  Globe,
  GraduationCap,
  Layers,
  Search,
  Shield,
  Sparkles,
  Sword,
  Swords,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react';
import type { DndReferenceCategory, ReferenceSearchResult } from '@/lib/dnd/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type SearchCategoryFilter = DndReferenceCategory | 'all';

type SearchResponse = {
  data?: ReferenceSearchResult[];
  error?: string;
};

type ReferenceSearchProps = {
  onSelect: (result: ReferenceSearchResult) => void;
  selectedUrl?: string | null;
};

const FILTERS: { value: SearchCategoryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'spells', label: 'Spells' },
  { value: 'monsters', label: 'Monsters' },
  { value: 'magic-items', label: 'Magic Items' },
  { value: 'conditions', label: 'Conditions' },
  { value: 'races', label: 'Races' },
  { value: 'classes', label: 'Classes' },
  { value: 'backgrounds', label: 'Backgrounds' },
  { value: 'feats', label: 'Feats' },
  { value: 'weapons', label: 'Weapons' },
  { value: 'armor', label: 'Armor' },
  { value: 'planes', label: 'Planes' },
  { value: 'sections', label: 'Rules' },
];

const CATEGORY_LABELS: Record<DndReferenceCategory, string> = {
  spells: 'Spell',
  monsters: 'Monster',
  'magic-items': 'Magic Item',
  conditions: 'Condition',
  backgrounds: 'Background',
  feats: 'Feat',
  planes: 'Plane',
  classes: 'Class',
  sections: 'Rules',
  races: 'Race',
  weapons: 'Weapon',
  armor: 'Armor',
};

const CATEGORY_ICONS: Record<DndReferenceCategory, React.ComponentType<{ className?: string }>> = {
  spells: Sparkles,
  monsters: Swords,
  'magic-items': Zap,
  conditions: Shield,
  backgrounds: Feather,
  feats: GraduationCap,
  planes: Globe,
  classes: Users,
  sections: BookOpen,
  races: User,
  weapons: Sword,
  armor: Layers,
};

export function ReferenceSearch({ onSelect, selectedUrl }: ReferenceSearchProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [category, setCategory] = useState<SearchCategoryFilter>('all');
  const [results, setResults] = useState<ReferenceSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setDebouncedQuery('');
      return;
    }

    const handle = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => {
      window.clearTimeout(handle);
    };
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    let active = true;
    const controller = new AbortController();

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `/api/dnd/reference/search?q=${encodeURIComponent(debouncedQuery)}&category=${category}`,
          { method: 'GET', signal: controller.signal, cache: 'no-store' },
        );

        const payload = (await response.json()) as SearchResponse;
        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? 'Failed to search reference data.');
        }

        if (active) {
          setResults(payload.data);
        }
      } catch (requestError) {
        if (!active || controller.signal.aborted) return;
        const message =
          requestError instanceof Error ? requestError.message : 'Failed to search reference data.';
        setError(message);
        setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [category, debouncedQuery]);

  const groupedResults = useMemo(() => {
    if (category !== 'all') return [];

    return (
      [
        'spells',
        'monsters',
        'magic-items',
        'conditions',
        'races',
        'classes',
        'backgrounds',
        'feats',
        'weapons',
        'armor',
        'planes',
        'sections',
      ] as DndReferenceCategory[]
    )
      .map(cat => ({
        category: cat,
        items: results.filter(item => item.category === cat),
      }))
      .filter(group => group.items.length > 0);
  }, [category, results]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search spells, monsters, feats, planes..."
          className="h-12 pl-9 pr-10"
        />
        {query ? (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-150 [transition-timing-function:var(--easing-default)] hover:text-foreground"
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      <div className="-mx-1 touch-pan-x overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
        <div className="flex w-max min-w-max gap-2">
          {FILTERS.map(filter => (
            <Button
              key={filter.value}
              type="button"
              variant={category === filter.value ? 'primary' : 'secondary'}
              size="sm"
              className="min-h-[36px] rounded-full px-3"
              onClick={() => setCategory(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Search failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {query.trim().length > 0 && query.trim().length < 2 ? (
        <Alert>
          <AlertTitle>Type at least 2 characters</AlertTitle>
          <AlertDescription>Search starts after two characters.</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map(index => (
            <div key={index} className="rounded-lg border border-border p-3">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="mt-2 h-3 w-2/5" />
            </div>
          ))}
        </div>
      ) : null}

      {!loading && debouncedQuery.length >= 2 && results.length === 0 && !error ? (
        <EmptyState
          size="sm"
          icon={<Search className="size-5" />}
          title="No results"
          description={`Nothing found for "${debouncedQuery}" in Open5e.`}
        />
      ) : null}

      {/* Single category results */}
      {!loading && results.length > 0 && category !== 'all' ? (
        <div className="space-y-2">
          {results.map(item => (
            <ResultButton
              key={`${item.category}:${item.index}`}
              item={item}
              selectedUrl={selectedUrl}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : null}

      {/* All categories grouped */}
      {!loading && results.length > 0 && category === 'all' ? (
        <div className="space-y-4">
          {groupedResults.map(group => {
            const Icon = CATEGORY_ICONS[group.category];
            return (
              <section key={group.category} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className="size-4 text-muted-foreground" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {CATEGORY_LABELS[group.category]}
                  </h3>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-2">
                  {group.items.map(item => (
                    <ResultButton
                      key={`${item.category}:${item.index}`}
                      item={item}
                      selectedUrl={selectedUrl}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function ResultButton({
  item,
  selectedUrl,
  onSelect,
}: {
  item: ReferenceSearchResult;
  selectedUrl?: string | null;
  onSelect: (item: ReferenceSearchResult) => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex min-h-[44px] w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors duration-150 [transition-timing-function:var(--easing-default)] hover:bg-[hsl(var(--surface-hover))]',
        selectedUrl === item.url ? 'border-primary/40 bg-primary/10' : '',
      )}
      onClick={() => onSelect(item)}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
        {item.source ? (
          <p className="truncate text-xs text-muted-foreground">{item.source}</p>
        ) : null}
      </div>
      <Badge variant="secondary" className="ml-2 shrink-0">
        {CATEGORY_LABELS[item.category]}
      </Badge>
    </button>
  );
}
