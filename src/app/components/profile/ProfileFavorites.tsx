'use client';

import { useState } from 'react';
import Image from 'next/image';
import { GripVertical, Heart } from 'lucide-react';
import EmptyState from '@/app/components/ui/EmptyState';

type FavoriteItem = {
  id: string;
  is_favorite: boolean;
  priority: number;
  mediaId?: number;
  meta?: string;
  game: { title: string; slug: string; cover_image: string; background_image?: string };
};

type ProfileFavoritesProps = {
  favorites: FavoriteItem[];
  category: string;
  categoryLabel: string;
  isLoading?: boolean;
  isArticleOnly?: boolean;
  onReorder: (sourceIndex: number | null, targetIndex: number) => void;
};

export function ProfileFavorites({
  favorites,
  category,
  categoryLabel,
  isLoading = false,
  isArticleOnly = false,
  onReorder,
}: Readonly<ProfileFavoritesProps>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex animate-pulse items-center gap-3 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4"
          >
            <div className="h-4 w-4 rounded bg-[var(--hb-panel)]" />
            <div className="h-14 w-14 rounded-xl bg-[var(--hb-panel)]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-[var(--hb-panel)]" />
              <div className="h-3 w-24 rounded bg-[var(--hb-panel)]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <EmptyState
        title={
          isArticleOnly
            ? 'Αυτή η κατηγορία έχει μόνο άρθρα.'
            : `Δεν υπάρχουν ${categoryLabel.toLowerCase()} ακόμα.`
        }
        size="sm"
      />
    );
  }

  return (
    <div className="space-y-3">
      {favorites.map((fav, idx) => (
        <div
          key={fav.id}
          draggable
          onDragStart={() => setDragIndex(idx)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            onReorder(dragIndex, idx);
            setDragIndex(null);
          }}
          className={`group flex cursor-grab items-center gap-4 rounded-2xl border bg-[var(--hb-card)] p-4 transition-all duration-200 active:cursor-grabbing ${
            dragIndex === idx
              ? 'border-[var(--hb-primary-strong)]/70 bg-[var(--hb-primary-strong)]/5 shadow-[0_0_20px_rgba(229,9,20,0.15)]'
              : 'border-[var(--hb-border)] hover:-translate-y-0.5 hover:border-[var(--hb-primary-strong)]/40 hover:shadow-[0_12px_30px_rgba(3,7,18,0.4)]'
          }`}
        >
          {/* Drag handle + Rank */}
          <div className="flex items-center gap-2 text-[var(--hb-muted)]">
            <GripVertical className="h-4 w-4 opacity-50 transition-opacity group-hover:opacity-100" />
            <span className="w-6 text-center text-sm font-semibold">#{idx + 1}</span>
          </div>

          {/* Cover image */}
          <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-[var(--hb-panel)]">
            <Image
              src={fav.game?.cover_image || fav.game?.background_image || '/og-image.png'}
              alt={fav.game?.title || 'Item'}
              width={56}
              height={56}
              className="h-full w-full object-cover"
            />
            {/* Favorite heart overlay */}
            <div className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--hb-bg)]/80">
              <Heart className="h-3 w-3 fill-[var(--hb-primary-strong)] text-[var(--hb-primary-strong)]" />
            </div>
          </div>

          {/* Title + meta */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--hb-headline)] transition-colors group-hover:text-[var(--hb-primary-strong)]">
              {fav.game?.title || '—'}
            </p>
            <p className="truncate text-xs text-[var(--hb-muted)]">
              {fav.meta || fav.game?.slug || '—'}
            </p>
          </div>
        </div>
      ))}

      {/* Hint text */}
      <p className="mt-4 text-center text-xs text-[var(--hb-muted)]">
        {category === 'gaming'
          ? 'Για να προσθέσεις/αφαιρέσεις favorites, χρησιμοποίησε το toggle "Favorite" στα backlog items.'
          : 'Σύρε για αναδιάταξη. Πρόσθεσε favorites από το library.'}
      </p>
    </div>
  );
}
