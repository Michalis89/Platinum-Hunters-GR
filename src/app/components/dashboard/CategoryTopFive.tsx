'use client';

import { CoverThumbImage } from '@/components/ui/cover-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { DashboardCategoryKey, DashboardTopFiveItem } from '@/lib/dashboard/category-data';

const TOP_FIVE_LIMIT = 5;

type CategoryTopFiveProps = {
  category: DashboardCategoryKey;
  items: DashboardTopFiveItem[];
  favorites?: DashboardTopFiveItem[];
};

function SortableFavoriteCard({ item, rank }: { item: DashboardTopFiveItem; rank: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.entryId,
  });

  const isTopFive = rank <= TOP_FIVE_LIMIT;

  return (
    <article
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? undefined : transition,
      }}
      className={`relative flex h-full w-full cursor-grab select-none flex-col gap-2 rounded-2xl border p-2 shadow-sm transition-all active:cursor-grabbing ${
        isTopFive
          ? 'border-primary/45 bg-card shadow-[0_0_0_1px_rgba(255,255,255,0.04)]'
          : 'border-border bg-card/80'
      } ${isDragging ? 'z-10 opacity-50 shadow-lg' : ''}`}
      aria-label={`Reorder favorite ${item.title}`}
    >
      <div className="relative h-40 w-full overflow-hidden rounded-2xl border border-border bg-muted">
        <CoverThumbImage
          src={item.cover}
          alt={item.title}
          sizes="(max-width: 768px) 90vw, 200px"
          className="object-cover"
          loading="lazy"
        />
      </div>
      <div className="space-y-1.5 text-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {isTopFive ? `Top ${rank}` : `#${rank}`}
        </p>
        <h3 className="font-semibold">{item.title}</h3>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
          {item.rating ? (
            <p className="shrink-0 text-xs font-medium text-foreground">Rating: {item.rating}</p>
          ) : null}
        </div>
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
      </div>
    </article>
  );
}

function mergeFavorites(
  topItems: DashboardTopFiveItem[],
  favorites: DashboardTopFiveItem[],
): DashboardTopFiveItem[] {
  const merged: DashboardTopFiveItem[] = [];
  const seen = new Set<number>();

  for (const item of [...topItems, ...favorites]) {
    if (seen.has(item.entryId)) continue;
    seen.add(item.entryId);
    merged.push(item);
  }

  return merged;
}

function OverlayFavoriteCard({ item, rank }: { item: DashboardTopFiveItem; rank: number }) {
  const isTopFive = rank <= TOP_FIVE_LIMIT;

  return (
    <article
      className={`relative flex w-[320px] flex-col gap-4 rounded-2xl border p-3 pb-12 shadow-2xl ${
        isTopFive
          ? 'border-primary/45 bg-card shadow-[0_0_0_1px_rgba(255,255,255,0.04)]'
          : 'border-border bg-card/90'
      }`}
    >
      <div className="relative h-40 w-full overflow-hidden rounded-2xl border border-border bg-muted">
        <CoverThumbImage
          src={item.cover}
          alt={item.title}
          sizes="260px"
          className="object-cover"
          loading="eager"
        />
      </div>
      <div className="space-y-1.5 text-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {isTopFive ? `Top ${rank}` : `#${rank}`}
        </p>
        <h3 className="font-semibold">{item.title}</h3>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
          {item.rating ? (
            <p className="shrink-0 text-xs font-medium text-foreground">Rating: {item.rating}</p>
          ) : null}
        </div>
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
      </div>
    </article>
  );
}

export default function CategoryTopFive({ category, items, favorites = [] }: CategoryTopFiveProps) {
  const initialOrder = useMemo(() => mergeFavorites(items, favorites), [items, favorites]);
  const [order, setOrder] = useState<DashboardTopFiveItem[]>(initialOrder);
  const [activeId, setActiveId] = useState<number | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 8 },
    }),
  );

  useEffect(() => {
    setOrder(initialOrder);
  }, [initialOrder]);

  const orderedIds = useMemo(() => order.map(item => item.entryId), [order]);
  const activeItem = useMemo(
    () => (activeId === null ? null : (order.find(item => item.entryId === activeId) ?? null)),
    [activeId, order],
  );
  const activeRank = useMemo(
    () => (activeId === null ? 0 : order.findIndex(item => item.entryId === activeId) + 1),
    [activeId, order],
  );

  const handleReorder = useCallback(
    async (newOrder: DashboardTopFiveItem[]) => {
      if (!newOrder.length) return;

      const response = await fetch('/api/dashboard/reorder-favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          order: newOrder.map(item => item.entryId),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder favorites');
      }
    },
    [category],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      if (!over) return;
      if (typeof active.id !== 'number' || typeof over.id !== 'number') return;

      const oldIndex = order.findIndex(item => item.entryId === active.id);
      const newIndex = order.findIndex(item => item.entryId === over.id);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

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
    [handleReorder, order],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    if (typeof event.active.id === 'number') {
      setActiveId(event.active.id);
    }
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  if (!order.length) {
    return (
      <section className="space-y-5">
        <div className="space-y-1 text-center">
          <p className="text-sm font-semibold tracking-tight">Favorites</p>
          <p className="text-xs text-muted-foreground">Pin what defines your taste.</p>
        </div>
        <div className="rounded-2xl border border-dashed border-muted/60 p-6 text-center text-sm text-muted-foreground">
          No favorites yet.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="space-y-1 text-center">
        <p className="text-sm font-semibold tracking-tight">Favorites</p>
        <p className="text-xs text-muted-foreground">
          All favorites in one list. Top 5 are highlighted.
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="rounded-3xl border border-border bg-card/80 p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Drag And Reorder
            </p>
            <span className="text-[10px] text-muted-foreground">5 cards per row</span>
          </div>
          <SortableContext items={orderedIds} strategy={rectSortingStrategy}>
            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {order.map((item, index) => (
                <SortableFavoriteCard key={item.entryId} item={item} rank={index + 1} />
              ))}
            </div>
          </SortableContext>
        </div>
        <DragOverlay>
          {activeItem ? <OverlayFavoriteCard item={activeItem} rank={activeRank} /> : null}
        </DragOverlay>
      </DndContext>
    </section>
  );
}
