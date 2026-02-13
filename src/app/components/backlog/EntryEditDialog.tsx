'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Trash2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { apiClient } from '@/lib/api/client';
import { selectUser } from '@/store/slices/authSlice';
import { hasAnyRole } from '@/lib/roles';
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
  selectedPlatform: string;
};

interface EntryEditDialogProps {
  entry: (MediaEntry & Partial<SearchResult>) | null;
  category: MediaCategory;
  onClose: () => void;
  onSave: (editState: EditState) => Promise<void>;
  onDelete: (entry: MediaEntry) => void;
  onRefreshEntry?: (refreshSelectedEntry?: boolean) => Promise<void> | void;
}

const NO_PLATFORM_VALUE = '__none';

export default function EntryEditDialog({
  entry,
  category,
  onClose,
  onSave,
  onDelete,
  onRefreshEntry,
}: Readonly<EntryEditDialogProps>) {
  const user = useSelector(selectUser);
  const canManageCatalog = hasAnyRole(user, ['admin', 'owner', 'moderator']);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [isDescriptionEditing, setIsDescriptionEditing] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [isSyncingRawgMetadata, setIsSyncingRawgMetadata] = useState(false);
  const [catalogMessage, setCatalogMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editState, setEditState] = useState<EditState>({
    status: 'planned',
    progress: '',
    score: '',
    notes: '',
    isFavorite: false,
    selectedPlatform: '',
  });

  const config = CATEGORY_CONFIG[category];
  const progressLabel = getProgressLabel(category);
  const [selectPortalContainer, setSelectPortalContainer] = useState<HTMLDivElement | null>(null);
  const handleSelectPortalMount = useCallback((element: HTMLDivElement | null) => {
    setSelectPortalContainer(element);
  }, []);

  useEffect(() => {
    if (!entry) return;
    setDescriptionExpanded(false);
    setIsDescriptionEditing(false);
    setCatalogMessage(null);
    const nextDescription = entry.description ?? '';
    setDescriptionValue(nextDescription);
    setDescriptionDraft(nextDescription);
    setEditState({
      status: entry.status ?? 'planned',
      progress: entry.progress ? String(entry.progress) : '',
      score: entry.entryId ? (entry.score ?? '') : '',
      notes: entry.notes ?? '',
      isFavorite: entry.isFavorite ?? false,
      selectedPlatform:
        entry.selectedPlatform ??
        (category === 'games' && (entry.platforms ?? []).includes('PC') ? 'PC' : ''),
    });
  }, [category, entry]);

  const total = entry ? getTotalCount(entry, category) : undefined;
  const shouldAutoCompleteProgress = category !== 'games';
  const descriptionText = entry ? descriptionValue || entry.description || '' : '';
  const showDescriptionTools = canManageCatalog && Boolean(entry?.mediaId);
  const isDescriptionCollapsed = !descriptionExpanded && !isDescriptionEditing && !!descriptionText;
  const descriptionContainerClassName = [
    'relative text-sm leading-relaxed text-foreground/90',
    isDescriptionCollapsed ? 'max-h-24 overflow-hidden' : '',
  ].join(' ');

  const handleSaveDescription = async () => {
    if (!entry?.mediaId || !showDescriptionTools) return;
    try {
      setIsSavingDescription(true);
      setCatalogMessage(null);
      const response = await apiClient.request('/api/media/entry', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_description',
          category,
          mediaId: entry.mediaId,
          description: descriptionDraft,
        }),
      });
      const data = (await response.json()) as { error?: string; description?: string };
      if (!response.ok) throw new Error(data.error || 'Description update failed');
      setDescriptionValue(data.description ?? descriptionDraft);
      setIsDescriptionEditing(false);
      await onRefreshEntry?.(true);
      setCatalogMessage({ type: 'success', message: 'Η περιγραφή ενημερώθηκε.' });
    } catch (error) {
      console.warn('Description update failed:', error);
      setCatalogMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Αποτυχία ενημέρωσης περιγραφής.',
      });
    } finally {
      setIsSavingDescription(false);
    }
  };

  const handleSyncRawgMetadata = async () => {
    if (!entry?.mediaId || category !== 'games' || !showDescriptionTools) return;
    try {
      setIsSyncingRawgMetadata(true);
      setCatalogMessage(null);
      const response = await apiClient.request('/api/media/entry', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_rawg_metadata', category, mediaId: entry.mediaId }),
      });
      const data = (await response.json()) as { error?: string; description?: string };
      if (!response.ok) throw new Error(data.error || 'RAWG metadata sync failed');
      if (typeof data.description === 'string') {
        setDescriptionValue(data.description);
        setDescriptionDraft(data.description);
      }
      await onRefreshEntry?.();
      setCatalogMessage({ type: 'success', message: 'Το metadata sync από RAWG ολοκληρώθηκε.' });
    } catch (error) {
      console.warn('RAWG metadata sync failed:', error);
      setCatalogMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Αποτυχία sync metadata από RAWG.',
      });
    } finally {
      setIsSyncingRawgMetadata(false);
    }
  };

  const handleStatusChange = (nextStatus: MediaStatus) => {
    setEditState(prev => {
      if (nextStatus === 'completed' && total !== undefined && shouldAutoCompleteProgress) {
        return { ...prev, status: nextStatus, progress: String(total) };
      }
      if (prev.status === 'completed' && nextStatus !== 'completed') {
        return { ...prev, status: nextStatus, progress: '' };
      }
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
    if (raw.startsWith('.')) raw = `0${raw}`;
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

  const platformValue = editState.selectedPlatform || NO_PLATFORM_VALUE;
  const scoreNumber = editState.score === '' ? 0 : Number(editState.score);

  return (
    <>
      <Dialog open={!!entry} onOpenChange={open => !open && onClose()}>
        {entry && (
          <DialogContent
            withBlurBackdrop
            portalContainerRef={handleSelectPortalMount}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 gap-0 border-border p-0 max-sm:bottom-0 max-sm:left-0 max-sm:top-auto max-sm:h-[96dvh] max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-t-3xl max-sm:border-x-0 max-sm:border-b-0 sm:max-h-[88vh] sm:rounded-3xl"
          >
            <div className="flex h-[96dvh] max-h-[96dvh] flex-col overflow-hidden sm:h-[88vh] sm:max-h-[88vh]">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                  <div className="relative h-16 w-10 shrink-0 rounded-xl bg-card sm:h-44 sm:w-28 sm:rounded-2xl">
                    <Image
                      src={entry.cover}
                      alt={entry.title}
                      width={144}
                      height={208}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <DialogHeader className="flex-1 space-y-3 text-left sm:pr-8">
                    <div className="space-y-1.5">
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                        {category.toUpperCase()}
                      </p>
                      <DialogTitle className="text-xl font-semibold text-foreground sm:text-2xl">
                        {entry.title}
                      </DialogTitle>
                      <DialogDescription className="text-sm text-muted-foreground">
                        {entry.subtitle}
                        {entry.year ? ` • ${entry.year}` : ''}
                      </DialogDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {entry.tags.slice(0, 6).map(tag => (
                        <span
                          key={tag}
                          className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    {category === 'games' && entry.platforms && entry.platforms.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Platforms:</span>{' '}
                        {entry.platforms.slice(0, 4).join(', ')}
                        {entry.platforms.length > 4 && ` +${entry.platforms.length - 4}`}
                      </p>
                    )}
                  </DialogHeader>
                </div>
              </div>

              <Separator className="bg-border" />

              <div className="flex-1 overflow-y-auto">
                <div className="space-y-6 p-4 pb-8 sm:p-6 sm:pb-8">
                  {(descriptionText || showDescriptionTools) && (
                    <section className="rounded-2xl border border-border bg-card p-4">
                      <div className="space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Description
                        </h3>
                        <div className={descriptionContainerClassName}>
                          {isDescriptionEditing ? (
                            <Textarea
                              value={descriptionDraft}
                              onChange={event => setDescriptionDraft(event.target.value)}
                              className="min-h-[120px]"
                              placeholder="Περιγραφή..."
                              aria-label="Description editor"
                            />
                          ) : (
                            <p className="whitespace-pre-line">
                              {descriptionText || 'Δεν υπάρχει περιγραφή.'}
                            </p>
                          )}
                          {!descriptionExpanded && !isDescriptionEditing && (
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card to-transparent" />
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setDescriptionExpanded(v => !v)}
                          >
                            {descriptionExpanded ? 'Show less' : 'Show more'}
                          </Button>
                          {showDescriptionTools && (
                            <>
                              {!isDescriptionEditing ? (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  onClick={() => {
                                    setDescriptionDraft(descriptionText);
                                    setIsDescriptionEditing(true);
                                    setDescriptionExpanded(true);
                                  }}
                                >
                                  Edit
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    type="button"
                                    variant="primary"
                                    onClick={handleSaveDescription}
                                    disabled={isSavingDescription}
                                  >
                                    {isSavingDescription ? 'Saving...' : 'Save'}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      setIsDescriptionEditing(false);
                                      setDescriptionDraft(descriptionText);
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              )}
                              {category === 'games' && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={handleSyncRawgMetadata}
                                  disabled={isSyncingRawgMetadata}
                                >
                                  {isSyncingRawgMetadata ? 'Syncing...' : 'Sync RAWG metadata'}
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                        {catalogMessage && (
                          <p
                            className={[
                              'text-xs font-medium',
                              catalogMessage.type === 'success'
                                ? 'text-emerald-400'
                                : 'text-rose-400',
                            ].join(' ')}
                          >
                            {catalogMessage.message}
                          </p>
                        )}
                      </div>
                    </section>
                  )}

                  <section className="grid items-start gap-4 rounded-2xl border border-border bg-card p-4 md:grid-cols-2">
                    {category === 'games' && (
                      <div className="md:col-span-2">
                        <label
                          htmlFor="entry-platform-trigger"
                          className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                        >
                          Platform που παίζεις
                        </label>
                        <Select
                          value={platformValue}
                          onValueChange={value =>
                            setEditState(prev => ({
                              ...prev,
                              selectedPlatform: value === NO_PLATFORM_VALUE ? '' : value,
                            }))
                          }
                        >
                          <SelectTrigger id="entry-platform-trigger" className="mt-2 h-10">
                            <SelectValue placeholder="Δεν έχω επιλέξει" />
                          </SelectTrigger>
                          <SelectContent portalContainer={selectPortalContainer}>
                            <SelectItem value={NO_PLATFORM_VALUE}>Δεν έχω επιλέξει</SelectItem>
                            {(entry.platforms ?? []).map(platform => (
                              <SelectItem key={platform} value={platform}>
                                {platform}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="entry-status-trigger"
                        className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                      >
                        Status
                      </label>
                      <Select
                        value={editState.status}
                        onValueChange={value => handleStatusChange(value as MediaStatus)}
                      >
                        <SelectTrigger id="entry-status-trigger" className="h-10 !min-h-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent portalContainer={selectPortalContainer}>
                          <SelectItem value="planned">{config.plannedLabel}</SelectItem>
                          {category !== 'movies' && (
                            <SelectItem value="current">{config.currentLabel}</SelectItem>
                          )}
                          <SelectItem value="completed">{config.completedLabel}</SelectItem>
                          <SelectItem value="dropped">{config.droppedLabel}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {category !== 'movies' ? (
                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor="entry-progress"
                          className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                        >
                          Πρόοδος ({progressLabel})
                        </label>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <div className="flex h-10 w-full items-center rounded-xl border border-border bg-card sm:w-48">
                            <Input
                              id="entry-progress"
                              value={editState.progress}
                              onChange={event => handleProgressInputChange(event.target.value)}
                              className="h-full w-16 min-w-[56px] rounded-none border-0 bg-transparent px-3 py-0 text-center text-sm focus-visible:ring-0"
                              inputMode="numeric"
                              placeholder="0"
                              aria-label="Progress value"
                            />
                            {category !== 'games' && (
                              <>
                                <div className="h-5 w-px bg-border opacity-80" />
                                <div className="flex h-full flex-1 items-center justify-center whitespace-nowrap px-3 text-sm font-semibold text-muted-foreground">
                                  {total ?? '—'}
                                </div>
                              </>
                            )}
                          </div>

                          {category !== 'games' && (
                            <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-1 sm:items-center sm:justify-end">
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setProgress((hasNumeric ? safeValue : 0) - 1)}
                                className="h-9 rounded-full px-3"
                              >
                                −1
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setProgress((hasNumeric ? safeValue : 0) + 1)}
                                className="h-9 rounded-full px-3"
                              >
                                +1
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                disabled={!total}
                                onClick={() => total && setProgress(total)}
                                className="h-9 rounded-full border-primary/40 bg-primary/10 px-3 font-semibold text-primary disabled:opacity-40"
                                title="Complete"
                              >
                                Max
                              </Button>
                            </div>
                          )}
                        </div>

                        {total && hasNumeric && category !== 'games' && (
                          <div className="mt-3 rounded-full border border-border bg-card p-1">
                            <div className="relative h-3 w-full rounded-full bg-card">
                              <div
                                className="h-full rounded-full bg-primary transition-[width] duration-300"
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
                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          Διάρκεια
                        </label>
                        <div className="mt-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground">
                          {total ? `${total} min` : '—'}
                        </div>
                        {editState.status !== 'completed' && (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setEditState(prev => ({ ...prev, status: 'completed' }))}
                            className="mt-3 w-full"
                          >
                            Mark as Watched
                          </Button>
                        )}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="entry-score"
                          className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                        >
                          Βαθμολογία
                        </label>
                        <span className="text-xs font-semibold text-foreground">
                          {editState.score === '' ? '—' : editState.score}
                        </span>
                      </div>

                      <Slider
                        value={[Number.isFinite(scoreNumber) ? scoreNumber : 0]}
                        min={0}
                        max={10}
                        step={0.5}
                        onValueChange={value =>
                          setEditState(prev => ({
                            ...prev,
                            score: String(value[0] ?? 0),
                          }))
                        }
                        data-empty={editState.score === ''}
                        className="mt-3 [&_[data-slot=slider-range]]:bg-info [&_[data-slot=slider-thumb]]:h-5 [&_[data-slot=slider-thumb]]:w-5 [&_[data-slot=slider-thumb]]:border-info/35 [&_[data-slot=slider-thumb]]:bg-card [&_[data-slot=slider-thumb]]:shadow-[0_2px_10px_rgba(0,122,255,0.35)] [&_[data-slot=slider-track]]:h-2 [&_[data-slot=slider-track]]:rounded-full [&_[data-slot=slider-track]]:border [&_[data-slot=slider-track]]:border-border/60 [&_[data-slot=slider-track]]:bg-border/20"
                        aria-label="Βαθμολογία slider"
                      />

                      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <Input
                          id="entry-score"
                          value={editState.score}
                          inputMode="decimal"
                          placeholder="0–10"
                          onChange={event => handleScoreChange(event.target.value)}
                          className="w-16 min-w-[56px] text-center sm:w-24"
                        />
                        <p className="flex-1 text-xs text-muted-foreground">
                          Tip: σύρε την μπάρα ή γράψε τιμή (δέχεται και <span>0,5</span>).
                        </p>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setEditState(prev => ({ ...prev, score: '' }))}
                          className="w-full sm:w-auto"
                          title="Καθάρισμα"
                        >
                          Reset
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Favorite
                      </label>
                      <Button
                        type="button"
                        variant={editState.isFavorite ? 'primary' : 'secondary'}
                        onClick={() =>
                          setEditState(prev => ({ ...prev, isFavorite: !prev.isFavorite }))
                        }
                        className="mt-2 flex w-full items-center justify-center gap-2"
                        aria-pressed={editState.isFavorite}
                      >
                        <span className="text-lg">{editState.isFavorite ? '♥' : '♡'}</span>
                        {editState.isFavorite ? 'Στα αγαπημένα' : 'Προσθήκη στα αγαπημένα'}
                      </Button>
                    </div>

                    <div className="md:col-span-2">
                      <label
                        htmlFor="entry-notes"
                        className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                      >
                        Σημειώσεις
                      </label>
                      <Textarea
                        id="entry-notes"
                        value={editState.notes}
                        onChange={event =>
                          setEditState(prev => ({ ...prev, notes: event.target.value }))
                        }
                        className="mt-2 min-h-[56px]"
                        placeholder="Προσωπικές σημειώσεις..."
                      />
                    </div>
                  </section>
                </div>
              </div>

              <DialogFooter className="mt-auto w-full rounded-b-3xl border-t border-border bg-card/90 p-4 backdrop-blur-sm sm:p-6">
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-2">
                    {entry.mediaId && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setShowDeleteConfirm(true)}
                        icon={<Trash2 className="h-4 w-4" />}
                      >
                        Διαγραφή
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    <Button type="button" variant="outline" onClick={onClose}>
                      Ακύρωση
                    </Button>
                    <Button type="button" variant="primary" onClick={() => onSave(editState)}>
                      Αποθήκευση
                    </Button>
                  </div>
                </div>
              </DialogFooter>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {entry?.mediaId && (
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent className="border-border text-foreground">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Διαγραφή καταχώρησης</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                {`Θες σίγουρα να αφαιρέσεις το "${entry.title}" από τη βιβλιοθήκη σου;`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-border bg-transparent text-foreground">
                Άκυρο
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-accent text-white hover:brightness-110"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete(entry);
                }}
              >
                Διαγραφή
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
