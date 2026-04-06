'use client';

import { memo } from 'react';
import { BookHeart } from 'lucide-react';
import type { DiaryEntryDecrypted } from '@/lib/diary/types';
import { DiaryEntryCard } from '@/app/components/diary/DiaryEntryCard';

type DiaryEntryListProps = {
  entries: DiaryEntryDecrypted[];
  activeEntryId: string | null;
  onSelect: (entryId: string) => void;
};

function DiaryEntryListComponent({ entries, activeEntryId, onSelect }: DiaryEntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-card/50 p-10 text-center duration-200 animate-in">
        <BookHeart className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
        <p className="text-2xl font-medium leading-8 text-foreground">
          Your quiet space is waiting.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Write one line for today. Let the rest arrive gently.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map(entry => (
        <DiaryEntryCard
          key={entry.id}
          entry={entry}
          isActive={activeEntryId === entry.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export const DiaryEntryList = memo(DiaryEntryListComponent);
