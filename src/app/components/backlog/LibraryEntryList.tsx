'use client';

import { memo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Spinner } from '@/components/ui/spinner';
import EmptyState from '@/components/ui/empty';
import LibraryEntryRow from './LibraryEntryRow';
import { MediaCategory, MediaEntry, SearchResult, getProgressLabel } from './types';

interface LibraryEntryListProps {
  category: MediaCategory;
  entries: MediaEntry[];
  isLoading: boolean;
  onOpenDialog: (entry: MediaEntry & Partial<SearchResult>) => void;
  onDelete: (entry: MediaEntry) => void;
}

function LibraryEntryList({
  category,
  entries,
  isLoading,
  onOpenDialog,
  onDelete,
}: Readonly<LibraryEntryListProps>) {
  const progressLabel = getProgressLabel(category);
  const parentRef = useRef<HTMLDivElement>(null);

  // Virtualize the list for better performance with 100+ items
  // Estimate row height: ~88px on mobile, ~104px on desktop
  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 96, // Average row height
    overscan: 5, // Render 5 extra items above/below viewport
  });

  return (
    <section
      ref={parentRef}
      className="max-h-none overflow-y-auto p-3 [scrollbar-gutter:stable] sm:p-4 md:max-h-[70vh]"
    >
      {/* Header row (always visible, not virtualized) */}
      <div className="hidden gap-4 px-3 pb-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground md:grid md:grid-cols-[72px,1.5fr,0.7fr,0.7fr,0.5fr,112px]">
        <span>Cover</span>
        <span>Title</span>
        <span className="flex items-center justify-center">Status</span>
        <span className="flex items-center justify-center">{progressLabel} / Total</span>
        <span className="flex items-center justify-center">Score</span>
        <span className="flex items-center justify-center">Actions</span>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="mt-2">
          <div className="rounded-[18px] px-4 py-7">
            <div className="flex flex-col items-center justify-center gap-3">
              <Spinner />
              <span className="text-sm text-muted-foreground">Φόρτωση βιβλιοθήκης...</span>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && entries.length === 0 && (
        <div className="mt-2">
          <EmptyState title="Δεν υπάρχουν καταχωρήσεις ακόμη." />
        </div>
      )}

      {/* Virtualized list */}
      {!isLoading && entries.length > 0 && (
        <div
          className="relative mt-2"
          style={{
            height: `${virtualizer.getTotalSize()}px`,
          }}
        >
          {virtualizer.getVirtualItems().map(virtualItem => {
            const entry = entries[virtualItem.index];
            if (!entry) return null;

            return (
              <div
                key={`${entry.entryId ?? entry.mediaId ?? entry.id}`}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                className="absolute left-0 top-0 w-full"
                style={{
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div className="pb-3">
                  <LibraryEntryRow
                    entry={entry}
                    category={category}
                    onOpenDialog={onOpenDialog}
                    onDelete={onDelete}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default memo(LibraryEntryList);
