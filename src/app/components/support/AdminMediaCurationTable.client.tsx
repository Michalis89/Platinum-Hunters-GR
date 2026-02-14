'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Pencil, Save, X, RefreshCw, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SelectField as Select } from '@/components/ui/select-field';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ErrorAlert } from '@/components/ui/alert';
import EmptyState from '@/components/ui/empty';
import { Textarea } from '@/components/ui/textarea';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type MediaRow = {
  id: number;
  mal_id: number | null;
  category: string;
  source: string | null;
  title: string | null;
  title_english: string | null;
  title_romaji: string | null;
  title_native: string | null;
  description: string | null;
  format: string | null;
  status: string | null;
  season_year: number | null;
  episodes: number | null;
  start_date: string | null;
  end_date: string | null;
  release_date: string | null;
  runtime: number | null;
  rating: number | null;
  metacritic: number | null;
  esrb_rating: string | null;
  rawg_id: number | null;
  steam_app_id: number | null;
  developer: string | null;
  publisher: string | null;
  platforms: string[] | null;
  genres: string[] | null;
  cover_image_large: string | null;
  cover_image_medium: string | null;
  updated_at: string | null;
};

type FiltersState = {
  source: string;
  category: string;
  status: string;
  format: string;
  q: string;
};

type FilterOptions = {
  source: string[];
  category: string[];
  status: string[];
  format: string[];
};

type MetaState = {
  total: number;
  limit: number;
  offset: number;
  filters: FilterOptions;
};

type EditingState = Partial<
  Pick<
    MediaRow,
    | 'source'
    | 'title_english'
    | 'title_romaji'
    | 'title_native'
    | 'description'
    | 'format'
    | 'status'
    | 'season_year'
    | 'episodes'
    | 'start_date'
    | 'end_date'
  >
>;

type AdminRowUpdate = EditingState & {
  rawg_id?: number | null;
  title?: string | null;
  cover_image_large?: string | null;
  cover_image_medium?: string | null;
  release_date?: string | null;
  rating?: number | null;
  metacritic?: number | null;
  platforms?: string[];
  genres?: string[];
  developer?: string | null;
  publisher?: string | null;
  esrb_rating?: string | null;
  runtime?: number | null;
  steam_app_id?: number | null;
};

const hasTextValue = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const hasTextArrayValue = (value: unknown): value is string[] =>
  Array.isArray(value) && value.some(item => typeof item === 'string' && item.trim().length > 0);

const DEFAULT_LIMIT = 20;

const initialFilters: FiltersState = {
  source: '',
  category: '',
  status: '',
  format: '',
  q: '',
};

const emptyOptions: FilterOptions = {
  source: [],
  category: [],
  status: [],
  format: [],
};

