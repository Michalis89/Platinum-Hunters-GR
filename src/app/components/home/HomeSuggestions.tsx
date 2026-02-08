'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
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
    label: 'Παιχνίδια',
    icon: <Gamepad2 className="h-4 w-4" />,
    apiPath: '/api/games/suggestions?category=games',
    addPath: '/pages/backlog?category=games',
  },
  {
    key: 'anime',
    label: 'Anime',
    icon: <Sparkles className="h-4 w-4" />,
    apiPath: '/api/anime/suggestions?category=anime',
    addPath: '/pages/backlog?category=anime',
  },
  {
    key: 'manga',
    label: 'Manga',
    icon: <BookMarked className="h-4 w-4" />,
    apiPath: '/api/anime/suggestions?category=manga',
    addPath: '/pages/backlog?category=manga',
  },
  {
    key: 'movies',
    label: 'Ταινίες',
    icon: <Film className="h-4 w-4" />,
    apiPath: '/api/movies/suggestions?category=movies',
    addPath: '/pages/backlog?category=movies',
  },
  {
    key: 'tv',
    label: 'Σειρές',
    icon: <Tv className="h-4 w-4" />,
    apiPath: '/api/movies/suggestions?category=tv',
    addPath: '/pages/backlog?category=tv',
  },
  {
    key: 'books',
    label: 'Βιβλία',
    icon: <BookText className="h-4 w-4" />,
    apiPath: '/api/books/suggestions',
    addPath: '/pages/backlog?category=books',
  },
];

type HomeSuggestionsProps = {
  enabledCategories: string[];
};

export function HomeSuggestions({ enabledCategories }: HomeSuggestionsProps) {
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const visibleConfigs = useMemo(
    () => categoryConfigs.filter(c => enabledCategories.includes(c.key)),
    [enabledCategories],
  );

  useEffect(() => {
    if (visibleConfigs.length > 0 && !activeTab) {
      setActiveTab(visibleConfigs[0].key);
    }
  }, [visibleConfigs, activeTab]);

  const activeConfig = visibleConfigs.find(c => c.key === activeTab);

  const { data: suggestionsData } = useSWR<{ items?: SuggestionItem[] }>(
    activeConfig ? activeConfig.apiPath : null,
    fetcher,
    {
      revalidateOnFocus: false,
    },
  );

  const suggestions: SuggestionItem[] = suggestionsData?.items ?? [];

  if (visibleConfigs.length === 0) {
    return null;
  }

  return (
    <section className="px-4 py-10 md:px-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1.5">
            <h2 className="apple-label apple-title-tracking text-2xl font-semibold">Προτάσεις κοινότητας</h2>
            <p className="apple-secondary-label apple-body-tracking text-sm leading-relaxed">
              Επιλεγμένες προτάσεις με βάση τις βαθμολογίες της κοινότητας.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {visibleConfigs.map(config => {
              const isActiveTab = activeTab === config.key;
              return (
                <Button
                  variant="secondary"
                  key={config.key}
                  onClick={() => setActiveTab(config.key)}
                  className={`h-9 rounded-full px-4 text-sm transition ${
                    isActiveTab
                      ? 'apple-pill apple-label'
                      : 'border-[var(--apple-separator)] bg-transparent text-[var(--apple-secondary-label)]'
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
            {suggestions.map(item => (
              <SuggestionCard
                key={item.id}
                item={item}
                addPath={activeConfig?.addPath ?? '/pages/backlog'}
              />
            ))}
          </div>
        ) : (
          <div className="apple-card p-8 text-center">
            <div className="apple-pill apple-secondary-label mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full">
              {activeConfig?.icon ?? <Sparkles className="h-5 w-5" />}
            </div>
            <p className="apple-label text-base font-medium">Δεν υπάρχουν προτάσεις ακόμα</p>
            <p className="apple-secondary-label mx-auto mt-2 max-w-md text-sm leading-relaxed">
              Όταν προστεθούν περισσότερες βαθμολογίες στην κατηγορία {activeConfig?.label.toLowerCase()},
              θα εμφανιστούν εδώ.
            </p>

            <Link
              href={activeConfig?.addPath ?? '/pages/backlog'}
              className="apple-label mt-5 inline-flex items-center gap-1 text-sm font-medium transition hover:text-[var(--apple-system-blue)]"
            >
              Εξερεύνηση
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
};

function SuggestionCard({ item, addPath }: SuggestionCardProps) {
  return (
    <Link
      href={addPath}
      className="apple-card group overflow-hidden transition duration-200 hover:border-[var(--apple-system-blue)]/55"
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        <Image
          src={item.cover}
          alt={item.title}
          width={200}
          height={300}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.01]"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWUyOTNiIi8+PC9zdmc+"
        />

        {item.score && (
          <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-white/30 bg-black/35 px-2 py-1 text-xs text-white backdrop-blur-sm">
            <Star className="h-3 w-3 fill-current" />
            {item.score}
          </div>
        )}
      </div>

      <div className="space-y-1 p-3">
        <h3 className="apple-label line-clamp-2 text-sm font-semibold">{item.title}</h3>
        {item.year && <p className="apple-secondary-label text-xs">{item.year}</p>}
      </div>
    </Link>
  );
}
