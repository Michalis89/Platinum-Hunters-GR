'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Pencil, Trash2 } from 'lucide-react';
import Button from '@/app/components/ui/Button';
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
    progressValue !== null ? `${progressValue}${total ? ` / ${total}` : ''}` : '—';

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    onDelete(entry);
  };

  return (
    <>
      <div className="grid items-center gap-4 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-3 md:grid-cols-[72px,1.5fr,0.7fr,0.7fr,0.5fr,112px]">
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
            {entry.year ? ` • ${entry.year}` : ''}
          </p>
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
          {entry.score ?? '—'}
        </div>

        <div className="flex w-full items-center justify-center gap-2">
          <Button
            type="button"
            onClick={() => onOpenDialog(entry)}
            title="Επεξεργασία"
            aria-label="Επεξεργασία"
            className="hover:border-[var(--hb-primary-strong)]/50 hover:bg-[var(--hb-primary-strong)]/10 flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--hb-border)] bg-[var(--hb-panel)] text-[var(--hb-muted)] transition-all hover:text-[var(--hb-primary-strong)]"
          >
            <Pencil className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            onClick={handleDeleteClick}
            title="Διαγραφή"
            aria-label="Διαγραφή"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--hb-border)] bg-[var(--hb-panel)] text-[var(--hb-muted)] transition-all hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Διαγραφή καταχώρησης"
        message={`Θες σίγουρα να αφαιρέσεις το "${entry.title}" από τη βιβλιοθήκη σου;`}
        confirmLabel="Διαγραφή"
        cancelLabel="Άκυρο"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
