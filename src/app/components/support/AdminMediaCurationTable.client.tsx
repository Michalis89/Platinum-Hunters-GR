'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Pencil, Save, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SelectField as Select } from '@/components/ui/select-field';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ErrorAlert } from '@/components/ui/alert';
import EmptyState from '@/components/ui/empty';
import { Textarea } from '@/components/ui/textarea';
import { useLocale } from '@/context/LocaleContext';
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
import {
  getIgdbCategoryLabel,
  isExcludedByTitleOrSlug,
  isAllowedIgdbCategory,
} from '@/lib/igdb/categories';

type MediaRow = {
  id: number;
  category: string;
  source: string | null;
  title: string | null;
  title_english: string | null;
  description: string | null;
  status: string | null;
  season_year: number | null;
  release_date: string | null;
  first_release_date: string | null;
  igdb_id: number | null;
  igdb_category: number | null;
  igdb_slug: string | null;
  steam_app_id: number | null;
  developer: string | null;
  publisher: string | null;
  platforms: string[] | null;
  genres: string[] | null;
  igdb_themes: string[] | null;
  igdb_game_modes: string[] | null;
  igdb_player_perspectives: string[] | null;
  igdb_artwork_image_ids: string[] | null;
  igdb_screenshot_image_ids: string[] | null;
  official_website: string | null;
  cover_url_thumb: string | null;
  cover_url_big: string | null;
  cover_image_medium: string | null;
  cover_image_large: string | null;
  created_at: string | null;
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

type EditingState = {
  source?: MediaRow['source'];
  title_english?: MediaRow['title_english'];
  description?: MediaRow['description'];
  status?: MediaRow['status'];
  season_year?: MediaRow['season_year'];
  release_date?: MediaRow['release_date'];
  igdb_id?: MediaRow['igdb_id'];
  igdb_slug?: MediaRow['igdb_slug'];
  platforms?: string[];
  genres?: string[];
};

type AdminRowUpdate = EditingState & {
  developer?: string | null;
  publisher?: string | null;
  platforms?: string[];
  genres?: string[];
  cover_url_big?: string | null;
  cover_url_thumb?: string | null;
  cover_image_large?: string | null;
  cover_image_medium?: string | null;
  official_website?: string | null;
};

type TmdbImportResult = {
  category: 'movies' | 'tv';
  requested: number;
  inserted: number;
  skippedExisting: number;
  failed: number;
  pagesScanned: number;
  startPage: number;
  nextCursorPage: number;
  reachedTarget: boolean;
};

type MalImportResult = {
  category: 'anime' | 'manga';
  requested: number;
  inserted: number;
  skippedExisting: number;
  failed: number;
  pagesScanned: number;
  startOffset: number;
  nextCursorOffset: number;
  reachedTarget: boolean;
};

type BooksImportResult = {
  category: 'books';
  requested: number;
  query: string;
  inserted: number;
  skippedExisting: number;
  failed: number;
  pagesScanned: number;
  startOffset: number;
  nextCursorOffset: number;
  reachedTarget: boolean;
};

type IgdbImportResult = {
  category: 'games';
  requested: number;
  fetchedCandidates: number;
  inserted: number;
  skippedExisting: number;
  skippedUnsupported: number;
  failed: number;
  pagesScanned: number;
  startOffset: number;
  nextCursorOffset: number;
  reachedTarget: boolean;
};

const DEFAULT_LIMIT = 20;
const NEW_WINDOW_DAYS = 7;
const BOOKS_SUBJECT_OPTIONS = [
  'subject:fiction',
  'subject:fantasy',
  'subject:science_fiction',
  'subject:mystery',
  'subject:thriller',
  'subject:horror',
  'subject:romance',
  'subject:history',
  'subject:biography',
  'subject:self-help',
  'subject:business',
  'subject:psychology',
  'subject:philosophy',
  'subject:science',
  'subject:technology',
  'subject:art',
  'subject:comics',
  'subject:young_adult',
  'custom',
] as const;

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

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function summarizeFacet(values: string[] | null | undefined): string {
  const list = Array.isArray(values) ? values.filter(Boolean) : [];
  if (list.length === 0) {
    return '-';
  }
  const preview = list.slice(0, 3);
  const overflow = list.length - preview.length;
  return overflow > 0 ? `${preview.join(', ')} +${overflow}` : preview.join(', ');
}

function parseListInput(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(',')
        .map(item => item.trim())
        .filter(Boolean),
    ),
  );
}

