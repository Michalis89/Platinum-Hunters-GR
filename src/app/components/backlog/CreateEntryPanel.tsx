'use client';

import { useMemo } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
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
    <section className="mt-6 rounded-[20px] p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          className="h-9 rounded-[12px] px-3 text-muted-foreground"
        >
          Κλείσιμο
        </Button>
      </div>

      <div className="mt-4">
        <div className="relative">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Search size={16} />
          </div>
          <Input
            type="search"
            value={searchQuery}
            onChange={event => onSearchChange(event.target.value)}
            placeholder={config.searchPlaceholder}
            className="pl-10"
          />
        </div>
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
          <div className="rounded-[16px] px-4 py-5 text-center text-xs text-muted-foreground md:col-span-2">
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