export default function AdminMediaCurationTable() {
  const [rows, setRows] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<MetaState | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingState, setEditingState] = useState<EditingState>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [syncingIds, setSyncingIds] = useState<number[]>([]);
  const [savingAll, setSavingAll] = useState(false);
  const [draftUpdatesById, setDraftUpdatesById] = useState<Record<number, AdminRowUpdate>>({});
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<MediaRow | null>(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('limit', `${DEFAULT_LIMIT}`);
    params.set('offset', `${(page - 1) * DEFAULT_LIMIT}`);
    for (const [key, value] of Object.entries(filters)) {
      if (value.trim()) {
        params.set(key, value.trim());
      }
    }
    return params.toString();
  }, [filters, page]);

  const totalPages = Math.max(1, Math.ceil((meta?.total ?? 0) / DEFAULT_LIMIT));
  const draftCount = Object.keys(draftUpdatesById).length;
  const selectedCount = selectedRowIds.length;

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/media/entries?${queryString}`);
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to fetch media entries');
      }

      const nextRows = Array.isArray(payload?.data) ? (payload.data as MediaRow[]) : [];
      const nextMeta = payload?.meta as MetaState | undefined;

      setRows(nextRows);
      setMeta(
        nextMeta
          ? {
              total: nextMeta.total ?? 0,
              limit: nextMeta.limit ?? DEFAULT_LIMIT,
              offset: nextMeta.offset ?? 0,
              filters: nextMeta.filters ?? emptyOptions,
            }
          : null,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch media entries');
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    setSelectedRowIds(prev => prev.filter(id => rows.some(row => row.id === id)));
  }, [rows]);

  const resetEdit = () => {
    setEditingId(null);
    setEditingState({});
  };

  const startEditing = (row: MediaRow) => {
    setEditingId(row.id);
    setEditingState({
      source: row.source,
      title_english: row.title_english,
      title_romaji: row.title_romaji,
      title_native: row.title_native,
      description: row.description,
      format: row.format,
      status: row.status,
      season_year: row.season_year,
      episodes: row.episodes,
      start_date: row.start_date,
      end_date: row.end_date,
    });
  };

  const saveRow = async (rowId: number) => {
    setSavingId(rowId);
    setError(null);
    setSuccessMessage(null);

    try {
      const mergedUpdates: AdminRowUpdate = {
        ...(draftUpdatesById[rowId] ?? {}),
        ...editingState,
      };

      const response = await fetch(`/api/admin/media/entries/${rowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: mergedUpdates }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update entry');
      }

      const updated = payload?.data as MediaRow | undefined;
      if (updated) {
        setRows(prev => prev.map(row => (row.id === rowId ? updated : row)));
      }
      setDraftUpdatesById(prev => {
        const next = { ...prev };
        delete next[rowId];
        return next;
      });
      setSuccessMessage('Row updated successfully.');
      resetEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update entry');
    } finally {
      setSavingId(null);
    }
  };

  const syncRawgPreviewForRow = async (row: MediaRow) => {
    if (row.category !== 'games') return;

    setError(null);
    setSuccessMessage(null);
    setSyncingIds(prev => (prev.includes(row.id) ? prev : [...prev, row.id]));

    try {
      const response = await fetch('/api/media/entry', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'preview_rawg_metadata',
          category: 'games',
          mediaId: row.id,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        patch?: AdminRowUpdate;
      } | null;

      if (!response.ok || !payload?.patch) {
        throw new Error(payload?.error || 'Failed to sync RAWG metadata');
      }

      const patch: AdminRowUpdate = { ...payload.patch };

      // Keep existing values when RAWG does not provide meaningful text.
      if (!hasTextValue(patch.developer)) {
        delete patch.developer;
      }
      if (!hasTextValue(patch.publisher)) {
        delete patch.publisher;
      }
      if (!hasTextArrayValue(patch.platforms)) {
        delete patch.platforms;
      }

      setDraftUpdatesById(prev => ({
        ...prev,
        [row.id]: {
          ...(prev[row.id] ?? {}),
          ...patch,
        },
      }));

      setRows(prev =>
        prev.map(entry =>
          entry.id === row.id
            ? {
                ...entry,
                source: patch.source ?? entry.source,
                title_english: patch.title_english ?? entry.title_english,
                description: patch.description ?? entry.description,
                season_year: patch.season_year ?? entry.season_year,
                developer: patch.developer ?? entry.developer,
                publisher: patch.publisher ?? entry.publisher,
                platforms: patch.platforms ?? entry.platforms,
              }
            : entry,
        ),
      );

      if (editingId === row.id) {
        setEditingState(prev => ({
          ...prev,
          source: patch.source ?? prev.source,
          title_english: patch.title_english ?? prev.title_english,
          description: patch.description ?? prev.description,
          season_year: patch.season_year ?? prev.season_year,
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync RAWG metadata');
    } finally {
      setSyncingIds(prev => prev.filter(id => id !== row.id));
    }
  };

  const saveAllDrafts = async () => {
    const entries = Object.entries(draftUpdatesById).map(([id, updates]) => ({
      rowId: Number(id),
      updates,
    }));
    if (!entries.length) return;

    setSavingAll(true);
    setError(null);
    setSuccessMessage(null);

    let successCount = 0;
    const failedRows: number[] = [];
    const failureMessages: string[] = [];

    for (const { rowId, updates } of entries) {
      try {
        const response = await fetch(`/api/admin/media/entries/${rowId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates }),
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          const message = payload?.error || `Failed to update entry ${rowId}`;
          failedRows.push(rowId);
          failureMessages.push(`#${rowId}: ${message}`);
          continue;
        }

        const updated = payload?.data as MediaRow | undefined;
        if (updated) {
          setRows(prev => prev.map(row => (row.id === rowId ? updated : row)));
        }

        setDraftUpdatesById(prev => {
          const next = { ...prev };
          delete next[rowId];
          return next;
        });

        successCount += 1;
      } catch (err) {
        failedRows.push(rowId);
        failureMessages.push(
          `#${rowId}: ${err instanceof Error ? err.message : 'Unexpected save error'}`,
        );
      }
    }

    if (failedRows.length > 0) {
      setError(
        `Saved ${successCount} rows. Failed rows: ${failedRows.join(', ')}. ${failureMessages.join(' | ')}`,
      );
    } else {
      setSuccessMessage(`Saved ${successCount} row(s) successfully.`);
    }

    setSavingAll(false);
  };

  const deleteRows = async (rowIds: number[]) => {
    if (rowIds.length === 0) return;
    setIsDeleting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const failedRows: number[] = [];
      const failureMessages: string[] = [];
      let deletedCount = 0;

      for (const rowId of rowIds) {
        const response = await fetch(`/api/admin/media/entries/${rowId}`, {
          method: 'DELETE',
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          failedRows.push(rowId);
          failureMessages.push(`#${rowId}: ${payload?.error || `Failed to delete entry ${rowId}`}`);
          continue;
        }

        deletedCount += 1;
      }

      const deletedSet = new Set(rowIds.filter(id => !failedRows.includes(id)));
      if (deletedSet.size > 0) {
        setRows(prev => prev.filter(row => !deletedSet.has(row.id)));
        setDraftUpdatesById(prev => {
          const next = { ...prev };
          for (const id of deletedSet) {
            delete next[id];
          }
          return next;
        });
        setSelectedRowIds(prev => prev.filter(id => !deletedSet.has(id)));
      }

      if (editingId !== null && deletedSet.has(editingId)) {
        resetEdit();
      }

      if (failedRows.length > 0) {
        setError(
          `Deleted ${deletedCount} row(s). Failed rows: ${failedRows.join(', ')}. ${failureMessages.join(' | ')}`,
        );
      } else {
        setSuccessMessage(
          deletedCount === 1
            ? `Deleted entry ${rowIds[0]}.`
            : `Deleted ${deletedCount} selected entries.`,
        );
      }

      setDeleteTarget(null);
      setBulkDeleteIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entries');
    } finally {
      setIsDeleting(false);
    }
  };

  const hasRows = rows.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-foreground">Data Curation</CardTitle>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => setBulkDeleteIds(selectedRowIds)}
              disabled={selectedCount === 0 || isDeleting}
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'Deleting...' : `Delete Selected (${selectedCount})`}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={saveAllDrafts}
              disabled={draftCount === 0 || savingAll}
            >
              <Save className="h-4 w-4" />
              {savingAll ? 'Saving...' : `Save Table (${draftCount})`}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-5">
          <Select
            label="Source"
            value={filters.source}
            onChange={value => {
              setPage(1);
              setFilters(prev => ({ ...prev, source: value }));
            }}
            options={['', ...(meta?.filters.source ?? [])]}
            placeholder="All"
          />
          <Select
            label="Category"
            value={filters.category}
            onChange={value => {
              setPage(1);
              setFilters(prev => ({ ...prev, category: value }));
            }}
            options={['', ...(meta?.filters.category ?? [])]}
            placeholder="All"
          />
          <Select
            label="Status"
            value={filters.status}
            onChange={value => {
              setPage(1);
              setFilters(prev => ({ ...prev, status: value }));
            }}
            options={['', ...(meta?.filters.status ?? [])]}
            placeholder="All"
          />
          <Select
            label="Format"
            value={filters.format}
            onChange={value => {
              setPage(1);
              setFilters(prev => ({ ...prev, format: value }));
            }}
            options={['', ...(meta?.filters.format ?? [])]}
            placeholder="All"
          />
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Search</label>
            <div className="flex items-center gap-2">
              <Input
                value={filters.q}
                onChange={event => {
                  setPage(1);
                  setFilters(prev => ({ ...prev, q: event.target.value }));
                }}
                placeholder="Title or description"
              />
              <Button type="button" variant="secondary" size="icon" aria-label="Search">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {error ? <ErrorAlert message={error} /> : null}
        {successMessage ? (
          <p className="text-sm font-medium text-emerald-400">{successMessage}</p>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : !hasRows ? (
          <EmptyState title="No media entries" description="Try changing filters or search text." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[48px]">
                    <Checkbox
                      checked={hasRows && rows.every(row => selectedRowIds.includes(row.id))}
                      onCheckedChange={checked => {
                        setSelectedRowIds(checked === true ? rows.map(row => row.id) : []);
                      }}
                      aria-label="Select all rows"
                      disabled={!hasRows}
                    />
                  </TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Title (EN)</TableHead>
                  <TableHead>Romaji</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Episodes</TableHead>
                  <TableHead>Release</TableHead>
                  <TableHead>Runtime</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Metacritic</TableHead>
                  <TableHead>ESRB</TableHead>
                  <TableHead>RAWG ID</TableHead>
                  <TableHead>Steam App ID</TableHead>
                  <TableHead>Developer</TableHead>
                  <TableHead>Publisher</TableHead>
                  <TableHead>Platforms</TableHead>
                  <TableHead>Genres</TableHead>
                  <TableHead>Cover (M)</TableHead>
                  <TableHead>Cover (L)</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(row => {
                  const isEditing = editingId === row.id;
                  const isGame = row.category === 'games';
                  const isSyncing = syncingIds.includes(row.id);
                  const hasDraft = Boolean(draftUpdatesById[row.id]);

                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRowIds.includes(row.id)}
                          onCheckedChange={checked => {
                            setSelectedRowIds(prev =>
                              checked === true
                                ? prev.includes(row.id)
                                  ? prev
                                  : [...prev, row.id]
                                : prev.filter(id => id !== row.id),
                            );
                          }}
                          aria-label={`Select row ${row.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{row.id}</span>
                          {hasDraft ? (
                            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-primary">
                              Draft
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{row.category}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editingState.source ?? ''}
                            onChange={event =>
                              setEditingState(prev => ({ ...prev, source: event.target.value }))
                            }
                          />
                        ) : (
                          (row.source ?? '-')
                        )}
                      </TableCell>
                      <TableCell className="min-w-[220px]">{row.title ?? '-'}</TableCell>
                      <TableCell className="min-w-[220px]">
                        {isEditing ? (
                          <Input
                            value={editingState.title_english ?? ''}
                            onChange={event =>
                              setEditingState(prev => ({
                                ...prev,
                                title_english: event.target.value,
                              }))
                            }
                          />
                        ) : (
                          (row.title_english ?? '-')
                        )}
                      </TableCell>
                      <TableCell className="min-w-[180px]">
                        {isEditing ? (
                          <Input
                            value={editingState.title_romaji ?? ''}
                            onChange={event =>
                              setEditingState(prev => ({
                                ...prev,
                                title_romaji: event.target.value,
                              }))
                            }
                          />
                        ) : (
                          (row.title_romaji ?? '-')
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editingState.status ?? ''}
                            onChange={event =>
                              setEditingState(prev => ({ ...prev, status: event.target.value }))
                            }
                          />
                        ) : (
                          (row.status ?? '-')
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editingState.format ?? ''}
                            onChange={event =>
                              setEditingState(prev => ({ ...prev, format: event.target.value }))
                            }
                          />
                        ) : (
                          (row.format ?? '-')
                        )}
                      </TableCell>
                      <TableCell className="w-[120px]">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editingState.season_year ?? ''}
                            onChange={event =>
                              setEditingState(prev => ({
                                ...prev,
                                season_year: event.target.value ? Number(event.target.value) : null,
                              }))
                            }
                          />
                        ) : (
                          (row.season_year ?? '-')
                        )}
                      </TableCell>
                      <TableCell className="w-[120px]">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editingState.episodes ?? ''}
                            onChange={event =>
                              setEditingState(prev => ({
                                ...prev,
                                episodes: event.target.value ? Number(event.target.value) : null,
                              }))
                            }
                          />
                        ) : (
                          (row.episodes ?? '-')
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{row.release_date ?? '-'}</TableCell>
                      <TableCell>{row.runtime ?? '-'}</TableCell>
                      <TableCell>{row.rating ?? '-'}</TableCell>
                      <TableCell>{row.metacritic ?? '-'}</TableCell>
                      <TableCell>{row.esrb_rating ?? '-'}</TableCell>
                      <TableCell>{row.rawg_id ?? '-'}</TableCell>
                      <TableCell>{row.steam_app_id ?? '-'}</TableCell>
                      <TableCell className="min-w-[160px]">{row.developer ?? '-'}</TableCell>
                      <TableCell className="min-w-[160px]">{row.publisher ?? '-'}</TableCell>
                      <TableCell className="min-w-[220px]">
                        <span className="line-clamp-3">
                          {(row.platforms ?? []).length ? (row.platforms ?? []).join(', ') : '-'}
                        </span>
                      </TableCell>
                      <TableCell className="min-w-[220px]">
                        <span className="line-clamp-3">
                          {(row.genres ?? []).length ? (row.genres ?? []).join(', ') : '-'}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <span className="line-clamp-2 break-all">
                          {row.cover_image_medium ?? '-'}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <span className="line-clamp-2 break-all">
                          {row.cover_image_large ?? '-'}
                        </span>
                      </TableCell>
                      <TableCell className="min-w-[320px]">
                        {isEditing ? (
                          <Textarea
                            rows={4}
                            value={editingState.description ?? ''}
                            onChange={event =>
                              setEditingState(prev => ({
                                ...prev,
                                description: event.target.value,
                              }))
                            }
                          />
                        ) : (
                          <span className="line-clamp-3">{row.description ?? '-'}</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {row.updated_at ? new Date(row.updated_at).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-2">
                            {isGame ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => syncRawgPreviewForRow(row)}
                                disabled={isSyncing || savingId === row.id}
                              >
                                <RefreshCw
                                  className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`}
                                />
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeleteTarget(row)}
                              disabled={savingId === row.id || isDeleting}
                              title="Delete entry"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={resetEdit}
                              disabled={savingId === row.id}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => saveRow(row.id)}
                              disabled={savingId === row.id}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            {isGame ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => syncRawgPreviewForRow(row)}
                                disabled={isSyncing}
                                title="Sync metadata preview from RAWG"
                              >
                                <RefreshCw
                                  className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`}
                                />
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeleteTarget(row)}
                              disabled={isDeleting}
                              title="Delete entry"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => startEditing(row)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            Total entries: <span className="font-medium text-foreground">{meta?.total ?? 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>

      <AlertDialog
        open={Boolean(deleteTarget) || bulkDeleteIds.length > 0}
        onOpenChange={open => {
          if (!open) {
            setDeleteTarget(null);
            setBulkDeleteIds([]);
          }
        }}
      >
        <AlertDialogContent className="border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkDeleteIds.length > 0 ? 'Delete selected media entries' : 'Delete media entry'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {bulkDeleteIds.length > 0
                ? `This will permanently delete ${bulkDeleteIds.length} selected entr${bulkDeleteIds.length === 1 ? 'y' : 'ies'} from media_items and remove linked user entries.`
                : deleteTarget
                  ? `This will permanently delete "${deleteTarget.title_english ?? deleteTarget.title ?? `ID ${deleteTarget.id}`}" from media_items and remove linked user entries.`
                  : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={event => {
                event.preventDefault();
                if (bulkDeleteIds.length > 0) {
                  void deleteRows(bulkDeleteIds);
                  return;
                }
                if (deleteTarget) {
                  void deleteRows([deleteTarget.id]);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:brightness-110"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
