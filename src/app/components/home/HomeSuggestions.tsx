'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useSWR from 'swr';
import {
  Sparkles,
  BookMarked,
  Film,
  Tv,
  BookText,
  ChevronRight,
  Star,
  Lightbulb,
} from 'lucide-react';
import type { ReactNode } from 'react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

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
  activeCategories: string[];
};

export function HomeSuggestions({ activeCategories }: HomeSuggestionsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  // Filter configs to only show active categories
  const visibleConfigs = categoryConfigs.filter(c => activeCategories.includes(c.key));

  // Set initial tab
  useEffect(() => {
    if (visibleConfigs.length > 0 && !activeTab) {
      setActiveTab(visibleConfigs[0].key);
    }
  }, [visibleConfigs, activeTab]);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const inViewRatio = Math.max(
          0,
          Math.min(1, (windowHeight - rect.top) / (windowHeight + rect.height)),
        );
        setScrollY(inViewRatio);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const activeConfig = visibleConfigs.find(c => c.key === activeTab);

  // Fetch suggestions for active category
  const { data: suggestionsData } = useSWR(activeConfig ? activeConfig.apiPath : null, fetcher, {
    revalidateOnFocus: false,
  });

  const suggestions: SuggestionItem[] = suggestionsData?.items ?? [];

  if (visibleConfigs.length === 0) {
    return null;
  }

  return (
    <section ref={containerRef} className="relative overflow-hidden px-4 py-12 md:px-6">
      {/* Parallax Background - Brand gradient */}
      <div
        className="from-[var(--hb-primary-strong)]/10 to-[var(--hb-accent)]/5 absolute inset-0 bg-gradient-to-br via-transparent transition-all duration-500"
        style={{
          transform: `translateY(${scrollY * -20}px)`,
        }}
      />
      {/* Subtle glow effect */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: `radial-gradient(circle at ${30 + scrollY * 40}% ${40 - scrollY * 10}%, rgba(229, 9, 20, 0.15) 0%, transparent 50%)`,
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[var(--hb-primary-strong)]/20 flex h-10 w-10 items-center justify-center rounded-xl text-[var(--hb-primary-strong)]">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--hb-headline)]">
                Προτάσεις από την κοινότητα
              </h2>
              <p className="text-xs text-[var(--hb-muted)]">Βασισμένες στις βαθμολογίες</p>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {visibleConfigs.map(config => (
              <button
                key={config.key}
                onClick={() => setActiveTab(config.key)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  activeTab === config.key
                    ? 'bg-[var(--hb-primary-strong)] text-white'
                    : 'hover:border-[var(--hb-primary-strong)]/50 border border-[var(--hb-border)] bg-[var(--hb-panel)] text-[var(--hb-muted)] hover:text-[var(--hb-text)]'
                }`}
              >
                {config.icon}
                <span>{config.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Suggestions Grid with Parallax Cards */}
        {suggestions.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {suggestions.map((item, index) => (
              <SuggestionCard
                key={item.id}
                item={item}
                index={index}
                scrollY={scrollY}
                addPath={activeConfig?.addPath ?? '/pages/backlog'}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] py-12 text-center">
            <div className="bg-[var(--hb-primary-strong)]/20 mb-3 flex h-12 w-12 items-center justify-center rounded-full text-[var(--hb-primary-strong)]">
              {activeConfig?.icon ?? <Sparkles className="h-6 w-6" />}
            </div>
            <p className="mb-2 font-medium text-[var(--hb-headline)]">
              Δεν υπάρχουν προτάσεις ακόμα
            </p>
            <p className="mb-4 max-w-xs text-sm text-[var(--hb-muted)]">
              Βαθμολόγησε περισσότερα {activeConfig?.label.toLowerCase()} για να λάβεις
              εξατομικευμένες προτάσεις
            </p>
            <Link
              href={activeConfig?.addPath ?? '/pages/backlog'}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--hb-primary-strong)] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
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
  index: number;
  scrollY: number;
  addPath: string;
};

function SuggestionCard({ item, index, scrollY, addPath }: SuggestionCardProps) {
  // Staggered parallax effect based on card index
  const parallaxOffset = (index % 2 === 0 ? 1 : -1) * scrollY * 10;

  return (
    <Link
      href={addPath}
      className="hover:border-[var(--hb-primary-strong)]/50 hover:shadow-[var(--hb-primary-strong)]/10 group relative overflow-hidden rounded-xl border border-[var(--hb-border)] bg-[var(--hb-panel)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      style={{
        transform: `translateY(${parallaxOffset}px)`,
      }}
    >
      {/* Cover Image */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <Image
          src={item.cover}
          alt={item.title}
          width={200}
          height={300}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWUyOTNiIi8+PC9zdmc+"
        />
        {/* Gradient Overlay */}
        <div className="via-[var(--hb-bg)]/40 absolute inset-0 bg-gradient-to-t from-[var(--hb-bg)] to-transparent" />

        {/* Score Badge */}
        {item.score && (
          <div className="bg-[var(--hb-bg)]/80 absolute right-2 top-2 flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-[var(--hb-accent)] backdrop-blur-sm">
            <Star className="h-3 w-3 fill-current" />
            {item.score}
          </div>
        )}

        {/* Content Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <h3 className="line-clamp-2 text-sm font-semibold text-[var(--hb-headline)]">
            {item.title}
          </h3>
          {item.year && <p className="mt-0.5 text-xs text-[var(--hb-muted)]">{item.year}</p>}
          {item.tags && item.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {item.tags.slice(0, 2).map(tag => (
                <span
                  key={tag}
                  className="bg-[var(--hb-primary-strong)]/20 rounded px-1.5 py-0.5 text-[10px] text-[var(--hb-accent)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
