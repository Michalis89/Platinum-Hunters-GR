'use client';

import { memo, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface LibraryEntryRowProps {
  entry: MediaEntry;
  category: MediaCategory;
  index: number;
  onOpenDialog: (entry: MediaEntry & Partial<SearchResult>) => void;
  onDelete: (entry: MediaEntry) => void;
}

const toMediaSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');

function LibraryEntryRow({
  entry,
  category,
  index,
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
        ? `${progressValue}${total ? 'h' : ''}`
        : '-';

  const scoreLabel = useMemo(() => {
    if (!entry.score) return 'No score';
    return `Score ${entry.score}`;
  }, [entry.score]);
  const mediaSlug = useMemo(
    () => (entry.title?.trim() ? toMediaSlug(entry.title) : String(entry.mediaId ?? entry.id)),
    [entry.id, entry.mediaId, entry.title],
  );

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    onDelete(entry);
  };

  return (
    <>
      <article
        className={`group rounded-2xl border p-3 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-4 ${
          index % 2 === 0 ? 'border-border/70 bg-card/70' : 'border-border/60 bg-card/50'
        }`}
      >
        <div className="grid gap-4 md:grid-cols-[92px,1.4fr,0.55fr,0.5fr,112px] md:items-center">
          <div className="relative h-28 w-20 overflow-hidden rounded-xl border border-border/60 bg-card">
            <Image
              src={entry.cover}
              alt={entry.title}
              width={80}
              height={112}
              unoptimized
              className="h-full w-full object-cover"
            />
          </div>

          <div className="min-w-0 space-y-1">
            <Link
              href={`/media/${category}/${mediaSlug}`}
              className="line-clamp-2 block text-base font-semibold leading-tight text-foreground transition-colors hover:text-primary hover:underline sm:text-lg"
            >
              {entry.title}
            </Link>
            <p className="line-clamp-1 text-sm text-muted-foreground">
              {entry.subtitle}
              {entry.year ? ` - ${entry.year}` : ''}
            </p>
            {category === 'games' && entry.selectedPlatform ? (
              <p className="text-xs font-medium text-muted-foreground">
                Platform: {entry.selectedPlatform}
              </p>
            ) : null}
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {entry.tags.slice(0, 3).join(', ') || 'No genres'}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Status</p>
            <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {statusLabel}
            </span>
            <p className="text-xs text-muted-foreground">Progress: {progressDisplay}</p>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Score</p>
            <Badge
              variant="secondary"
              className="rounded-full border border-border/70 bg-card/80 px-3 py-1 text-xs"
            >
              {scoreLabel}
            </Badge>
          </div>

          <div className="flex items-center justify-end gap-2 opacity-100 transition md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
            <Button
              type="button"
              size="icon"
              variant="secondary"
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
              variant="destructive"
              onClick={handleDeleteClick}
              title="Delete"
              aria-label="Delete"
              className="h-9 w-9 rounded-[12px]"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </article>

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
