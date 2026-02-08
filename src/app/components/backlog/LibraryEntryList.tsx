'use client';

import LoadingSpinner from '@/app/components/ui/LoadingSpinner';
import EmptyState from '@/app/components/ui/EmptyState';
import LibraryEntryRow from './LibraryEntryRow';
import { MediaCategory, MediaEntry, SearchResult, getProgressLabel } from './types';

interface LibraryEntryListProps {
  category: MediaCategory;
  entries: MediaEntry[];
  isLoading: boolean;
  onOpenDialog: (entry: MediaEntry & Partial<SearchResult>) => void;
  onDelete: (entry: MediaEntry) => void;
}

export default function LibraryEntryList({
  category,
  entries,
  isLoading,
  onOpenDialog,
  onDelete,
}: Readonly<LibraryEntryListProps>) {
  const progressLabel = getProgressLabel(category);

  return (
    <section className="apple-material-surface max-h-none overflow-y-auto p-3 [scrollbar-gutter:stable] sm:p-4 md:max-h-[70vh]">
      <div className="hidden gap-4 px-3 pb-2 text-[11px] uppercase tracking-[0.2em] text-[var(--apple-secondary-label)] md:grid md:grid-cols-[72px,1.5fr,0.7fr,0.7fr,0.5fr,112px]">
        <span>Cover</span>
        <span>Title</span>
        <span className="flex items-center justify-center">Status</span>
        <span className="flex items-center justify-center">{progressLabel} / Total</span>
        <span className="flex items-center justify-center">Score</span>
        <span className="flex items-center justify-center">Actions</span>
      </div>

      <div className="mt-2 space-y-3">
        {isLoading && (
          <div className="apple-card rounded-[18px] border-[var(--apple-separator)] px-4 py-7">
            <LoadingSpinner label="Φόρτωση βιβλιοθήκης..." />
          </div>
        )}
        {!isLoading &&
          entries.map(entry => (
            <LibraryEntryRow
              key={`${entry.entryId ?? entry.mediaId ?? entry.id}`}
              entry={entry}
              category={category}
              onOpenDialog={onOpenDialog}
              onDelete={onDelete}
            />
          ))}
        {!isLoading && entries.length === 0 && (
          <EmptyState title="Δεν υπάρχουν καταχωρήσεις ακόμη." />
        )}
      </div>
    </section>
  );
}
