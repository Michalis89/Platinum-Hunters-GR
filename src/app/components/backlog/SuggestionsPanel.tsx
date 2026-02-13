'use client';

import { useMemo } from 'react';
import EmptyState from '@/components/ui/empty';
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
    <section className="mt-6 rounded-[20px] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">Προτάσεις από την κοινότητα</p>
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          className="h-9 rounded-[12px] px-3 text-muted-foreground"
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
          <div className="rounded-[16px] px-4 py-5 text-center text-xs text-muted-foreground md:col-span-2">
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
