'use client';

import { Gamepad2, Sparkles, BookOpen, Film, Tv, Code, PawPrint, Cloud } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

type CategoryMeta = {
  title: string;
  desc: string;
  icon: ReactNode;
  href: string;
};

const categoryMeta: Record<string, CategoryMeta> = {
  games: {
    title: 'Games',
    desc: 'Backlog, progress, reviews',
    icon: <Gamepad2 className="h-4 w-4" />,
    href: '/pages/backlog?category=games',
  },
  anime: {
    title: 'Anime',
    desc: 'Episodes, status, reviews',
    icon: <Sparkles className="h-4 w-4" />,
    href: '/pages/backlog?category=anime',
  },
  manga: {
    title: 'Manga',
    desc: 'Chapters, status, reviews',
    icon: <BookOpen className="h-4 w-4" />,
    href: '/pages/backlog?category=manga',
  },
  books: {
    title: 'Books',
    desc: 'Pages, status, reviews',
    icon: <BookOpen className="h-4 w-4" />,
    href: '/pages/backlog?category=books',
  },
  movies: {
    title: 'Movies',
    desc: 'Watchlist, status, reviews',
    icon: <Film className="h-4 w-4" />,
    href: '/pages/backlog?category=movies',
  },
  tv: {
    title: 'TV Series',
    desc: 'Episodes, status, reviews',
    icon: <Tv className="h-4 w-4" />,
    href: '/pages/backlog?category=tv',
  },
  coding: {
    title: 'Coding',
    desc: 'Tutorials, tips, updates',
    icon: <Code className="h-4 w-4" />,
    href: '/pages/news?category=coding',
  },
  pet: {
    title: 'Pet',
    desc: 'Care tips, experiences',
    icon: <PawPrint className="h-4 w-4" />,
    href: '/pages/news?category=pet',
  },
  vape: {
    title: 'Vape',
    desc: 'Devices, liquids, experiences',
    icon: <Cloud className="h-4 w-4" />,
    href: '/pages/news?category=vape',
  },
};

type ProfileCategoriesProps = {
  categories: string[];
  activeCategory: string | null;
  onCategoryChange: (category: string) => void;
};

export function ProfileCategories({
  categories,
  activeCategory,
  onCategoryChange,
}: Readonly<ProfileCategoriesProps>) {
  if (categories.length === 0) return null;

  return (
    <section className="px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[var(--hb-primary-strong)]">
            Οι κατηγορίες μου
          </p>
          <h2 className="text-2xl font-bold text-[var(--hb-headline)] md:text-3xl">
            Τα hobbies που παρακολουθώ
          </h2>
        </div>

        {/* Category chips grid */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {categories.map(cat => {
            const meta = categoryMeta[cat];
            if (!meta) return null;

            const isActive = activeCategory === cat;

            return (
              <Button
                key={cat}
                variant={isActive ? 'primary' : 'secondary'}
                onClick={() => onCategoryChange(cat)}
                className={`group inline-flex items-center gap-2`}
                aria-pressed={isActive}
              >
                <span
                  className={`transition-colors ${
                    isActive
                      ? 'text-[var(--hb-text)]'
                      : 'text-[var(--hb-muted)] group-hover:text-[var(--hb-primary-strong)]'
                  }`}
                >
                  {meta.icon}
                </span>
                <span>{meta.title}</span>
              </Button>
            );
          })}
        </div>

        {/* Quick links for active category */}
        {activeCategory && categoryMeta[activeCategory] && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={categoryMeta[activeCategory].href}
              className="hover:border-[var(--hb-primary-strong)]/50 inline-flex items-center gap-2 rounded-full border border-[var(--hb-border)] bg-[var(--hb-card)] px-5 py-2 text-sm font-medium text-[var(--hb-headline)] transition"
            >
              Άνοιγμα Library
            </a>
            {['anime', 'manga', 'books', 'movies', 'tv', 'vape'].includes(activeCategory) && (
              <a
                href={`/pages/reviews?category=${activeCategory}`}
                className="hover:border-[var(--hb-primary-strong)]/50 inline-flex items-center gap-2 rounded-full border border-[var(--hb-border)] bg-[var(--hb-card)] px-5 py-2 text-sm font-medium text-[var(--hb-headline)] transition"
              >
                Δες Reviews
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export { categoryMeta };
