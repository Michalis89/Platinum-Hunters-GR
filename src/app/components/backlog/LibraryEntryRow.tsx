'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/app/components/ui/ConfirmDialog';
import { MediaCategory, MediaEntry, SearchResult, CATEGORY_CONFIG, getTotalCount } from './types';

interface LibraryEntryRowProps {
  entry: MediaEntry;
  category: MediaCategory;
  onOpenDialog: (entry: MediaEntry & Partial<SearchResult>) => void;
  onDelete: (entry: MediaEntry) => void;
}

export default function LibraryEntryRow({
  entry,
  category,
  onOpenDialog,
  onDelete,
}: Readonly<LibraryEntryRowProps>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const config = CATEGORY_CONFIG[category];
  const total = getTotalCount(entry, category);

  const statusLabel =
    entry.status === 'current'
      ? config.currentLabel
      : entry.status === 'planned'
        ? config.plannedLabel
        : entry.status === 'dropped'
          ? config.droppedLabel
          : config.completedLabel;

  const progressValue = entry.progress ?? null;
  const progressDisplay =
    category !== 'games'
      ? progressValue !== null
        ? `${progressValue}${total ? ` / ${total}` : ''}`
        : '-'
      : progressValue !== null
        ? `${progressValue}${total ? ` ` : ''}`
        : '-';

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    onDelete(entry);
  };

  return (
    <>
      <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-3">
        <div className="space-y-3 md:hidden">
          <div className="flex items-start gap-3">
            <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-xl bg-[var(--hb-panel)]">
              <Image
                src={entry.cover}
                alt={entry.title}
                width={56}
                height={80}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="line-clamp-2 text-left text-base font-semibold leading-tight text-[var(--hb-headline)]">
                {entry.title}
              </p>
              <p className="text-sm text-[var(--hb-muted)]">
                {entry.subtitle}
                {entry.year ? ` - ${entry.year}` : ''}
              </p>
              {category === 'games' && entry.selectedPlatform ? (
                <p className="text-xs font-medium text-[var(--hb-muted)]">
                  Platform: {entry.selectedPlatform}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {entry.tags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="rounded-full border border-[var(--hb-border)] px-2 py-0.5 text-[11px] text-[var(--hb-muted)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-[var(--hb-border)] bg-[var(--hb-panel)] px-2 py-1.5 text-center">
              <p className="text-[10px] uppercase tracking-wide text-[var(--hb-muted)]">Status</p>
              <p className="text-xs font-semibold text-[var(--hb-primary-strong)]">{statusLabel}</p>
            </div>
            <div className="rounded-lg border border-[var(--hb-border)] bg-[var(--hb-panel)] px-2 py-1.5 text-center">
              <p className="text-[10px] uppercase tracking-wide text-[var(--hb-muted)]">Progress</p>
              <p className="text-xs font-semibold text-[var(--hb-text)]">{progressDisplay}</p>
            </div>
            <div className="rounded-lg border border-[var(--hb-border)] bg-[var(--hb-panel)] px-2 py-1.5 text-center">
              <p className="text-[10px] uppercase tracking-wide text-[var(--hb-muted)]">Score</p>
              <p className="text-xs font-semibold text-[var(--hb-headline)]">
                {entry.score ?? '-'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              size="icon"
              variant={'secondary'}
              onClick={() => onOpenDialog(entry)}
              title="Edit"
              aria-label="Edit"
              className="h-9 w-9 rounded-xl"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant={'destructive'}
              onClick={handleDeleteClick}
              title="Delete"
              aria-label="Delete"
              className="h-9 w-9 rounded-xl"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="hidden items-center gap-4 md:grid md:grid-cols-[72px,1.5fr,0.7fr,0.7fr,0.5fr,112px]">
          <div className="relative h-20 w-14 overflow-hidden rounded-xl bg-[var(--hb-panel)]">
            <Image
              src={entry.cover}
              alt={entry.title}
              width={56}
              height={80}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="space-y-1">
            <p className="text-left text-base font-semibold text-[var(--hb-headline)]">
              {entry.title}
            </p>
            <p className="text-sm text-[var(--hb-muted)]">
              {entry.subtitle}
              {entry.year ? ` - ${entry.year}` : ''}
            </p>
            {category === 'games' && entry.selectedPlatform ? (
              <p className="text-xs font-medium text-[var(--hb-muted)]">
                Platform: {entry.selectedPlatform}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {entry.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="rounded-full border border-[var(--hb-border)] px-2 py-0.5 text-[11px] text-[var(--hb-muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex w-full items-center justify-center">
            <span className="border-[var(--hb-primary-strong)]/40 bg-[var(--hb-primary-strong)]/10 rounded-full border px-3 py-1 text-xs font-semibold text-[var(--hb-primary-strong)]">
              {statusLabel}
            </span>
          </div>
          <div className="flex w-full items-center justify-center text-sm text-[var(--hb-muted)]">
            {progressDisplay}
          </div>
          <div className="flex w-full items-center justify-center text-sm font-semibold text-[var(--hb-headline)]">
            {entry.score ?? '-'}
          </div>
          <div className="flex w-full items-center justify-center gap-2">
            <Button
              type="button"
              variant={'secondary'}
              onClick={() => onOpenDialog(entry)}
              title="Edit"
              aria-label="Edit"
            >
              <Pencil className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant={'destructive'}
              onClick={handleDeleteClick}
              title="Delete"
              aria-label="Delete"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete entry"
        message={`Are you sure you want to remove "${entry.title}" from your library?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
