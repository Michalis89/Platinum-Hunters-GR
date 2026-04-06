'use client';

import { memo, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/context/LocaleContext';
import { cn } from '@/lib/utils';
import type { DiaryEntryDecrypted } from '@/lib/diary/types';
const panelClassName =
  'flex h-full min-h-0 flex-col gap-3 rounded-[var(--radius-xl)] border border-[hsl(var(--border-default)/0.72)] bg-[hsl(var(--surface-raised)/0.94)] p-3 shadow-[var(--shadow-sm)]';
const rowBaseClassName =
  'w-full rounded-[var(--radius-md)] border border-transparent px-3 py-2.5 text-left transition-[background-color,border-color,box-shadow] duration-200';
const rowActiveClassName =
  'border-[hsl(var(--accent-primary)/0.36)] bg-[hsl(var(--accent-muted)/0.75)] shadow-[0_0_0_1px_hsl(var(--accent-primary)/0.24)]';
const rowIdleClassName =
  'bg-transparent hover:border-[hsl(var(--border-subtle)/0.86)] hover:bg-[hsl(var(--surface-hover)/0.76)]';

type DiaryEntryListPaneProps = {
  entries: DiaryEntryDecrypted[];
  searchValue: string;
  selectedEntryId: string | null;
  onSearchChange: (value: string) => void;
  onSelectEntry: (entryId: string) => void;
  onCreateNew: () => void;
};

function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const MoodDot = memo(function MoodDot({ mood }: { mood: DiaryEntryDecrypted['mood'] }) {
  if (!mood) {
    return null;
  }

  const moodClass =
    mood === 'happy'
      ? 'bg-[hsl(var(--success))]'
      : mood === 'excited'
        ? 'bg-[hsl(var(--accent-primary))]'
        : mood === 'calm'
          ? 'bg-[hsl(var(--info))]'
          : mood === 'neutral'
            ? 'bg-[hsl(var(--border-strong))]'
            : mood === 'anxious'
              ? 'bg-[hsl(var(--warning))]'
              : mood === 'sad'
                ? 'bg-[hsl(var(--accent-primary)/0.7)]'
                : 'bg-[hsl(var(--error))]';

  return <span className={cn('h-2 w-2 shrink-0 rounded-full', moodClass)} aria-hidden="true" />;
});

const DiaryEntryRow = memo(function DiaryEntryRow({
  entry,
  isSelected,
  onSelect,
  dateFormatter,
}: {
  entry: DiaryEntryDecrypted;
  isSelected: boolean;
  onSelect: (entryId: string) => void;
  dateFormatter: Intl.DateTimeFormat;
}) {
  const preview = useMemo(() => stripHtml(entry.content), [entry.content]);

  return (
    <button
      type="button"
      onClick={() => onSelect(entry.id)}
      className={cn(rowBaseClassName, isSelected ? rowActiveClassName : rowIdleClassName)}
    >
      <div className="flex items-center justify-between gap-3 text-xs text-[hsl(var(--text-secondary))]">
        <div className="flex items-center gap-2">
          <MoodDot mood={entry.mood} />
          <span>{dateFormatter.format(new Date(entry.entry_date))}</span>
        </div>
        {entry.mood ? (
          <Badge
            variant="outline"
            className="h-5 rounded-full border-[hsl(var(--border-default)/0.7)] bg-[hsl(var(--surface-overlay)/0.45)] px-2 text-[10px] capitalize text-[hsl(var(--text-secondary))]"
          >
            {entry.mood}
          </Badge>
        ) : null}
      </div>
      <p className="mt-1.5 line-clamp-1 text-sm font-semibold leading-snug text-[hsl(var(--text-primary))]">
        {entry.title || 'Untitled reflection'}
      </p>
      <p className="line-clamp-1 text-xs leading-relaxed text-[hsl(var(--text-secondary))]">
        {preview || 'No content yet'}
      </p>
    </button>
  );
});

export const DiaryEntryListPane = memo(function DiaryEntryListPane({
  entries,
  searchValue,
  selectedEntryId,
  onSearchChange,
  onSelectEntry,
  onCreateNew,
}: DiaryEntryListPaneProps) {
  const locale = useLocale();
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    [locale],
  );

  const filteredEntries = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) {
      return entries;
    }

    return entries.filter(entry => {
      const plainContent = stripHtml(entry.content);
      return (
        entry.title.toLowerCase().includes(query) ||
        plainContent.toLowerCase().includes(query) ||
        (entry.mood ?? '').toLowerCase().includes(query)
      );
    });
  }, [entries, searchValue]);

  return (
    <section className={panelClassName}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-[0.01em] text-[hsl(var(--text-primary))]">
          Entries
        </h2>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-9 rounded-[var(--radius-md)] border-[hsl(var(--border-default)/0.86)] bg-[hsl(var(--surface-overlay)/0.68)] px-3 text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--surface-hover)/0.84)]"
          onClick={onCreateNew}
        >
          New
        </Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--text-tertiary))]" />
        <Input
          value={searchValue}
          onChange={event => onSearchChange(event.target.value)}
          className="h-10 rounded-[var(--radius-md)] border-[hsl(var(--border-subtle)/0.9)] bg-[hsl(var(--surface-base)/0.62)] pl-9 text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-tertiary))]"
          placeholder="Search entries"
          aria-label="Search diary entries"
        />
      </div>

      <div className="min-h-0 space-y-1 overflow-y-auto pr-1">
        {filteredEntries.length === 0 ? (
          <p className="px-2 py-10 text-center text-sm leading-relaxed text-[hsl(var(--text-secondary))]">
            No entries found.
          </p>
        ) : (
          filteredEntries.map(entry => (
            <DiaryEntryRow
              key={entry.id}
              entry={entry}
              isSelected={selectedEntryId === entry.id}
              onSelect={onSelectEntry}
              dateFormatter={dateFormatter}
            />
          ))
        )}
      </div>
    </section>
  );
});
