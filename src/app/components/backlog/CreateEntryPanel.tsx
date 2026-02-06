'use client';

import { useMemo } from 'react';
import { SearchBar } from '@/app/components/ui/SearchBar';
import { Button } from '@/components/ui/button';
import EmptyState from '@/app/components/ui/EmptyState';
import MediaSearchResultCard from './MediaSearchResultCard';
import { MediaCategory, MediaEntry, SearchResult, CATEGORY_CONFIG } from './types';

interface CreateEntryPanelProps {
  category: MediaCategory;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchResults: SearchResult[];
  isLoading: boolean;
  onOpenDialog: (entry: SearchResult) => void;
  onClose: () => void;
  libraryEntries: MediaEntry[];
}

export default function CreateEntryPanel({
  category,
  searchQuery,
  onSearchChange,
  searchResults,
  isLoading,
  onOpenDialog,
  onClose,
  libraryEntries,
}: Readonly<CreateEntryPanelProps>) {
  const config = CATEGORY_CONFIG[category];

  const libraryMediaIds = useMemo(() => {
    return new Set(libraryEntries.map(entry => entry.mediaId).filter(Boolean));
  }, [libraryEntries]);

  const isInLibrary = (entry: SearchResult): boolean => {
    if (entry.mediaId && libraryMediaIds.has(entry.mediaId)) {
      return true;
    }
    return false;
  };

  const getApiSourceName = () => {
    if (category === 'anime' || category === 'manga') return 'MAL';
    if (category === 'movies' || category === 'tv') return 'TMDB';
    return 'Google Books';
  };

  return (
    <div className="mt-5 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4">
      <p className="text-sm font-semibold text-[var(--hb-headline)]">
        Αναζήτηση στη βάση μας, αν δεν υπάρχει κάνουμε αναζήτηση σε εξωτερικό API:{' '}
        {getApiSourceName()}
      </p>
      <div className="mt-4 flex flex-col gap-3">
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={config.searchPlaceholder}
        />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {searchResults.map(entry => (
          <MediaSearchResultCard
            key={`create-${entry.id}`}
            entry={entry}
            onOpenDialog={onOpenDialog}
            variant="compact"
            isInLibrary={isInLibrary(entry)}
          />
        ))}
        {isLoading && (
          <div className="rounded-xl border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-4 text-center text-xs text-[var(--hb-muted)] md:col-span-2">
            Αναζήτηση στη βάση μας...
          </div>
        )}
        {!isLoading && searchResults.length === 0 && (
          <EmptyState title="Δεν βρέθηκαν αποτελέσματα." size="sm" className="md:col-span-2" />
        )}
      </div>
      <div className="mt-4">
        <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto">
          Κλείσιμο
        </Button>
      </div>
    </div>
  );
}
