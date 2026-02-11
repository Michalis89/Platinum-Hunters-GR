'use client';

import { memo, useState } from 'react';
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

function LibraryEntryRow({
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
        ? `${progressValue}${total ? ' ' : ''}`
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
      <div className="apple-card rounded-[20px] border-[var(--apple-separator)] p-3 sm:p-4">
        <div className="space-y-3 md:hidden">
          <div className="flex items-start gap-3">
            <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-xl bg-[var(--apple-tertiary-fill)]">
              <Image
                src={entry.cover}
                alt={entry.title}
                width={56}
                height={80}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="apple-title-tracking line-clamp-2 text-left text-base font-semibold leading-tight text-[var(--apple-label)]">
                {entry.title}
              </p>
              <p className="apple-body-tracking text-sm text-[var(--apple-secondary-label)]">
                {entry.subtitle}
                {entry.year ? ` · ${entry.year}` : ''}
              </p>
              {category === 'games' && entry.selectedPlatform ? (
                <p className="text-xs font-medium text-[var(--apple-secondary-label)]">
                  Platform: {entry.selectedPlatform}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {entry.tags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="apple-pill px-2 py-0.5 text-[11px] text-[var(--apple-secondary-label)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="apple-card rounded-[14px] border-[var(--apple-separator)] px-2 py-1.5 text-center">
              <p className="text-[10px] uppercase tracking-wide text-[var(--apple-secondary-label)]">Status</p>
              <p className="text-xs font-semibold text-[var(--apple-system-blue)]">{statusLabel}</p>
            </div>
            <div className="apple-card rounded-[14px] border-[var(--apple-separator)] px-2 py-1.5 text-center">
              <p className="text-[10px] uppercase tracking-wide text-[var(--apple-secondary-label)]">Progress</p>
              <p className="text-xs font-semibold text-[var(--apple-label)]">{progressDisplay}</p>
            </div>
            <div className="apple-card rounded-[14px] border-[var(--apple-separator)] px-2 py-1.5 text-center">
              <p className="text-[10px] uppercase tracking-wide text-[var(--apple-secondary-label)]">Score</p>
              <p className="text-xs font-semibold text-[var(--apple-label)]">{entry.score ?? '-'}</p>
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
              className="h-9 w-9 rounded-[12px]"
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
              className="h-9 w-9 rounded-[12px]"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="hidden items-center gap-4 md:grid md:grid-cols-[72px,1.5fr,0.7fr,0.7fr,0.5fr,112px]">
          <div className="relative h-20 w-14 overflow-hidden rounded-xl bg-[var(--apple-tertiary-fill)]">
            <Image
              src={entry.cover}
              alt={entry.title}
              width={56}
              height={80}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="space-y-1">
            <p className="apple-title-tracking text-left text-base font-semibold text-[var(--apple-label)]">
              {entry.title}
            </p>
            <p className="apple-body-tracking text-sm text-[var(--apple-secondary-label)]">
              {entry.subtitle}
              {entry.year ? ` · ${entry.year}` : ''}
            </p>
            {category === 'games' && entry.selectedPlatform ? (
              <p className="text-xs font-medium text-[var(--apple-secondary-label)]">
                Platform: {entry.selectedPlatform}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {entry.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="apple-pill px-2 py-0.5 text-[11px] text-[var(--apple-secondary-label)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex w-full items-center justify-center">
            <span className="apple-choice-chip px-3 py-1 text-xs font-semibold" data-active="true">
              {statusLabel}
            </span>
          </div>
          <div className="flex w-full items-center justify-center text-sm text-[var(--apple-secondary-label)]">
            {progressDisplay}
          </div>
          <div className="flex w-full items-center justify-center text-sm font-semibold text-[var(--apple-label)]">
            {entry.score ?? '-'}
          </div>
          <div className="flex w-full items-center justify-center gap-2">
            <Button
              type="button"
              variant={'secondary'}
              onClick={() => onOpenDialog(entry)}
              title="Edit"
              aria-label="Edit"
              className="rounded-[12px]"
            >
              <Pencil className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant={'destructive'}
              onClick={handleDeleteClick}
              title="Delete"
              aria-label="Delete"
              className="rounded-[12px]"
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

export default memo(LibraryEntryRow);
