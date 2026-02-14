'use client';

import { useEffect, useMemo, useState } from 'react';

import { CoverHeroImage } from '@/components/ui/cover-image';

import { Heart, Star, CheckCircle, XCircle } from 'lucide-react';

import { PageContainer } from '@/app/components/layout';

import { Button } from '@/components/ui/button';

import { Spinner } from '@/components/ui/spinner';

import EmptyState from '@/components/ui/empty';

import { Alert, AlertDescription, AlertTitle, ErrorAlert } from '@/components/ui/alert';

import MediaEntryDialogController from '@/app/components/media/MediaEntryDialogController';

import Breadcrumbs from '@/components/ui/breadcrumbs';

import type { EditState } from '@/app/components/backlog/EntryEditDialog';

import { yieldToMain } from '@/lib/performance';

import {
  CATEGORY_CONFIG,
  getApiBase,
  type MediaCategory,
  type MediaEntry,
  type SearchResult,
} from '@/app/components/backlog/types';

import type { MediaEntryState, MediaItem } from '@/lib/media/types';

type AlertState = {
  type: 'success' | 'error';

  title: string;

  message: string;
} | null;

type MediaDetailPageClientProps = {
  category: MediaCategory;

  mediaItem: MediaItem;
};

const resolveTitle = (item: MediaItem) =>
  item.title ||
  item.title_english ||
  item.title_romaji ||
  item.title_native ||
  item.original_title ||
  'Untitled';

const resolveSubtitle = (item: MediaItem, title: string) => {
  const candidates = [
    item.original_title,

    item.title_romaji,

    item.title_english,

    item.title_native,
  ];

  return candidates.find(value => value && value !== title) || '';
};

const resolveYear = (item: MediaItem) =>
  item.season_year?.toString() ||
  item.release_date?.slice(0, 4) ||
  item.first_air_date?.slice(0, 4) ||
  item.start_date?.slice(0, 4) ||
  undefined;

const getMetaInfoCard = ({
  category,

  media,
}: {
  category: MediaCategory;

  media: MediaItem;
}): { label: string; value: string } => {
  if (category === 'games') {
    return {
      label: 'Platforms',

      value: media.platforms && media.platforms.length > 0 ? media.platforms.join(', ') : '—',
    };
  }

  if (category === 'movies') {
    return {
      label: 'Duration',

      value: media.runtime ? `${media.runtime} min` : '—',
    };
  }

  if (category === 'anime' || category === 'tv') {
    const episodes = media.episodes ?? media.number_of_episodes ?? null;

    return {
      label: 'Episodes',

      value: episodes ? `${episodes} episodes` : '—',
    };
  }

  if (category === 'books') {
    return {
      label: 'Pages',

      value: media.page_count ? `${media.page_count} pages` : '—',
    };
  }

  if (category === 'manga') {
    if (media.chapters) {
      return { label: 'Chapters', value: `${media.chapters} chapters` };
    }

    if (media.volumes) {
      return { label: 'Volumes', value: `${media.volumes} volumes` };
    }
  }

  return { label: 'Info', value: '—' };
};

const buildEntry = (item: MediaItem, entryState: MediaEntryState | null) => {
  const title = resolveTitle(item);

  const subtitle = resolveSubtitle(item, title);

  const year = resolveYear(item);

  const cover = item.cover_image_large || item.cover_image_medium || '/og-image.png';

  return {
    id: `media-${item.id}`,

    entryId: entryState?.entryId,

    mediaId: item.id,

    status: entryState?.status ?? 'planned',

    isFavorite: entryState?.favorite ?? false,

    score:
      entryState?.rating !== null && entryState?.rating !== undefined ? `${entryState.rating}` : '',

    progress: entryState?.progress ?? undefined,

    notes: entryState?.notes ?? undefined,

    selectedPlatform: entryState?.selectedPlatform ?? undefined,

    title,

    subtitle,

    year,

    tags: item.genres ?? [],

    cover,

    totalEpisodes: item.episodes ?? item.number_of_episodes ?? undefined,

    totalChapters: item.chapters ?? undefined,

    totalVolumes: item.volumes ?? undefined,

    totalRuntime: item.runtime ?? undefined,

    totalPages: item.page_count ?? undefined,

    format: item.format ?? undefined,

    description: item.description ?? undefined,

    runtime: item.runtime ?? undefined,

    platforms: item.platforms ?? undefined,

    developer: item.developer ?? undefined,

    publisher: item.publisher ?? undefined,

    metacritic: item.metacritic ?? undefined,
  } as MediaEntry & Partial<SearchResult>;
};

