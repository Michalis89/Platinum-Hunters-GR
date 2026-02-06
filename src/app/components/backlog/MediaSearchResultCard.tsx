'use client';

import Image from 'next/image';
import { Library } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchResult } from './types';

interface MediaSearchResultCardProps {
  entry: SearchResult;
  onOpenDialog: (entry: SearchResult) => void;
  variant?: 'compact' | 'default';
  isInLibrary?: boolean;
}

export default function MediaSearchResultCard({
  entry,
  onOpenDialog,
  variant = 'default',
  isInLibrary = false,
}: Readonly<MediaSearchResultCardProps>) {
  const handleOpenDialog = () => {
    if (isInLibrary) return;
    onOpenDialog(entry);
  };

  return (
    <div
      className={`flex w-full min-w-0 ${variant === 'compact' ? 'items-start' : 'items-center'} gap-3 rounded-xl border border-[var(--hb-border)] bg-[var(--hb-panel)] ${variant === 'compact' ? 'p-2' : 'p-3'}`}
    >
      <div className="relative h-16 w-12 overflow-hidden rounded-lg bg-[var(--hb-card)]">
        <Image
          src={entry.cover}
          alt={entry.title}
          width={48}
          height={64}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--hb-headline)]">{entry.title}</p>
        <p className="truncate text-xs text-[var(--hb-muted)]">
          {entry.subtitle} {entry.year ? `• ${entry.year}` : ''}
        </p>
      </div>

      {isInLibrary ? (
        <div className="flex items-center gap-1.5 rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-400">
          <Library className="h-3.5 w-3.5" />
          <span>Στη βιβλιοθήκη</span>
        </div>
      ) : (
        <Button variant="outline" onClick={handleOpenDialog}>
          Προσθήκη
        </Button>
      )}
    </div>
  );
}
