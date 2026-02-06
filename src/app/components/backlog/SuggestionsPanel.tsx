'use client';

import { useMemo } from 'react';
import EmptyState from '@/app/components/ui/EmptyState';
import MediaSearchResultCard from './MediaSearchResultCard';
import { MediaEntry, SearchResult } from './types';
import { Button } from '@/components/ui/button';

interface SuggestionsPanelProps {
  suggestions: SearchResult[];
  isLoading: boolean;
  onOpenDialog: (entry: SearchResult) => void;
  onClose: () => void;
  libraryEntries: MediaEntry[];
}

export default function SuggestionsPanel({
  suggestions,
  isLoading,
  onOpenDialog,
  onClose,
  libraryEntries,
}: Readonly<SuggestionsPanelProps>) {
  const libraryMediaIds = useMemo(() => {
    return new Set(libraryEntries.map(entry => entry.mediaId).filter(Boolean));
  }, [libraryEntries]);

  const isInLibrary = (entry: SearchResult): boolean => {
    if (entry.mediaId && libraryMediaIds.has(entry.mediaId)) {
      return true;
    }
    return false;
  };

  return (
    <div className="mt-5 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--hb-headline)]">
          Προτάσεις από την κοινότητα
        </p>
        <Button
          type="button"
          variant={'secondary'}
          onClick={onClose}
          className="w-full rounded-full sm:w-auto"
        >
          Κλείσιμο
        </Button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {suggestions.map(entry => (
          <MediaSearchResultCard
            key={entry.id}
            entry={{ ...entry, source: 'local' }}
            onOpenDialog={() => onOpenDialog({ ...entry, source: 'local' })}
            isInLibrary={isInLibrary(entry)}
          />
        ))}
        {isLoading && (
          <div className="rounded-xl border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-4 text-center text-xs text-[var(--hb-muted)] md:col-span-2">
            Φόρτωση προτάσεων...
          </div>
        )}
        {!isLoading && suggestions.length === 0 && (
          <EmptyState title="Δεν υπάρχουν προτάσεις ακόμα." size="sm" className="md:col-span-2" />
        )}
      </div>
    </div>
  );
}