export default function MediaDetailPageClient({
  category,

  mediaItem,
}: Readonly<MediaDetailPageClientProps>) {
  const [entryState, setEntryState] = useState<MediaEntryState | null>(null);

  const [entryLoading, setEntryLoading] = useState(true);

  const [entryError, setEntryError] = useState<string | null>(null);

  const [dialogEntry, setDialogEntry] = useState<(MediaEntry & Partial<SearchResult>) | null>(null);

  const [alert, setAlert] = useState<AlertState>(null);

  const [actionLoading, setActionLoading] = useState(false);

  const apiBase = getApiBase(category);

  const config = CATEGORY_CONFIG[category];

  const baseEntry = useMemo(() => buildEntry(mediaItem, entryState), [mediaItem, entryState]);

  const hasEntry = Boolean(entryState?.entryId);

  const metaCard = getMetaInfoCard({ category, media: mediaItem });

  const refreshEntry = async () => {
    if (!mediaItem.id) return;

    setEntryLoading(true);

    setEntryError(null);

    try {
      const response = await fetch(
        `/api/media/entry?category=${encodeURIComponent(category)}&mediaId=${mediaItem.id}`,
      );

      if (response.status === 401) {
        setEntryState(null);

        return;
      }

      if (!response.ok) {
        throw new Error('Entry fetch failed');
      }

      const data = (await response.json()) as { entry?: MediaEntryState | null };

      setEntryState(data.entry ?? null);
    } catch (error) {
      console.warn('Entry fetch failed:', error);

      setEntryError('Failed to fetch entry data.');
    } finally {
      setEntryLoading(false);
    }
  };

  useEffect(() => {
    refreshEntry();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, mediaItem.id]);

  const openDialog = (overrides?: Partial<MediaEntry>) => {
    setDialogEntry({
      ...baseEntry,

      ...overrides,

      source: 'local',

      mediaId: mediaItem.id,
    });
  };

  const handleSaveEntry = async (editState: EditState) => {
    if (!apiBase) return;

    // Close dialog immediately for instant feedback (improves INP)

    setDialogEntry(null);

    setActionLoading(true);

    // Yield to allow browser to paint the closed dialog

    await yieldToMain();

    try {
      const progressValue = Number.parseInt(editState.progress, 10);

      const scoreValue = Number.parseFloat(editState.score);

      const nextProgress = Number.isFinite(progressValue) ? progressValue : null;

      const nextScore = Number.isFinite(scoreValue) ? scoreValue : null;

      const nextNotes = editState.notes || null;

      if (hasEntry) {
        const response = await fetch(`${apiBase}/library`, {
          method: 'PATCH',

          headers: { 'Content-Type': 'application/json' },

          body: JSON.stringify({
            mediaId: mediaItem.id,

            status: editState.status,

            is_favorite: editState.isFavorite,

            selected_platform:
              category === 'games' ? editState.selectedPlatform || null : undefined,

            progress: nextProgress,

            score: nextScore,

            notes: nextNotes,
          }),
        });

        if (!response.ok) {
          throw new Error('Update failed');
        }
      } else {
        const response = await fetch(`${apiBase}/add`, {
          method: 'POST',

          headers: { 'Content-Type': 'application/json' },

          body: JSON.stringify({
            source: 'local',

            mediaId: mediaItem.id,

            status: editState.status,

            is_favorite: editState.isFavorite,

            progress: nextProgress ?? undefined,

            score: nextScore ?? undefined,

            notes: nextNotes,
          }),
        });

        if (!response.ok) {
          throw new Error('Add failed');
        }
      }

      // Defer expensive refresh operation

      await yieldToMain();

      await refreshEntry();

      setAlert({
        type: 'success',

        title: 'Entry saved',

        message: 'Your library entry was saved successfully.',
      });
    } catch (error) {
      console.warn('Save entry failed:', error);

      setAlert({
        type: 'error',

        title: 'Error',

        message: 'Failed to save entry. Please try again.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEntry = async (entry: MediaEntry) => {
    if (!apiBase || !entry.mediaId) {
      setEntryState(null);

      return;
    }

    setActionLoading(true);

    try {
      const response = await fetch(`${apiBase}/library`, {
        method: 'DELETE',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ mediaId: entry.mediaId }),
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      setEntryState(null);

      setAlert({
        type: 'success',

        title: 'Entry removed',

        message: 'The library entry was removed.',
      });
    } catch (error) {
      console.warn('Delete entry failed:', error);

      setAlert({
        type: 'error',

        title: 'Error',

        message: 'Failed to delete entry. Please try again.',
      });
    } finally {
      setActionLoading(false);

      setDialogEntry(null);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!apiBase) return;

    if (!hasEntry) {
      openDialog({ isFavorite: true });

      return;
    }

    setActionLoading(true);

    // Yield to allow browser to paint the loading state

    await yieldToMain();

    try {
      const response = await fetch(`${apiBase}/library`, {
        method: 'PATCH',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({
          mediaId: mediaItem.id,

          is_favorite: !(entryState?.favorite ?? false),
        }),
      });

      if (!response.ok) {
        throw new Error('Favorite toggle failed');
      }

      // Defer expensive refresh operation

      await yieldToMain();

      await refreshEntry();
    } catch (error) {
      console.warn('Favorite toggle failed:', error);

      setAlert({
        type: 'error',

        title: 'Error',

        message: 'Could not update favorite status. Please try again.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const statusLabel = hasEntry
    ? baseEntry.status === 'planned'
      ? config.plannedLabel
      : baseEntry.status === 'current'
        ? config.currentLabel
        : baseEntry.status === 'completed'
          ? config.completedLabel
          : config.droppedLabel
    : 'Not added to a status yet';

  const ratingLabel =
    entryState?.rating !== null && entryState?.rating !== undefined
      ? entryState.rating.toFixed(1)
      : '';

  const categoryLabel = CATEGORY_CONFIG[category]?.title || category;

  const breadcrumbs = [
    { label: 'Home', href: '/dashboard' },

    { label: 'Library', href: '/pages/backlog' },

    { label: categoryLabel, href: `/pages/backlog?category=${category}` },

    { label: baseEntry.title },
  ];

  return (
    <PageContainer size="xl" className="py-10">
      {alert && (
        <Alert
          key={`${alert.type}-${alert.title}`}
          variant={alert.type === 'error' ? 'destructive' : 'success'}
          className="mb-6"
        >
          {alert.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}

          <AlertTitle>{alert.title}</AlertTitle>

          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <Breadcrumbs items={breadcrumbs} className="mb-6" />

      <div className="relative">
        <div className="absolute inset-0 -z-10 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,hsl(var(--primary)),transparent_50%)]" />

          <div className="absolute inset-y-10 right-0 w-1/2 bg-[radial-gradient(circle_at_80%_20%,hsl(var(--accent)),transparent_55%)]" />
        </div>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-md">
          <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
            <div className="relative mx-auto w-full max-w-[240px] rounded-2xl border border-border bg-card">
              <div className="relative aspect-[3/4]">
                <CoverHeroImage
                  src={baseEntry.cover}
                  alt={baseEntry.title}
                  sizes="(max-width: 768px) 60vw, 240px"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                  {category.toUpperCase()}
                </p>

                <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
                  {baseEntry.title}
                </h1>

                <p className="text-sm text-muted-foreground">
                  {baseEntry.subtitle}

                  {baseEntry.year ? `  ${baseEntry.year}` : ''}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {baseEntry.tags.length > 0 ? (
                  baseEntry.tags.slice(0, 8).map(tag => (
                    <span
                      key={tag}
                      className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">No genres available</span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-foreground">
                  {statusLabel}
                </span>

                <span className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
                  <Star className="h-3.5 w-3.5 text-primary" />

                  {ratingLabel}
                </span>

                <Button
                  type="button"
                  onClick={handleFavoriteToggle}
                  disabled={actionLoading}
                  variant={entryState?.favorite ? 'primary' : 'secondary'}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold`}
                >
                  <Heart className="h-3.5 w-3.5" />

                  {entryState?.favorite ? 'Remove favorite' : 'Add to favorites'}
                </Button>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  className="rounded-full px-6"
                  onClick={() => (hasEntry ? openDialog() : openDialog({ status: 'planned' }))}
                  disabled={actionLoading}
                >
                  {hasEntry ? 'Update entry' : 'Add to backlog'}
                </Button>
              </div>

              {entryLoading && (
                <div className="inline-flex items-center gap-2">
                  <Spinner className="size-4" />

                  <span className="text-sm text-muted-foreground">Fetching entry data...</span>
                </div>
              )}

              {entryError && <ErrorAlert message={entryError} />}

              {!entryLoading && !entryError && !hasEntry && (
                <div className="max-w-sm">
                  <EmptyState
                    title="No entry yet."
                    description="Add this media to your backlog to track progress."
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6">
          <section className="rounded-3xl border border-border bg-card p-6 shadow-md">
            <h2 className="text-lg font-semibold text-foreground">Overview</h2>

            <div className="mt-3 text-sm leading-relaxed text-foreground/90">
              {mediaItem.description ? (
                <p className="whitespace-pre-line">{mediaItem.description}</p>
              ) : (
                <p className="text-muted-foreground">No description available.</p>
              )}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Format</p>

                <p className="mt-2 text-sm text-foreground">{mediaItem.format || ''}</p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  {metaCard.label}
                </p>

                <p className="mt-2 text-sm text-foreground">{metaCard.value}</p>
              </div>

              {category === 'games' &&
                (baseEntry.platforms || baseEntry.developer || baseEntry.publisher) && (
                  <div className="rounded-2xl border border-border bg-card p-4 sm:col-span-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      Game details
                    </p>

                    <div className="mt-2 space-y-1 text-sm text-foreground">
                      {baseEntry.platforms && baseEntry.platforms.length > 0 && (
                        <p>Platforms: {baseEntry.platforms.slice(0, 5).join(', ')}</p>
                      )}

                      {baseEntry.developer && <p>Developer: {baseEntry.developer}</p>}

                      {baseEntry.publisher && <p>Publisher: {baseEntry.publisher}</p>}
                    </div>
                  </div>
                )}
            </div>
          </section>
        </div>
      </div>

      <MediaEntryDialogController
        category={category}
        entry={dialogEntry}
        onClose={() => setDialogEntry(null)}
        onSave={handleSaveEntry}
        onDelete={handleDeleteEntry}
      />
    </PageContainer>
  );
}
