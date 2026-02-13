'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardCategoryKey, DashboardTopFiveItem } from '@/lib/dashboard/category-data';

const TOP_FIVE_LIMIT = 5;
const FAVORITES_DROPZONE_ID = 'favorites-dropzone';
const TOP_FIVE_DROPZONE_ID = 'top-five-dropzone';

type CategoryTopFiveProps = {
  category: DashboardCategoryKey;
  items: DashboardTopFiveItem[];
  favorites?: DashboardTopFiveItem[];
};

function SortableTopFiveCard({ item }: { item: DashboardTopFiveItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: item.entryId,
  });

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
      }}
      className={`relative flex h-full w-full flex-col gap-4 rounded-2xl border border-border bg-card p-3 pb-12 shadow-sm transition-all ${
        isDragging ? 'z-10 shadow-lg' : ''
      }`}
    >
      <div className="relative h-40 w-full overflow-hidden rounded-2xl border border-border bg-muted">
        <Image
          src={item.cover}
          alt={item.title}
          fill
          sizes="(max-width: 768px) 90vw, 200px"
          className="object-cover"
          loading="lazy"
        />
      </div>
      <div className="space-y-1.5 text-sm">
        <h3 className="font-semibold">{item.title}</h3>
        <p className="text-xs text-muted-foreground">{item.subtitle}</p>
        {item.rating && (
          <p className="text-xs font-medium text-foreground">Rating: {item.rating}</p>
        )}
        {item.status === 'current' && item.progressPercent !== undefined && (
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span>Progress</span>
              <span>{item.progressPercent}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-border/40">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${item.progressPercent}%` }}
              />
            </div>
          </div>
        )}
        {item.lastActivityAt && (
          <p className="text-xs text-muted-foreground">
            Updated {new Date(item.lastActivityAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
          </p>
        )}
      </div>
      <button
        type="button"
        className="absolute bottom-3 right-3 flex h-6 w-6 cursor-grab items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripHorizontal className="h-3 w-3" />
      </button>
    </article>
  );
}

function FavoriteItemCard({ item }: { item: DashboardTopFiveItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `fav-${item.entryId}`,
  });

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
      }}
      className={`relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-muted to-muted/80 p-3 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
        isDragging ? 'z-10 shadow-2xl' : ''
      }`}
    >
      <div className="relative h-28 w-full overflow-hidden rounded-2xl border border-border/50 bg-muted">
        <Image
          src={item.cover}
          alt={item.title}
          fill
          sizes="(max-width: 768px) 30vw, 120px"
          className="object-cover"
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>
      <div className="mt-3 flex flex-col gap-0.5 text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Favorite
        </p>
        <p className="text-sm font-semibold text-foreground">{item.title}</p>
        <p className="text-[11px] text-muted-foreground">{item.subtitle}</p>
      </div>
      <button
        type="button"
        className="absolute bottom-3 right-3 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        {...attributes}
        {...listeners}
        aria-label="Drag favorite to top five"
      >
        <GripHorizontal className="h-3 w-3" />
      </button>
    </article>
  );
}

