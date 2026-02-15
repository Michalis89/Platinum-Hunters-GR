'use client';

import { memo, useState } from 'react';
import Image from 'next/image';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MediaCategory, MediaEntry, SearchResult, CATEGORY_CONFIG, getTotalCount } from './types';
import { Item } from '@/components/ui/item';

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
      <div className="rounded-[20px] p-3 sm:p-4">
        <div className="space-y-3 md:hidden">
          <div className="flex items-start gap-3">
            <div className="relative h-20 w-14 shrink-0 rounded-xl bg-card">
              <Image
                src={entry.cover}
                alt={entry.title}
                width={56}
                height={80}
                unoptimized
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="line-clamp-2 text-left text-base font-semibold leading-tight text-foreground">
                {entry.title}
              </p>
              <p className="text-sm text-muted-foreground">
                {entry.subtitle}
                {entry.year ? ` · ${entry.year}` : ''}
              </p>
              {category === 'games' && entry.selectedPlatform ? (
                <p className="text-xs font-medium text-muted-foreground">
                  Platform: {entry.selectedPlatform}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {entry.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="px-2 py-0.5 text-[11px] text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-[14px] px-2 py-1.5 text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Status</p>
              <p className="text-xs font-semibold text-primary">{statusLabel}</p>
            </div>
            <div className="rounded-[14px] px-2 py-1.5 text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Progress</p>
              <p className="text-xs font-semibold text-foreground">{progressDisplay}</p>
            </div>
            <div className="rounded-[14px] px-2 py-1.5 text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Score</p>
              <p className="text-xs font-semibold text-foreground">{entry.score ?? '-'}</p>
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

        <Item
          asChild
          variant="muted"
          className="hidden items-center gap-4 md:grid md:grid-cols-[72px,1.5fr,0.7fr,0.7fr,0.5fr,112px]"
        >
          <div className="contents">
            <div className="relative h-20 w-14 rounded-xl bg-card">
              <Image
                src={entry.cover}
                alt={entry.title}
                width={56}
                height={80}
                unoptimized
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-1">
              <p className="text-left text-base font-semibold text-foreground">{entry.title}</p>
              {entry.subtitle && (
                <p className="text-xs font-medium text-muted-foreground">{entry.subtitle}</p>
              )}
              <p className="text-xs font-medium text-muted-foreground">
                Release Year: {entry.year ? ` ${entry.year}` : ''}
              </p>
              {category === 'games' && entry.selectedPlatform ? (
                <p className="text-xs font-medium text-muted-foreground">
                  Platform: {entry.selectedPlatform}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Genre:{' '}
                  {entry.tags.slice(0, 3).map((tag, index, array) => (
                    <span key={tag}>
                      {tag}
                      {index < array.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </p>
              </div>
            </div>
            <div className="flex w-full items-center justify-center">
              <span className="px-3 py-1 text-xs font-semibold" data-active="true">
                {statusLabel}
              </span>
            </div>
            <div className="flex w-full items-center justify-center text-sm text-muted-foreground">
              {progressDisplay}
            </div>
            <div className="flex w-full items-center justify-center text-sm font-semibold text-foreground">
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
        </Item>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="space-y-6 sm:max-w-xl">
          <AlertDialogHeader className="text-center sm:text-left">
            <AlertDialogTitle>Delete entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &ldquo;{entry.title}&rdquo; from your library?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:flex-row">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={handleConfirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default memo(LibraryEntryRow);
