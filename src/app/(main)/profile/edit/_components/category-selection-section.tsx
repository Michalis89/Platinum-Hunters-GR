'use client';

import { Button } from '@/components/ui/button';
import { CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CATEGORIES } from '@/data/hobbyConstants';
import { PRIMARY_HOBBY_CATEGORIES, SOCIAL_LAYER_HOBBY_CATEGORIES } from '../_constants';

const CATEGORY_LABELS: Record<string, string> = {
  games: 'Games',
  anime: 'Anime',
  manga: 'Manga',
  books: 'Books',
  movies: 'Movies',
  tv: 'TV Series',
  coding: 'Coding',
  pet: 'Pet',
  vape: 'Vape',
};

interface CategorySelectionSectionProps {
  selectedCategories: string[];
  socialLayerEnabled: boolean;
  onToggleCategory: (cat: string) => void;
}

export function CategorySelectionSection({
  selectedCategories,
  socialLayerEnabled,
  onToggleCategory,
}: CategorySelectionSectionProps) {
  const renderChip = (cat: string, disabled = false) => {
    const active = selectedCategories.includes(cat);
    return (
      <Button
        type="button"
        key={cat}
        disabled={disabled}
        onClick={() => onToggleCategory(cat)}
        className={`rounded-full border px-3 py-1.5 text-sm transition ${
          active
            ? `bg-primary/14 dark:bg-primary/22 border-primary/35 text-primary dark:border-primary/55 dark:text-[#8ec5ff]`
            : `hover:bg-primary/8 border-border bg-card text-muted-foreground hover:border-primary/35`
        } ${disabled ? 'cursor-not-allowed opacity-55 hover:border-border hover:bg-card' : ''}`}
      >
        {String(CATEGORY_LABELS[cat] || cat)}
      </Button>
    );
  };

  return (
    <div
      id="categories"
      className="scroll-mt-24 rounded-xl border bg-card text-card-foreground shadow"
    >
      <div className="border-b border-border bg-card/50 p-6">
        <p className="mb-1 text-xs uppercase tracking-[0.25em] text-primary">My Hobbies</p>
        <CardTitle className="text-lg text-foreground">Hobby Categories</CardTitle>
      </div>
      <div className="space-y-3 p-6 pt-0">
        <p className="text-sm text-muted-foreground">
          Select the categories that interest you. Only relevant blocks will appear on your pages.
        </p>
        {socialLayerEnabled ? (
          <div className="flex flex-wrap gap-2">{CATEGORIES.map(cat => renderChip(cat))}</div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {PRIMARY_HOBBY_CATEGORIES.map(cat => renderChip(cat))}
            </div>
            <div className="flex flex-wrap gap-2">
              {SOCIAL_LAYER_HOBBY_CATEGORIES.map(cat => (
                <Popover key={`locked-${cat}`}>
                  <PopoverTrigger asChild>
                    <span className="inline-flex">{renderChip(cat, true)}</span>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 text-sm" side="top" align="start">
                    Enable the Social Layer in `/settings` to unlock this category.
                  </PopoverContent>
                </Popover>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