export default function CategoryTopFive({ category, items, favorites = [] }: CategoryTopFiveProps) {
  const [order, setOrder] = useState(items);
  const [favoriteItems, setFavoriteItems] = useState(favorites);
  const { setNodeRef: setFavoritesDropRef, isOver: isOverFavorites } = useDroppable({
    id: FAVORITES_DROPZONE_ID,
  });
  const { setNodeRef: setTopFiveDropRef, isOver: isOverTopFive } = useDroppable({
    id: TOP_FIVE_DROPZONE_ID,
  });
  const sensors = useSensors(useSensor(PointerSensor));

  const hasPinned = order.length > 0;

  useEffect(() => {
    setOrder(items);
  }, [items]);

  useEffect(() => {
    setFavoriteItems(favorites);
  }, [favorites]);

  const orderedIds = useMemo(() => order.map(item => item.entryId), [order]);

  const handleReorder = useCallback(
    async (newOrder: DashboardTopFiveItem[]) => {
      if (!newOrder.length) return;

      const response = await fetch('/api/dashboard/reorder-pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          order: newOrder.map(item => item.entryId),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder pins');
      }
    },
    [category],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      const activeId = active.id;
      const overId = over?.id;
      const isFavoriteDrag = typeof activeId === 'string' && activeId.startsWith('fav-');
      const isDroppingOnFavorites = typeof overId === 'string' && overId === FAVORITES_DROPZONE_ID;
      const isDroppingOnTopFive = typeof overId === 'string' && overId === TOP_FIVE_DROPZONE_ID;

      if (!over && !isFavoriteDrag) {
        return;
      }

      if (!isFavoriteDrag && isDroppingOnFavorites) {
        if (typeof activeId !== 'number') {
          return;
        }

        const activeItem = order.find(item => item.entryId === activeId);
        if (!activeItem) {
          return;
        }

        const prevOrder = order;
        const prevFavorites = favoriteItems;
        const nextOrder = order.filter(item => item.entryId !== activeId);
        const nextFavorites = [activeItem, ...favoriteItems];

        setOrder(nextOrder);
        setFavoriteItems(nextFavorites);

        try {
          await handleReorder(nextOrder);
        } catch {
          setOrder(prevOrder);
          setFavoriteItems(prevFavorites);
          toast.error('Unable to save the new order. Please try again.');
        }

        return;
      }

      if (isFavoriteDrag) {
        const entryId = Number(activeId.replace('fav-', ''));
        if (order.some(item => item.entryId === entryId)) {
          return;
        }

        const favoriteItem = favoriteItems.find(item => item.entryId === entryId);
        if (!favoriteItem) {
          return;
        }

        if (
          overId &&
          typeof overId !== 'number' &&
          !(isDroppingOnTopFive || isDroppingOnFavorites)
        ) {
          return;
        }

        const insertIndex =
          typeof overId === 'number'
            ? order.findIndex(item => item.entryId === overId)
            : order.length;
        const normalizedIndex = insertIndex < 0 ? order.length : insertIndex;
        const prevOrder = order;
        const prevFavorites = favoriteItems;
        const nextOrder = [...order];
        nextOrder.splice(normalizedIndex, 0, favoriteItem);
        let overflowItem: DashboardTopFiveItem | undefined;
        if (nextOrder.length > TOP_FIVE_LIMIT) {
          overflowItem = nextOrder.pop();
        }
        let updatedFavorites = favoriteItems.filter(item => item.entryId !== entryId);
        if (overflowItem) {
          updatedFavorites = [overflowItem, ...updatedFavorites];
        }

        setOrder(nextOrder);
        setFavoriteItems(updatedFavorites);

        try {
          await handleReorder(nextOrder);
        } catch {
          setOrder(prevOrder);
          setFavoriteItems(prevFavorites);
          toast.error('Unable to save the new order. Please try again.');
        }

        return;
      }

      if (typeof activeId !== 'number' || typeof overId !== 'number') {
        return;
      }

      const oldIndex = order.findIndex(item => item.entryId === activeId);
      const newIndex = order.findIndex(item => item.entryId === overId);
      if (oldIndex === -1 || newIndex === -1) return;

      const prevOrder = order;
      const nextOrder = arrayMove(order, oldIndex, newIndex);
      setOrder(nextOrder);

      try {
        await handleReorder(nextOrder);
      } catch {
        setOrder(prevOrder);
        toast.error('Unable to save the new order. Please try again.');
      }
    },
    [favoriteItems, handleReorder, order],
  );

  return (
    <section className="space-y-5">
      <div className="space-y-1 text-center">
        <p className="text-sm font-semibold tracking-tight">Top 5 Favorites</p>
        <p className="text-xs text-muted-foreground">
          Drag between rows to keep the best five pinned
        </p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="rounded-3xl border border-border bg-card/80 p-5 shadow-sm">
          <div className="space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  Top Five
                </p>
                <span className="text-[10px] text-muted-foreground">Drag to reorder</span>
              </div>
              <div
                ref={setTopFiveDropRef}
                className={`rounded-2xl border p-2 transition ${
                  isOverTopFive
                    ? 'border-primary/80 bg-primary/10 shadow-lg'
                    : 'border-border bg-card/80'
                }`}
              >
                {hasPinned ? (
                  <SortableContext items={orderedIds} strategy={rectSortingStrategy}>
                    <div className="grid w-full grid-cols-[repeat(5,minmax(0,1fr))] gap-4">
                      {order.map(item => (
                        <SortableTopFiveCard key={item.entryId} item={item} />
                      ))}
                    </div>
                  </SortableContext>
                ) : (
                  <div className="rounded-2xl border border-dashed border-muted/60 p-6 text-center text-sm text-muted-foreground">
                    Pin what defines your taste.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-muted-foreground">
                  More Favorites
                </p>
                <span className="text-[10px] text-muted-foreground">Drag one up to pin it</span>
              </div>
              <div
                ref={setFavoritesDropRef}
                className={`rounded-2xl bg-muted/70 p-3 transition ${
                  isOverFavorites ? 'border-primary/80 bg-primary/10' : 'border-border bg-muted/60'
                }`}
              >
                {favoriteItems.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 text-[10px] md:grid-cols-3">
                    {favoriteItems.map(item => (
                      <FavoriteItemCard key={item.entryId} item={item} />
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground">
                    Drag pins here to move them back into your favorites lineup.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </DndContext>
    </section>
  );
}
