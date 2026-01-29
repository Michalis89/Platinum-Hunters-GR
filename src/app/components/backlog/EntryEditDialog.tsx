'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Trash2 } from 'lucide-react';
import Button from '@/app/components/ui/Button';
import ConfirmDialog from '@/app/components/ui/ConfirmDialog';
import {
  MediaCategory,
  MediaEntry,
  MediaStatus,
  SearchResult,
  CATEGORY_CONFIG,
  getTotalCount,
  getProgressLabel,
} from './types';

export type EditState = {
  status: MediaStatus;
  progress: string;
  score: string;
  notes: string;
  isFavorite: boolean;
};

interface EntryEditDialogProps {
  entry: (MediaEntry & Partial<SearchResult>) | null;
  category: MediaCategory;
  onClose: () => void;
  onSave: (editState: EditState) => Promise<void>;
  onDelete: (entry: MediaEntry) => void;
}

export default function EntryEditDialog({
  entry,
  category,
  onClose,
  onSave,
  onDelete,
}: Readonly<EntryEditDialogProps>) {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editState, setEditState] = useState<EditState>({
    status: 'planned',
    progress: '',
    score: '',
    notes: '',
    isFavorite: false,
  });

  const config = CATEGORY_CONFIG[category];
  const progressLabel = getProgressLabel(category);

  useEffect(() => {
    if (entry) {
      setDescriptionExpanded(false);
      setEditState({
        status: entry.status ?? 'planned',
        progress: entry.progress ? String(entry.progress) : '',
        score: entry.entryId ? (entry.score ?? '') : '',
        notes: entry.notes ?? '',
        isFavorite: entry.isFavorite ?? false,
      });
    }
  }, [entry]);

  if (!entry) return null;

  const total = getTotalCount(entry, category);
  const shouldAutoCompleteProgress = category !== 'games';

  const handleStatusChange = (nextStatus: MediaStatus) => {
    setEditState(prev => {
      // If changing TO completed, set progress to total
      if (nextStatus === 'completed' && total !== undefined && shouldAutoCompleteProgress) {
        return { ...prev, status: nextStatus, progress: String(total) };
      }
      // If changing FROM completed to something else, reset progress
      if (prev.status === 'completed' && nextStatus !== 'completed') {
        return { ...prev, status: nextStatus, progress: '' };
      }
      // Otherwise just change status
      return { ...prev, status: nextStatus };
    });
  };

  const clampProgress = category !== 'games';
  const setProgress = (next: number) => {
    const nextValue = Math.max(0, next);
    const nextClamped = clampProgress && total ? Math.min(nextValue, total) : nextValue;
    const shouldComplete = clampProgress && total !== undefined && nextClamped >= total;

    setEditState(prev => ({
      ...prev,
      progress: String(nextClamped),
      status: shouldComplete ? 'completed' : prev.status,
    }));
  };

  const handleProgressInputChange = (value: string) => {
    if (value === '') {
      setEditState(prev => ({ ...prev, progress: '' }));
      return;
    }

    if (!/^\d+$/.test(value)) return;

    const numericProgress = Number.parseInt(value, 10);
    const shouldComplete =
      clampProgress &&
      total !== undefined &&
      Number.isFinite(numericProgress) &&
      numericProgress >= total;

    setEditState(prev => ({
      ...prev,
      progress: value,
      status: shouldComplete ? 'completed' : prev.status,
    }));
  };

  const handleScoreChange = (raw: string) => {
    if (raw === '') {
      setEditState(prev => ({ ...prev, score: '' }));
      return;
    }

    raw = raw.replace(',', '.');
    if (!/^\d*\.?\d*$/.test(raw)) return;
    if (raw.startsWith('.')) raw = '0' + raw;

    const num = Number(raw);
    if (!Number.isNaN(num) && num > 10) raw = '10';

    setEditState(prev => ({ ...prev, score: raw }));
  };

  const raw = editState.progress;
  const numeric = Number.parseInt(raw, 10);
  const hasNumeric = Number.isFinite(numeric);
  const safeValue = hasNumeric ? Math.max(0, numeric) : 0;
  const clampedValue = total ? Math.min(safeValue, total) : safeValue;
  const percent =
    total && total > 0 ? Math.min(100, Math.round((clampedValue / total) * 100)) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur"
      onClick={event => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[var(--hb-shadow-md)]">
        <div className="overflow-y-auto p-6">
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="relative hidden h-52 w-36 overflow-hidden rounded-2xl bg-[var(--hb-card)] sm:block">
              <Image
                src={entry.cover}
                alt={entry.title}
                width={144}
                height={208}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--hb-muted)]">
                  {category.toUpperCase()}
                </p>
                <h2 className="text-2xl font-semibold text-[var(--hb-headline)]">{entry.title}</h2>
                <p className="text-sm text-[var(--hb-muted)]">
                  {entry.subtitle}
                  {entry.year ? ` • ${entry.year}` : ''}
                </p>
              </div>
              {entry.description && (
                <div className="space-y-2">
                  <div
                    className={[
                      'text-[var(--hb-text)]/90 relative text-sm leading-relaxed',
                      descriptionExpanded ? '' : 'max-h-24 overflow-hidden',
                    ].join(' ')}
                  >
                    <p className="whitespace-pre-line">{entry.description}</p>
                    {!descriptionExpanded && (
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[var(--hb-panel)] to-transparent" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setDescriptionExpanded(v => !v)}
                    className="text-xs font-semibold text-[var(--hb-primary-strong)] hover:brightness-110"
                  >
                    {descriptionExpanded ? 'Show less' : 'Show more'}
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {entry.tags.slice(0, 6).map(tag => (
                  <span
                    key={tag}
                    className="rounded-full border border-[var(--hb-border)] px-2 py-0.5 text-xs text-[var(--hb-muted)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              {/* Game-specific: Platforms */}
              {category === 'games' && entry.platforms && (
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--hb-muted)]">
                  {entry.platforms && entry.platforms.length > 0 && (
                    <span className="flex items-center gap-1.5">
                      <span className="font-medium text-[var(--hb-text)]">Platforms:</span>
                      {entry.platforms.slice(0, 4).join(', ')}
                      {entry.platforms.length > 4 && ` +${entry.platforms.length - 4}`}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-4 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4 md:grid-cols-2">
            {/* Status */}
            <div>
              <label className="text-xs text-[var(--hb-muted)]">Status</label>
              <div className="relative mt-2">
                <select
                  value={editState.status}
                  onChange={event => handleStatusChange(event.target.value as MediaStatus)}
                  className="h-10 w-full appearance-none rounded-xl border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 pr-10 text-sm text-[var(--hb-text)] focus:border-[var(--hb-primary-strong)] focus:outline-none"
                >
                  <option value="planned">{config.plannedLabel}</option>
                  {category !== 'movies' && <option value="current">{config.currentLabel}</option>}
                  <option value="completed">{config.completedLabel}</option>
                  <option value="dropped">{config.droppedLabel}</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--hb-muted)]">
                  ▾
                </span>
              </div>
            </div>

            {/* Progress (non-movies) or Duration (movies) */}
            {category !== 'movies' ? (
              <div>
                <label className="text-xs text-[var(--hb-muted)]">Πρόοδος ({progressLabel})</label>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-10 w-44 items-center overflow-hidden rounded-xl border border-[var(--hb-border)] bg-[var(--hb-panel)]">
                    <input
                      value={editState.progress}
                      onChange={event => handleProgressInputChange(event.target.value)}
                      className="h-full w-20 bg-transparent px-3 text-sm text-[var(--hb-text)] focus:outline-none"
                      inputMode="numeric"
                      placeholder="0"
                    />
                    {category !== 'games' && (
                      <>
                        <div className="h-5 w-px bg-[var(--hb-border)] opacity-80" />

                        <div className="flex h-full flex-1 items-center justify-center whitespace-nowrap px-3 text-sm text-[var(--hb-muted)]">
                          {total ?? '—'}
                        </div>
                      </>
                    )}
                  </div>
                  {category !== 'games' && (
                    <div className="flex flex-1 items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setProgress((hasNumeric ? safeValue : 0) - 1)}
                        className="rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-1 text-xs text-[var(--hb-muted)] hover:text-[var(--hb-text)]"
                      >
                        −1
                      </button>
                      <button
                        type="button"
                        onClick={() => setProgress((hasNumeric ? safeValue : 0) + 1)}
                        className="rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-1 text-xs text-[var(--hb-muted)] hover:text-[var(--hb-text)]"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        disabled={!total}
                        onClick={() => total && setProgress(total)}
                        className="border-[var(--hb-primary-strong)]/40 bg-[var(--hb-primary-strong)]/10 text-s rounded-full border px-3 py-1 font-semibold text-[var(--hb-primary-strong)] disabled:opacity-40"
                        title="Complete"
                      >
                        Max
                      </button>
                    </div>
                  )}
                </div>
                {total && hasNumeric && category !== 'games' && (
                  <div className="mt-3 rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] p-1">
                    <div className="relative h-3 w-full overflow-hidden rounded-full bg-[var(--hb-card)]">
                      <div
                        className="h-full rounded-full bg-[var(--hb-primary-strong)] transition-[width] duration-300"
                        style={{ width: `${percent ?? 0}%` }}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-white/90">
                        {percent !== null ? `${percent}%` : '—'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="text-xs text-[var(--hb-muted)]">Διάρκεια</label>
                <div className="mt-2 rounded-xl border border-[var(--hb-border)] bg-[var(--hb-panel)] px-4 py-3 text-sm text-[var(--hb-text)]">
                  {total ? `${total} min` : '—'}
                </div>
                {editState.status !== 'completed' && (
                  <button
                    type="button"
                    onClick={() => setEditState(prev => ({ ...prev, status: 'completed' }))}
                    className="border-[var(--hb-primary-strong)]/40 bg-[var(--hb-primary-strong)]/10 mt-3 w-full rounded-xl border px-4 py-3 text-sm font-semibold text-[var(--hb-primary-strong)] hover:brightness-110"
                  >
                    Mark as Watched
                  </button>
                )}
              </div>
            )}

            {/* Score */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-[var(--hb-muted)]">Βαθμολογία</label>
                <span className="text-xs font-semibold text-[var(--hb-headline)]">
                  {editState.score === '' ? '—' : editState.score}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                step={0.5}
                value={editState.score === '' ? 0 : Number(editState.score)}
                onChange={e => setEditState(prev => ({ ...prev, score: e.target.value }))}
                className="mt-3 w-full accent-[var(--hb-primary-strong)]"
                aria-label="Βαθμολογία slider"
              />
              <div className="mt-3 flex items-center gap-3">
                <input
                  value={editState.score}
                  inputMode="decimal"
                  placeholder="0–10"
                  onChange={e => handleScoreChange(e.target.value)}
                  className="w-24 rounded-lg border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-2 text-sm text-[var(--hb-text)] placeholder:text-[var(--hb-muted)] focus:border-[var(--hb-primary-strong)] focus:outline-none"
                />
                <div className="flex-1 text-xs text-[var(--hb-muted)]">
                  Tip: σύρε την μπάρα ή γράψε τιμή (δέχεται και{' '}
                  <span className="font-semibold">0,5</span>).
                </div>
                <button
                  type="button"
                  onClick={() => setEditState(prev => ({ ...prev, score: '' }))}
                  className="rounded-full border border-[var(--hb-border)] px-3 py-1 text-xs text-[var(--hb-muted)] hover:text-[var(--hb-text)]"
                  title="Καθάρισμα"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Favorite */}
            <div>
              <label className="text-xs text-[var(--hb-muted)]">Favorite</label>
              <button
                type="button"
                onClick={() => setEditState(prev => ({ ...prev, isFavorite: !prev.isFavorite }))}
                className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                  editState.isFavorite
                    ? 'bg-[var(--hb-primary-strong)]/15 border-[var(--hb-primary-strong)] text-[var(--hb-primary-strong)]'
                    : 'border-[var(--hb-border)] bg-[var(--hb-panel)] text-[var(--hb-muted)] hover:text-[var(--hb-text)]'
                }`}
              >
                <span className="text-lg">{editState.isFavorite ? '♥' : '♡'}</span>
                {editState.isFavorite ? 'Στα αγαπημένα' : 'Προσθήκη στα αγαπημένα'}
              </button>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="text-xs text-[var(--hb-muted)]">Σημειώσεις</label>
              <textarea
                value={editState.notes}
                onChange={event => setEditState(prev => ({ ...prev, notes: event.target.value }))}
                className="mt-2 min-h-[60px] w-full rounded-lg border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-2 text-sm text-[var(--hb-text)] focus:border-[var(--hb-primary-strong)] focus:outline-none"
                placeholder="Προσωπικές σημειώσεις..."
              />
            </div>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="bg-[var(--hb-panel)]/80 border-t border-[var(--hb-border)] backdrop-blur">
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-center gap-2">
              {entry.mediaId && (
                <Button
                  variant="danger"
                  className="rounded-full"
                  onClick={() => setShowDeleteConfirm(true)}
                  icon={<Trash2 className="h-4 w-4" />}
                >
                  Διαγραφή
                </Button>
              )}
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                className="hover:border-[var(--hb-primary-strong)]/50 rounded-full border-[var(--hb-border)] bg-transparent text-[var(--hb-text)]"
                onClick={onClose}
              >
                Άκυρο
              </Button>
              <Button
                variant="primary"
                className="rounded-full bg-[var(--hb-primary-strong)] px-6 text-[var(--hb-bg)] hover:brightness-110"
                onClick={() => onSave(editState)}
              >
                Αποθήκευση
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Διαγραφή καταχώρησης"
        message={`Θες σίγουρα να αφαιρέσεις το "${entry.title}" από τη βιβλιοθήκη σου;`}
        confirmLabel="Διαγραφή"
        cancelLabel="Άκυρο"
        variant="danger"
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete(entry);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
