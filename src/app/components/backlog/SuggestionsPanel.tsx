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
    <section className="apple-card mt-6 rounded-[20px] border-[var(--apple-separator)] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="apple-body-tracking text-sm font-medium text-[var(--apple-label)]">
          Προτάσεις από την κοινότητα
        </p>
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          className="h-9 rounded-[12px] px-3 text-[var(--apple-secondary-label)]"
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
          <div className="apple-card md:col-span-2 rounded-[16px] border-[var(--apple-separator)] px-4 py-5 text-center text-xs text-[var(--apple-secondary-label)]">
            Φόρτωση προτάσεων...
          </div>
        )}
        {!isLoading && suggestions.length === 0 && (
          <EmptyState title="Δεν υπάρχουν προτάσεις ακόμα." size="sm" className="md:col-span-2" />
        )}
      </div>
    </section>
  );
}
