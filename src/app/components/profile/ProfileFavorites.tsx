'use client';

import { memo, useState } from 'react';
import Image from 'next/image';
import { GripVertical, Heart } from 'lucide-react';
import EmptyState from '@/components/ui/empty';

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

function ProfileFavoritesComponent({
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
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="flex animate-pulse items-center gap-3 rounded-[18px] border bg-card p-4"
          >
            <div className="h-4 w-4 rounded bg-card" />
            <div className="h-14 w-14 rounded-xl bg-card" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-card" />
              <div className="h-3 w-24 rounded bg-card" />
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
    <div className="space-y-2.5 sm:space-y-3">
      {favorites.map((fav, idx) => (
        <div
          key={fav.id}
          draggable
          onDragStart={() => setDragIndex(idx)}
          onDragOver={e => e.preventDefault()}
          onDrop={() => {
            onReorder(dragIndex, idx);
            setDragIndex(null);
          }}
          className={`group flex min-w-0 cursor-grab items-center gap-3 rounded-[18px] border bg-card p-3 transition-colors active:cursor-grabbing sm:gap-4 sm:p-4 ${
            dragIndex === idx
              ? 'border-info/55 bg-background'
              : 'hover:border-info/35'
          }`}
        >
          {/* Drag handle + Rank */}
          <div className="flex items-center gap-1.5 text-muted-foreground sm:gap-2">
            <GripVertical className="hidden h-4 w-4 opacity-50 transition-opacity group-hover:opacity-100 sm:block" />
            <span className="w-5 text-center text-xs font-semibold sm:w-6 sm:text-sm">
              #{idx + 1}
            </span>
          </div>

          {/* Cover image */}
          <div className="relative h-12 w-12 flex-shrink-0 rounded-xl bg-card sm:h-14 sm:w-14">
            <Image
              src={fav.game?.cover_image || fav.game?.background_image || '/og-image.png'}
              alt={fav.game?.title || 'Item'}
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
            {/* Favorite heart overlay */}
            <div className="bg-background/80 absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full">
              <Heart className="h-3 w-3 fill-primary text-info" />
            </div>
          </div>

          {/* Title + meta */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-info">
              {fav.game?.title || '—'}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {fav.meta || fav.game?.slug || '—'}
            </p>
          </div>
        </div>
      ))}

      {/* Hint text */}
      <p className="mt-4 text-center text-xs text-muted-foreground">
        {category === 'games'
          ? 'Για να προσθέσεις/αφαιρέσεις favorites, χρησιμοποίησε το toggle "Favorite" στα backlog items.'
          : 'Σύρε για αναδιάταξη. Πρόσθεσε favorites από το library.'}
      </p>
    </div>
  );
}

const areFavoritesEqual = (prev: ProfileFavoritesProps, next: ProfileFavoritesProps) =>
  prev.favorites === next.favorites &&
  prev.isLoading === next.isLoading &&
  prev.category === next.category &&
  prev.categoryLabel === next.categoryLabel;

export const ProfileFavorites = memo(ProfileFavoritesComponent, areFavoritesEqual);
