'use client';

import EntryEditDialog, { type EditState } from '@/app/components/backlog/EntryEditDialog';
import type { MediaCategory, MediaEntry, SearchResult } from '@/app/components/backlog/types';

type MediaEntryDialogControllerProps = {
  category: MediaCategory;
  entry: (MediaEntry & Partial<SearchResult>) | null;
  onClose: () => void;
  onSave: (editState: EditState) => Promise<void>;
  onDelete: (entry: MediaEntry) => void;
};

export default function MediaEntryDialogController({
  category,
  entry,
  onClose,
  onSave,
  onDelete,
}: Readonly<MediaEntryDialogControllerProps>) {
  return (
    <EntryEditDialog
      entry={entry}
      category={category}
      onClose={onClose}
      onSave={onSave}
      onDelete={onDelete}
    />
  );
}
