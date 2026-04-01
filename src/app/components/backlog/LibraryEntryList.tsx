'use client';

import { memo, useRef, useMemo, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Plus, Sparkles, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import EmptyState from '@/components/ui/empty';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import LibraryEntryRow from './LibraryEntryRow';
import type { MediaCategory, MediaEntry, MediaStatus, SearchResult } from './types';

interface LibraryEntryListProps {
  category: MediaCategory;
  entries: MediaEntry[];
  isLoading: boolean;
  activeStatus: MediaStatus | 'all';
  onOpenDialog: (entry: MediaEntry & Partial<SearchResult>) => void;
  onDelete: (entry: MediaEntry) => void;
  onToggleFavorite?: (entry: MediaEntry) => void;
  onCreateClick: () => void;
  isReadOnly?: boolean;
  canToggleFavorite?: boolean;
}

type SortDir = 'asc' | 'desc';
const toNumericScore = (score?: string) => {
  if (!score) {
    return 0;
  }
  const value = Number.parseFloat(score);
  return Number.isFinite(value) ? value : 0;
};

function LibraryEntryList({
  category,
  entries,
  isLoading,
  activeStatus,
  onOpenDialog,
  onDelete,
  onToggleFavorite,
  onCreateClick,
  isReadOnly = false,
  canToggleFavorite = false,
}: Readonly<LibraryEntryListProps>) {
  const [sortByScore, setSortByScore] = useState(activeStatus === 'completed');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    if (activeStatus === 'completed') {
      setSortByScore(true);
      setSortDir('desc');
    } else {
      setSortByScore(false);
    }
  }, [activeStatus]);

  const parentRef = useRef<HTMLDivElement>(null);

  const sortedEntries = useMemo(() => {
    if (!sortByScore) return entries;
    return [...entries].sort((a, b) => {
      const aScore = toNumericScore(a.score);
      const bScore = toNumericScore(b.score);
      return sortDir === 'desc' ? bScore - aScore : aScore - bScore;
    });
  }, [entries, sortByScore, sortDir]);

  const handleScoreSort = () => {
    if (sortByScore) {
      setSortDir(d => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortByScore(true);
      setSortDir('desc');
    }
  };

  const ScoreIcon = sortByScore ? (sortDir === 'desc' ? ChevronDown : ChevronUp) : ChevronsUpDown;

  const virtualizer = useVirtualizer({
    count: sortedEntries.length,
    getScrollElement: () => parentRef.current,
    getItemKey: index =>
      String(sortedEntries[index]?.entryId ?? sortedEntries[index]?.mediaId ?? index),
    estimateSize: () => 148,
    overscan: 8,
  });

  return (
    <div>
      {!isLoading && sortedEntries.length > 0 && (
        <div className="mb-3 hidden rounded-xl border border-border/50 bg-muted/30 px-3 py-2.5 sm:px-4 md:grid md:grid-cols-[92px,1.4fr,0.55fr,0.5fr,112px] md:items-center md:gap-4">
          <div />
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Title
          </span>
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Status
          </span>
          <button
            onClick={handleScoreSort}
            className={cn(
              'flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors',
              sortByScore
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Score
            <ScoreIcon className="h-3 w-3" />
          </button>
          <div />
        </div>
      )}

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

        {!isLoading && sortedEntries.length === 0 && (
          <EmptyState
            icon={<Sparkles className="h-5 w-5" />}
            title={isReadOnly ? 'Nothing here yet' : 'Your library is empty'}
            description={
              isReadOnly
                ? 'This library has no entries for this category yet.'
                : 'Add your first title to track progress, score, and notes in one focused command center.'
            }
            action={
              !isReadOnly ? (
                <Button variant="primary" className="rounded-xl" onClick={onCreateClick}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Entry
                </Button>
              ) : undefined
            }
          />
        )}

        {!isLoading && sortedEntries.length > 0 && (
          <div className="relative" style={{ height: `${virtualizer.getTotalSize()}px` }}>
            {virtualizer.getVirtualItems().map(virtualItem => {
              const entry = sortedEntries[virtualItem.index];
              if (!entry) {
                return null;
              }

              return (
                <div
                  key={`${entry.entryId ?? entry.mediaId ?? entry.id}`}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  className="virtual-row absolute left-0 top-0 w-full"
                  style={{ transform: `translate3d(0, ${virtualItem.start}px, 0)` }}
                >
                  <div className="pb-3">
                    <LibraryEntryRow
                      entry={entry}
                      index={virtualItem.index}
                      category={category}
                      onOpenDialog={onOpenDialog}
                      onDelete={onDelete}
                      isReadOnly={isReadOnly}
                      canToggleFavorite={canToggleFavorite}
                      onToggleFavorite={onToggleFavorite}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default memo(LibraryEntryList);
