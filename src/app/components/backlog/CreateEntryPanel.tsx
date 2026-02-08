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

  return (
    <section className="apple-card mt-6 rounded-[20px] border-[var(--apple-separator)] p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          className="h-9 rounded-[12px] px-3 text-[var(--apple-secondary-label)]"
        >
          Κλείσιμο
        </Button>
      </div>

      <div className="mt-4">
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
          <div className="apple-card rounded-[16px] border-[var(--apple-separator)] px-4 py-5 text-center text-xs text-[var(--apple-secondary-label)] md:col-span-2">
            Αναζήτηση στη βάση μας...
          </div>
        )}
        {!isLoading && searchResults.length === 0 && (
          <EmptyState title="Δεν βρέθηκαν αποτελέσματα." size="sm" className="md:col-span-2" />
        )}
      </div>
    </section>
  );
}
