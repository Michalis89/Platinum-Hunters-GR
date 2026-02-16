'use client';

import { memo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Plus, Sparkles } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import EmptyState from '@/components/ui/empty';
import { Button } from '@/components/ui/button';
import LibraryEntryRow from './LibraryEntryRow';
import { MediaCategory, MediaEntry, SearchResult } from './types';

interface LibraryEntryListProps {
  category: MediaCategory;
  entries: MediaEntry[];
  isLoading: boolean;
  onOpenDialog: (entry: MediaEntry & Partial<SearchResult>) => void;
  onDelete: (entry: MediaEntry) => void;
  onCreateClick: () => void;
}

function LibraryEntryList({
  category,
  entries,
  isLoading,
  onOpenDialog,
  onDelete,
  onCreateClick,
}: Readonly<LibraryEntryListProps>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 148,
    overscan: 5,
  });

  return (
    <section
      ref={parentRef}
      className="max-h-none overflow-y-auto [scrollbar-gutter:stable] md:max-h-[70vh]"
    >
      {isLoading && (
        <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-10">
          <div className="flex flex-col items-center justify-center gap-3">
            <Spinner />
            <span className="text-sm text-muted-foreground">Loading library...</span>
          </div>
        </div>
      )}

      {!isLoading && entries.length === 0 && (
        <EmptyState
          icon={<Sparkles className="h-5 w-5" />}
          title="Your library is empty"
          description="Add your first title to track progress, score, and notes in one focused command center."
          action={
            <Button variant="primary" className="rounded-xl" onClick={onCreateClick}>
              <Plus className="mr-2 h-4 w-4" />
              Add Entry
            </Button>
          }
        />
      )}

      {!isLoading && entries.length > 0 && (
        <div className="relative" style={{ height: `${virtualizer.getTotalSize()}px` }}>
          {virtualizer.getVirtualItems().map(virtualItem => {
            const entry = entries[virtualItem.index];
            if (!entry) return null;

            return (
              <div
                key={`${entry.entryId ?? entry.mediaId ?? entry.id}`}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                className="absolute left-0 top-0 w-full"
                style={{ transform: `translateY(${virtualItem.start}px)` }}
              >
                <div className="pb-3">
                  <LibraryEntryRow
                    entry={entry}
                    index={virtualItem.index}
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
