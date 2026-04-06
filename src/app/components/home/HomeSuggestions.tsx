'use client';

import { memo, useMemo, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import {
  Sparkles,
  BookMarked,
  Film,
  Tv,
  BookText,
  Gamepad2,
  ChevronRight,
  Star,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { CoverThumbImage, IMAGE_SIZES } from '@/components/ui/cover-image';

const fetcher = apiClient.swrFetcher;

type SuggestionItem = {
  id: string;
  mediaId?: number;
  title: string;
  subtitle?: string;
  year?: string;
  score?: string | null;
  tags?: string[];
  cover: string;
  description?: string;
  source: 'local' | 'external';
  payload?: Record<string, unknown>;
};
export type HomeSuggestionItem = SuggestionItem;

type CategoryConfig = {
  key: string;
  label: string;
  icon: ReactNode;
  apiPath: string;
  addPath: string;
};

const categoryConfigs: CategoryConfig[] = [
  {
    key: 'games',
    label: 'Games',
    icon: <Gamepad2 className="h-4 w-4" />,
    apiPath: '/api/games/suggestions?category=games',
    addPath: '/backlog?category=games',
  },
  {
    key: 'anime',
    label: 'Anime',
    icon: <Sparkles className="h-4 w-4" />,
    apiPath: '/api/anime/suggestions?category=anime',
    addPath: '/backlog?category=anime',
  },
  {
    key: 'manga',
    label: 'Manga',
    icon: <BookMarked className="h-4 w-4" />,
    apiPath: '/api/anime/suggestions?category=manga',
    addPath: '/backlog?category=manga',
  },
  {
    key: 'movies',
    label: 'Movies',
    icon: <Film className="h-4 w-4" />,
    apiPath: '/api/movies/suggestions?category=movies',
    addPath: '/backlog?category=movies',
  },
  {
    key: 'tv',
    label: 'TV shows',
    icon: <Tv className="h-4 w-4" />,
    apiPath: '/api/movies/suggestions?category=tv',
    addPath: '/backlog?category=tv',
  },
  {
    key: 'books',
    label: 'Books',
    icon: <BookText className="h-4 w-4" />,
    apiPath: '/api/books/suggestions',
    addPath: '/backlog?category=books',
  },
];

type HomeSuggestionsProps = {
  enabledCategories: string[];
  fallbackByCategory?: Record<string, SuggestionItem[]>;
};

export function HomeSuggestions({ enabledCategories, fallbackByCategory }: HomeSuggestionsProps) {
  const visibleConfigs = useMemo(
    () => categoryConfigs.filter(config => enabledCategories.includes(config.key)),
    [enabledCategories],
  );
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const activeTab = useMemo(() => {
    if (visibleConfigs.length === 0) {
      return null;
    }

    if (selectedTab && visibleConfigs.some(config => config.key === selectedTab)) {
      return selectedTab;
    }

    return visibleConfigs[0].key;
  }, [selectedTab, visibleConfigs]);

  const activeConfig = visibleConfigs.find(c => c.key === activeTab);
  const activeFallbackItems = activeConfig ? fallbackByCategory?.[activeConfig.key] : undefined;

  const { data: suggestionsData } = useSWR<{ items?: SuggestionItem[] }>(
    activeConfig ? activeConfig.apiPath : null,
    fetcher,
    {
      fallbackData: activeFallbackItems ? { items: activeFallbackItems } : undefined,
      revalidateOnMount: !activeFallbackItems,
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      keepPreviousData: true,
    },
  );

  const suggestions: SuggestionItem[] = suggestionsData?.items ?? [];

  if (visibleConfigs.length === 0) {
    return null;
  }

  return (
    <section className="px-4 py-10 md:px-6">
      <div className="mx-auto max-w-screen-2xl space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-semibold">Discover more favorites?</h2>
            <p className="text-sm leading-relaxed">
              Curated suggestions inspired by what the community is enjoying right now.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {visibleConfigs.map(config => {
              const isActiveTab = activeTab === config.key;
              return (
                <Button
                  variant="secondary"
                  key={config.key}
                  onClick={() => setSelectedTab(config.key)}
                  className={`h-9 rounded-full px-4 text-sm transition ${
                    isActiveTab ? '' : 'bg-transparent text-muted-foreground'
                  }`}
                >
                  {config.icon}
                  <span>{config.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {suggestions.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {suggestions.map((item, idx) => (
              <SuggestionCard
                key={item.id}
                item={item}
                addPath={activeConfig?.addPath ?? '/backlog'}
                priority={idx < 2}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full">
              {activeConfig?.icon ?? <Sparkles className="h-5 w-5" />}
            </div>
            <p className="text-base font-medium">Nothing queued yet?</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed">
              Try browsing other categories like{' '}
              {activeConfig?.label?.toLowerCase() ?? 'the community backlog'} for fresh picks.
            </p>

            <Link
              href={activeConfig?.addPath ?? '/backlog'}
              className="mt-5 inline-flex items-center gap-1 text-sm font-medium transition hover:text-primary"
            >
              Browse backlog
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

type SuggestionCardProps = {
  item: SuggestionItem;
  addPath: string;
  priority?: boolean;
};

const SuggestionCard = memo(function SuggestionCard({
  item,
  addPath,
  priority = false,
}: SuggestionCardProps) {
  return (
    <Link href={addPath} className="group transition duration-200 hover:border-info/55">
      <div className="relative aspect-[2/3]">
        <CoverThumbImage
          src={item.cover}
          alt={item.title}
          priority={priority}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.01]"
          sizes={IMAGE_SIZES.grid4}
        />

        {item.score && (
          <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-white/30 bg-black/35 px-2 py-1 text-xs text-white">
            <Star className="h-3 w-3 fill-current" />
            {item.score}
          </div>
        )}
      </div>

      <div className="space-y-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold">{item.title}</h3>
        {item.year && <p className="text-xs">{item.year}</p>}
      </div>
    </Link>
  );
});
