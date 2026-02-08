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
    <section className="px-4 py-12 md:px-6 md:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center md:mb-10">
          <p className="apple-secondary-label mb-2 text-[11px] font-semibold uppercase tracking-[0.22em]">
            Οι κατηγορίες μου
          </p>
          <h2 className="apple-title-tracking text-2xl font-semibold md:text-3xl">
            Τα hobbies που παρακολουθώ
          </h2>
        </div>

        {/* Category chips grid */}
        <div className="apple-material-surface flex flex-wrap items-center justify-center gap-3 p-4 sm:p-5">
          {categories.map(cat => {
            const meta = categoryMeta[cat];
            if (!meta) return null;

            const isActive = activeCategory === cat;

            return (
              <Button
                key={cat}
                variant={isActive ? 'primary' : 'secondary'}
                onClick={() => onCategoryChange(cat)}
                className={`group inline-flex items-center gap-2 ${
                  isActive
                    ? ''
                    : 'bg-[var(--apple-tertiary-fill)] text-[var(--apple-secondary-label)] hover:text-[var(--apple-label)]'
                }`}
                aria-pressed={isActive}
              >
                <span
                  className={`transition-colors ${
                    isActive
                      ? 'text-[var(--apple-label)]'
                      : 'text-[var(--apple-secondary-label)] group-hover:text-[var(--apple-system-blue)]'
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
          <div className="mt-8 apple-material-surface flex flex-wrap items-center justify-center gap-3 p-4 sm:p-5">
            <a
              href={categoryMeta[activeCategory].href}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--apple-separator)] bg-[var(--apple-tertiary-fill)] px-5 py-2 text-sm font-medium text-[var(--apple-label)] transition-colors hover:border-[var(--apple-system-blue)]/40 hover:text-[var(--apple-system-blue)]"
            >
              Άνοιγμα Library
            </a>
            {['anime', 'manga', 'books', 'movies', 'tv', 'vape'].includes(activeCategory) && (
              <a
                href={`/pages/reviews?category=${activeCategory}`}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--apple-separator)] bg-[var(--apple-tertiary-fill)] px-5 py-2 text-sm font-medium text-[var(--apple-label)] transition-colors hover:border-[var(--apple-system-blue)]/40 hover:text-[var(--apple-system-blue)]"
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