function isRecentDate(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) {
    return false;
  }
  const cutoff = Date.now() - NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return time >= cutoff;
}

function getExcludedReason(row: MediaRow): string | null {
  if (row.category !== 'games') {
    return null;
  }
  if (typeof row.igdb_category === 'number' && !isAllowedIgdbCategory(row.igdb_category)) {
    return getIgdbCategoryLabel(row.igdb_category);
  }
  if (isExcludedByTitleOrSlug(row.title_english ?? row.title, row.igdb_slug)) {
    return 'heuristic';
  }
  return null;
}

export default function AdminMediaCurationTable() {
  const locale = useLocale();
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
  const [syncingSelected, setSyncingSelected] = useState(false);
  const [syncProgress, setSyncProgress] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [draftUpdatesById, setDraftUpdatesById] = useState<Record<number, AdminRowUpdate>>({});
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<MediaRow | null>(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [onlyNew, setOnlyNew] = useState(false);
  const [catalogImportCategory, setCatalogImportCategory] = useState<'movies' | 'tv'>('movies');
  const [catalogImportCount, setCatalogImportCount] = useState('200');
  const [isImportingCatalog, setIsImportingCatalog] = useState(false);
  const [malImportCategory, setMalImportCategory] = useState<'anime' | 'manga'>('anime');
  const [malImportCount, setMalImportCount] = useState('200');
  const [isImportingMalCatalog, setIsImportingMalCatalog] = useState(false);
  const [booksImportCount, setBooksImportCount] = useState('200');
  const [booksImportQuery, setBooksImportQuery] = useState('subject:fiction');
  const [booksImportSubject, setBooksImportSubject] =
    useState<(typeof BOOKS_SUBJECT_OPTIONS)[number]>('subject:fiction');
  const [isImportingBooksCatalog, setIsImportingBooksCatalog] = useState(false);
  const [igdbImportCount, setIgdbImportCount] = useState('200');
  const [isImportingIgdbCatalog, setIsImportingIgdbCatalog] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('limit', `${DEFAULT_LIMIT}`);
    params.set('offset', `${(page - 1) * DEFAULT_LIMIT}`);
    if (onlyNew) {
      params.set('only_new', '1');
    }
    for (const [key, value] of Object.entries(filters)) {
      if (value.trim()) {
        params.set(key, value.trim());
      }
    }
    return params.toString();
  }, [filters, onlyNew, page]);

  const totalPages = Math.max(1, Math.ceil((meta?.total ?? 0) / DEFAULT_LIMIT));
  const draftCount = Object.keys(draftUpdatesById).length;
  const selectedCount = selectedRowIds.length;
  const selectedSyncableGameRows = useMemo(
    () =>
      rows.filter(
        row =>
          selectedRowIds.includes(row.id) &&
          row.category === 'games' &&
          getExcludedReason(row) === null,
      ),
    [rows, selectedRowIds],
  );
  const visibleRows = rows;

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
      description: row.description,
      status: row.status,
      season_year: row.season_year,
      release_date: row.release_date,
      igdb_id: row.igdb_id,
      igdb_slug: row.igdb_slug,
      platforms: row.platforms ?? [],
      genres: row.genres ?? [],
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

  const syncIgdbForRow = async (row: MediaRow) => {
    if (row.category !== 'games' || getExcludedReason(row) !== null) {
      return;
    }
    setError(null);
    setSuccessMessage(null);
    setSyncingIds(prev => (prev.includes(row.id) ? prev : [...prev, row.id]));
    try {
      const response = await fetch('/api/media/entry', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply_igdb_metadata_patch',
          category: 'games',
          mediaId: row.id,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to sync from IGDB');
      }

      await fetchRows();
      setSuccessMessage(`Synced game #${row.id} from IGDB.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync from IGDB');
    } finally {
      setSyncingIds(prev => prev.filter(id => id !== row.id));
    }
  };

  const syncSelectedFromIgdb = async () => {
    if (selectedSyncableGameRows.length === 0) {
      return;
    }
    setSyncingSelected(true);
    setError(null);
    setSuccessMessage(null);

    const ids = selectedSyncableGameRows.map(row => row.id);
    const batches = chunk(ids, 10);
    let completed = 0;
    let failed = 0;

    try {
      for (const batch of batches) {
        const queue = [...batch];
        const workers = [0, 1].map(async () => {
          while (queue.length > 0) {
            const mediaId = queue.shift();
            if (!mediaId) {
              return;
            }
            setSyncingIds(prev => (prev.includes(mediaId) ? prev : [...prev, mediaId]));

            try {
              const response = await fetch('/api/media/entry', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'apply_igdb_metadata_patch',
                  category: 'games',
                  mediaId,
                }),
              });
              if (!response.ok) {
                failed += 1;
              }
            } catch {
              failed += 1;
            } finally {
              completed += 1;
              setSyncProgress(`Synced ${completed}/${ids.length} selected games...`);
              setSyncingIds(prev => prev.filter(id => id !== mediaId));
            }
          }
        });
        await Promise.all(workers);
      }

      await fetchRows();
      if (failed > 0) {
        setError(
          `IGDB sync finished with failures. Success: ${completed - failed}, Failed: ${failed}.`,
        );
      } else {
        setSuccessMessage(`Synced ${completed} selected game(s) from IGDB.`);
      }
    } finally {
      setSyncProgress(null);
      setSyncingSelected(false);
    }
  };

  const saveAllDrafts = async () => {
    const entries = Object.entries(draftUpdatesById).map(([id, updates]) => ({
      rowId: Number(id),
      updates,
    }));
    if (!entries.length) {
      return;
    }

    setSavingAll(true);
    setError(null);
    setSuccessMessage(null);

    let successCount = 0;
    const failedRows: number[] = [];
    for (const { rowId, updates } of entries) {
      try {
        const response = await fetch(`/api/admin/media/entries/${rowId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          failedRows.push(rowId);
          setError(payload?.error || `Failed row #${rowId}`);
          continue;
        }
        const updated = payload?.data as MediaRow | undefined;
        if (updated) {
          setRows(prev => prev.map(row => (row.id === rowId ? updated : row)));
        }
        successCount += 1;
      } catch {
        failedRows.push(rowId);
      }
    }

    setDraftUpdatesById({});
    if (failedRows.length > 0) {
      setError(`Saved ${successCount} rows. Failed rows: ${failedRows.join(', ')}.`);
    } else {
      setSuccessMessage(`Saved ${successCount} row(s) successfully.`);
    }
    setSavingAll(false);
  };

  const importTmdbCatalog = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsImportingCatalog(true);

    const requestedCount = Number.parseInt(catalogImportCount, 10);

    try {
      const response = await fetch('/api/admin/media/import/tmdb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: catalogImportCategory,
          count: Number.isFinite(requestedCount) ? requestedCount : 200,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        data?: TmdbImportResult;
        error?: string;
      } | null;

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.error || 'TMDB import failed');
      }

      const result = payload.data;
      const categoryLabel = result.category === 'tv' ? 'TV' : 'Movies';
      setSuccessMessage(
        `TMDB ${categoryLabel} import complete: inserted ${result.inserted}, skipped existing ${result.skippedExisting}, failed ${result.failed} (scanned ${result.pagesScanned} pages, cursor ${result.startPage} -> ${result.nextCursorPage}).`,
      );
      await fetchRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'TMDB import failed');
    } finally {
      setIsImportingCatalog(false);
    }
  };

  const importMalCatalog = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsImportingMalCatalog(true);

    const requestedCount = Number.parseInt(malImportCount, 10);

    try {
      const response = await fetch('/api/admin/media/import/mal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: malImportCategory,
          count: Number.isFinite(requestedCount) ? requestedCount : 200,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        data?: MalImportResult;
        error?: string;
      } | null;

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.error || 'MAL import failed');
      }

      const result = payload.data;
      const categoryLabel = result.category === 'manga' ? 'Manga' : 'Anime';
      setSuccessMessage(
        `MAL ${categoryLabel} import complete: inserted ${result.inserted}, skipped existing ${result.skippedExisting}, failed ${result.failed} (scanned ${result.pagesScanned} pages, cursor ${result.startOffset} -> ${result.nextCursorOffset}).`,
      );
      await fetchRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'MAL import failed');
    } finally {
      setIsImportingMalCatalog(false);
    }
  };

  const importBooksCatalog = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsImportingBooksCatalog(true);

    const requestedCount = Number.parseInt(booksImportCount, 10);

    try {
      const response = await fetch('/api/admin/media/import/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: Number.isFinite(requestedCount) ? requestedCount : 200,
          query: booksImportSubject === 'custom' ? booksImportQuery : booksImportSubject,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        data?: BooksImportResult;
        error?: string;
      } | null;

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.error || 'Books import failed');
      }

      const result = payload.data;
      setSuccessMessage(
        `Books import complete: inserted ${result.inserted}, skipped existing ${result.skippedExisting}, failed ${result.failed} (query "${result.query}", scanned ${result.pagesScanned} pages, cursor ${result.startOffset} -> ${result.nextCursorOffset}).`,
      );
      await fetchRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Books import failed');
    } finally {
      setIsImportingBooksCatalog(false);
    }
  };

  const importIgdbCatalog = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsImportingIgdbCatalog(true);

    const requestedCount = Number.parseInt(igdbImportCount, 10);

    try {
      const response = await fetch('/api/admin/media/import/igdb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: Number.isFinite(requestedCount) ? requestedCount : 200,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        data?: IgdbImportResult;
        error?: string;
      } | null;

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.error || 'IGDB import failed');
      }

      const result = payload.data;
      setSuccessMessage(
        `IGDB Games import complete: fetched ${result.fetchedCandidates}, inserted ${result.inserted}, skipped existing ${result.skippedExisting}, skipped unsupported ${result.skippedUnsupported}, failed ${result.failed} (scanned ${result.pagesScanned} pages, cursor ${result.startOffset} -> ${result.nextCursorOffset}).`,
      );
      await fetchRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'IGDB import failed');
    } finally {
      setIsImportingIgdbCatalog(false);
    }
  };

  const deleteRows = async (rowIds: number[]) => {
    if (rowIds.length === 0) {
      return;
    }
    setIsDeleting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const failedRows: number[] = [];
      let deletedCount = 0;
      for (const rowId of rowIds) {
        const response = await fetch(`/api/admin/media/entries/${rowId}`, { method: 'DELETE' });
        if (!response.ok) {
          failedRows.push(rowId);
          continue;
        }
        deletedCount += 1;
      }

      const deletedSet = new Set(rowIds.filter(id => !failedRows.includes(id)));
      if (deletedSet.size > 0) {
        setRows(prev => prev.filter(row => !deletedSet.has(row.id)));
        setSelectedRowIds(prev => prev.filter(id => !deletedSet.has(id)));
      }
      if (failedRows.length > 0) {
        setError(`Deleted ${deletedCount} row(s). Failed rows: ${failedRows.join(', ')}.`);
      } else {
        setSuccessMessage(
          deletedCount === 1
            ? `Deleted entry ${rowIds[0]}.`
            : `Deleted ${deletedCount} selected entries.`,
        );
      }

      setDeleteTarget(null);
      setBulkDeleteIds([]);
    } finally {
      setIsDeleting(false);
    }
  };

  const hasRows = visibleRows.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-foreground">Data Curation</CardTitle>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={syncSelectedFromIgdb}
              disabled={selectedSyncableGameRows.length === 0 || syncingSelected}
            >
              <RefreshCw className={`h-4 w-4 ${syncingSelected ? 'animate-spin' : ''}`} />
              {syncingSelected
                ? 'Syncing selected...'
                : `Sync selected from IGDB (${selectedSyncableGameRows.length})`}
            </Button>
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
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">TMDB Catalog Import</p>
            <p className="text-xs text-muted-foreground">
              Insert-only: new `tmdb_id + category` only, existing rows are skipped.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-[160px,160px,auto]">
            <Select
              label="Category"
              value={catalogImportCategory}
              onChange={value => setCatalogImportCategory(value === 'tv' ? 'tv' : 'movies')}
              options={['movies', 'tv']}
              optionLabels={{ movies: 'Movies', tv: 'TV' }}
            />
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Count</label>
              <Input
                type="number"
                min={1}
                max={500}
                value={catalogImportCount}
                onChange={event => setCatalogImportCount(event.target.value)}
                placeholder="200"
              />
            </div>
            <div className="flex items-end">
              <Button type="button" onClick={importTmdbCatalog} disabled={isImportingCatalog}>
                {isImportingCatalog ? 'Importing...' : 'Import from TMDB'}
              </Button>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">MAL Catalog Import</p>
            <p className="text-xs text-muted-foreground">
              Insert-only: new `mal_id + category` only, existing rows are skipped.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-[160px,160px,auto]">
            <Select
              label="Category"
              value={malImportCategory}
              onChange={value => setMalImportCategory(value === 'manga' ? 'manga' : 'anime')}
              options={['anime', 'manga']}
              optionLabels={{ anime: 'Anime', manga: 'Manga' }}
            />
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Count</label>
              <Input
                type="number"
                min={1}
                max={500}
                value={malImportCount}
                onChange={event => setMalImportCount(event.target.value)}
                placeholder="200"
              />
            </div>
            <div className="flex items-end">
              <Button type="button" onClick={importMalCatalog} disabled={isImportingMalCatalog}>
                {isImportingMalCatalog ? 'Importing...' : 'Import from MAL'}
              </Button>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">Google Books Catalog Import</p>
            <p className="text-xs text-muted-foreground">
              Insert-only: new `google_books_id + category` only, existing rows are skipped.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-[160px,220px,1fr,auto]">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Count</label>
              <Input
                type="number"
                min={1}
                max={500}
                value={booksImportCount}
                onChange={event => setBooksImportCount(event.target.value)}
                placeholder="200"
              />
            </div>
            <Select
              label="Subject"
              value={booksImportSubject}
              onChange={value =>
                setBooksImportSubject(
                  BOOKS_SUBJECT_OPTIONS.includes(value as (typeof BOOKS_SUBJECT_OPTIONS)[number])
                    ? (value as (typeof BOOKS_SUBJECT_OPTIONS)[number])
                    : 'subject:fiction',
                )
              }
              options={[...BOOKS_SUBJECT_OPTIONS]}
              optionLabels={{
                'subject:fiction': 'Fiction',
                'subject:fantasy': 'Fantasy',
                'subject:science_fiction': 'Science Fiction',
                'subject:mystery': 'Mystery',
                'subject:thriller': 'Thriller',
                'subject:horror': 'Horror',
                'subject:romance': 'Romance',
                'subject:history': 'History',
                'subject:biography': 'Biography',
                'subject:self-help': 'Self Help',
                'subject:business': 'Business',
                'subject:psychology': 'Psychology',
                'subject:philosophy': 'Philosophy',
                'subject:science': 'Science',
                'subject:technology': 'Technology',
                'subject:art': 'Art',
                'subject:comics': 'Comics',
                'subject:young_adult': 'Young Adult',
                custom: 'Custom Query',
              }}
            />
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Query</label>
              <Input
                value={booksImportQuery}
                onChange={event => setBooksImportQuery(event.target.value)}
                placeholder="subject:fiction"
                disabled={booksImportSubject !== 'custom'}
              />
            </div>
            <div className="flex items-end">
              <Button type="button" onClick={importBooksCatalog} disabled={isImportingBooksCatalog}>
                {isImportingBooksCatalog ? 'Importing...' : 'Import from Google Books'}
              </Button>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">IGDB Games Catalog Import</p>
            <p className="text-xs text-muted-foreground">
              Insert-only with game safety filters (allowed IGDB categories + heuristics).
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-[160px,auto]">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Count</label>
              <Input
                type="number"
                min={1}
                max={500}
                value={igdbImportCount}
                onChange={event => setIgdbImportCount(event.target.value)}
                placeholder="200"
              />
            </div>
            <div className="flex items-end">
              <Button type="button" onClick={importIgdbCatalog} disabled={isImportingIgdbCatalog}>
                {isImportingIgdbCatalog ? 'Importing...' : 'Import from IGDB'}
              </Button>
            </div>
          </div>
        </div>

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
            <Input
              value={filters.q}
              onChange={event => {
                setPage(1);
                setFilters(prev => ({ ...prev, q: event.target.value }));
              }}
              placeholder="Title or description"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={onlyNew ? 'primary' : 'secondary'}
            className="rounded-full"
            onClick={() => {
              setPage(1);
              setOnlyNew(prev => !prev);
            }}
          >
            {onlyNew ? 'Only New: ON' : 'Only New'}
          </Button>
          <span className="text-xs text-muted-foreground">New = last {NEW_WINDOW_DAYS} days</span>
        </div>

        {error ? <ErrorAlert message={error} /> : null}
        {successMessage ? (
          <p className="text-sm font-medium text-emerald-400">{successMessage}</p>
        ) : null}
        {syncProgress ? <p className="text-sm text-muted-foreground">{syncProgress}</p> : null}

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
                      checked={hasRows && visibleRows.every(row => selectedRowIds.includes(row.id))}
                      onCheckedChange={checked => {
                        setSelectedRowIds(checked === true ? visibleRows.map(row => row.id) : []);
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
                  <TableHead>Status</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Release</TableHead>
                  <TableHead>IGDB ID</TableHead>
                  <TableHead>IGDB Category</TableHead>
                  <TableHead>IGDB Slug</TableHead>
                  <TableHead>Cover</TableHead>
                  <TableHead>Official Site</TableHead>
                  <TableHead>Developer</TableHead>
                  <TableHead>Platforms</TableHead>
                  <TableHead>Genres</TableHead>
                  <TableHead>Themes</TableHead>
                  <TableHead>Modes</TableHead>
                  <TableHead>Perspectives</TableHead>
                  <TableHead>Media</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.map(row => {
                  const isEditing = editingId === row.id;
                  const isSyncing = syncingIds.includes(row.id);
                  const excludedReason = getExcludedReason(row);
                  const isNew = isRecentDate(row.created_at ?? row.updated_at);
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
                      <TableCell className="font-medium">{row.id}</TableCell>
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
                      <TableCell className="min-w-[220px]">
                        <div className="flex items-center gap-2">
                          <span>{row.title ?? '-'}</span>
                          {isNew ? (
                            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                              New
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
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
                      <TableCell className="whitespace-nowrap">
                        {isEditing ? (
                          <Input
                            value={editingState.release_date ?? ''}
                            onChange={event =>
                              setEditingState(prev => ({
                                ...prev,
                                release_date: event.target.value,
                              }))
                            }
                          />
                        ) : (
                          (row.release_date ?? row.first_release_date ?? '-')
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editingState.igdb_id ?? ''}
                            onChange={event =>
                              setEditingState(prev => ({
                                ...prev,
                                igdb_id: event.target.value ? Number(event.target.value) : null,
                              }))
                            }
                          />
                        ) : (
                          (row.igdb_id ?? '-')
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {typeof row.igdb_category === 'number'
                          ? getIgdbCategoryLabel(row.igdb_category)
                          : '-'}
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        {isEditing ? (
                          <Input
                            value={editingState.igdb_slug ?? ''}
                            onChange={event =>
                              setEditingState(prev => ({
                                ...prev,
                                igdb_slug: event.target.value,
                              }))
                            }
                            placeholder="slug-name"
                          />
                        ) : (
                          <span className="truncate">{row.igdb_slug ?? '-'}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.cover_url_thumb ||
                        row.cover_url_big ||
                        row.cover_image_medium ||
                        row.cover_image_large ? (
                          <Image
                            src={
                              row.cover_url_thumb ??
                              row.cover_url_big ??
                              row.cover_image_medium ??
                              row.cover_image_large ??
                              ''
                            }
                            alt={row.title_english ?? row.title ?? `Game ${row.id}`}
                            width={36}
                            height={48}
                            sizes="36px"
                            className="h-12 w-9 rounded object-cover"
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        {row.official_website ? (
                          <a
                            href={row.official_website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary underline"
                          >
                            {row.official_website}
                          </a>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{row.developer ?? '-'}</TableCell>
                      <TableCell className="min-w-[220px]">
                        {isEditing ? (
                          <Input
                            value={(editingState.platforms ?? []).join(', ')}
                            onChange={event =>
                              setEditingState(prev => ({
                                ...prev,
                                platforms: parseListInput(event.target.value),
                              }))
                            }
                            placeholder="PC, PlayStation 5, Xbox Series X|S"
                          />
                        ) : (row.platforms ?? []).length ? (
                          (row.platforms ?? []).join(', ')
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="min-w-[220px]">
                        {isEditing ? (
                          <Input
                            value={(editingState.genres ?? []).join(', ')}
                            onChange={event =>
                              setEditingState(prev => ({
                                ...prev,
                                genres: parseListInput(event.target.value),
                              }))
                            }
                            placeholder="Action, RPG, Adventure"
                          />
                        ) : (row.genres ?? []).length ? (
                          (row.genres ?? []).join(', ')
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="max-w-[240px]">
                        {summarizeFacet(row.igdb_themes)}
                      </TableCell>
                      <TableCell className="max-w-[240px]">
                        {summarizeFacet(row.igdb_game_modes)}
                      </TableCell>
                      <TableCell className="max-w-[240px]">
                        {summarizeFacet(row.igdb_player_perspectives)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {`A:${(row.igdb_artwork_image_ids ?? []).length} / S:${(row.igdb_screenshot_image_ids ?? []).length}`}
                      </TableCell>
                      <TableCell className="min-w-[320px]">
                        {isEditing ? (
                          <Textarea
                            rows={3}
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
                        {row.updated_at ? new Date(row.updated_at).toLocaleString(locale) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {row.category === 'games' ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => void syncIgdbForRow(row)}
                              disabled={isSyncing || excludedReason !== null}
                              title={
                                excludedReason
                                  ? `Excluded: ${excludedReason}`
                                  : 'Sync this item from IGDB'
                              }
                            >
                              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            </Button>
                          ) : null}
                          {excludedReason ? (
                            <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-300">
                              {`Excluded: ${excludedReason}`}
                            </span>
                          ) : null}
                          {isEditing ? (
                            <>
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
                                onClick={() => void saveRow(row.id)}
                                disabled={savingId === row.id}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => startEditing(row)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
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
                        </div>
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
                  ? `This will permanently delete "${deleteTarget.title_english ?? deleteTarget.title ?? `ID ${deleteTarget.id}`}".`
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
