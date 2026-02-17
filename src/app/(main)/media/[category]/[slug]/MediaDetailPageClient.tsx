'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Heart, Star, CheckCircle, XCircle, Plus, CalendarDays, Globe, Pencil } from 'lucide-react';
import { CoverHeroImage } from '@/components/ui/cover-image';
import { PageContainer } from '@/app/components/layout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import EmptyState from '@/components/ui/empty';
import { Alert, AlertDescription, AlertTitle, ErrorAlert } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
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

type GalleryImage = {
  id: string;
  src: string;
  alt: string;
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
  item.first_release_date?.slice(0, 4) ||
  undefined;

const igdbImageUrl = (imageId: string, size: 't_1080p' | 't_screenshot_big' = 't_1080p') =>
  `https://images.igdb.com/igdb/image/upload/${size}/${imageId}.jpg`;

const getStatusLabel = (category: MediaCategory, entry: MediaEntryState | null) => {
  if (!entry) {
    return 'Not in library';
  }
  const config = CATEGORY_CONFIG[category];
  if (entry.status === 'planned') {
    return config.plannedLabel;
  }
  if (entry.status === 'current') {
    return config.currentLabel;
  }
  if (entry.status === 'completed') {
    return config.completedLabel;
  }
  return config.droppedLabel;
};

const getProgressDisplay = (
  category: MediaCategory,
  entry: MediaEntryState | null,
  media: MediaItem,
): string => {
  if (!entry || typeof entry.progress !== 'number') {
    return '-';
  }

  if (category === 'games') {
    return `${entry.progress}h played`;
  }
  if (category === 'books') {
    const total = media.page_count ?? null;
    return total ? `${entry.progress} / ${total} pages` : `${entry.progress} pages`;
  }
  if (category === 'manga') {
    const total = media.volumes ?? media.chapters ?? null;
    return total ? `${entry.progress} / ${total}` : `${entry.progress}`;
  }
  if (category === 'movies') {
    const total = media.runtime ?? null;
    return total ? `${entry.progress} / ${total} min` : `${entry.progress} min`;
  }
  const total = media.episodes ?? media.number_of_episodes ?? null;
  return total ? `${entry.progress} / ${total} episodes` : `${entry.progress} episodes`;
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

function ScoreCluster({
  mediaItem,
  entryState,
}: {
  mediaItem: MediaItem;
  entryState: MediaEntryState | null;
}) {
  const scoreItems = [
    typeof entryState?.rating === 'number'
      ? { label: 'My rating', value: entryState.rating.toFixed(1), icon: '★' }
      : null,
    typeof mediaItem.aggregated_rating === 'number'
      ? { label: 'Aggregated', value: mediaItem.aggregated_rating.toFixed(1), icon: '☆' }
      : null,
    typeof mediaItem.metacritic === 'number'
      ? { label: 'Metacritic', value: `${mediaItem.metacritic}`, icon: 'M' }
      : null,
    typeof mediaItem.aggregated_rating_count === 'number'
      ? { label: 'Ratings', value: mediaItem.aggregated_rating_count.toLocaleString(), icon: '👥' }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string; icon: string }>;

  if (scoreItems.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {scoreItems.map(item => (
        <div key={item.label} className="rounded-xl border border-border/70 bg-card/70 p-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {item.label}
          </p>
          <p className="mt-1 text-base font-semibold text-foreground">
            <span className="mr-1 opacity-70">{item.icon}</span>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function MetadataGrid({ category, mediaItem }: { category: MediaCategory; mediaItem: MediaItem }) {
  const fields: Array<{ label: string; value: string }> = [];

  if (category === 'games') {
    if (mediaItem.platforms?.length) {
      fields.push({ label: 'Platforms', value: mediaItem.platforms.join(', ') });
    }
    if (mediaItem.developer) {
      fields.push({ label: 'Developer', value: mediaItem.developer });
    }
    if (mediaItem.publisher) {
      fields.push({ label: 'Publisher', value: mediaItem.publisher });
    }
    if (mediaItem.esrb_rating) {
      fields.push({ label: 'ESRB', value: mediaItem.esrb_rating });
    }
    if (mediaItem.release_date || mediaItem.first_release_date) {
      fields.push({
        label: 'Release date',
        value: mediaItem.release_date || mediaItem.first_release_date || '-',
      });
    }
    if (mediaItem.igdb_game_modes?.length) {
      fields.push({ label: 'Game modes', value: mediaItem.igdb_game_modes.join(', ') });
    }
    if (mediaItem.igdb_player_perspectives?.length) {
      fields.push({
        label: 'Player perspective',
        value: mediaItem.igdb_player_perspectives.join(', '),
      });
    }
  } else if (category === 'anime' || category === 'tv') {
    if (mediaItem.number_of_episodes || mediaItem.episodes) {
      fields.push({
        label: 'Episodes',
        value: `${mediaItem.number_of_episodes ?? mediaItem.episodes}`,
      });
    }
    if (mediaItem.number_of_seasons) {
      fields.push({ label: 'Seasons', value: `${mediaItem.number_of_seasons}` });
    }
    if (mediaItem.start_date || mediaItem.first_air_date) {
      fields.push({
        label: 'Air date',
        value: mediaItem.start_date || mediaItem.first_air_date || '-',
      });
    }
    if (mediaItem.status) {
      fields.push({ label: 'Status', value: mediaItem.status });
    }
    if (mediaItem.duration || mediaItem.runtime) {
      fields.push({ label: 'Duration', value: `${mediaItem.duration ?? mediaItem.runtime} min` });
    }
  } else if (category === 'manga') {
    if (mediaItem.volumes) {
      fields.push({ label: 'Volumes', value: `${mediaItem.volumes}` });
    }
    if (mediaItem.chapters) {
      fields.push({ label: 'Chapters', value: `${mediaItem.chapters}` });
    }
    if (mediaItem.release_date || mediaItem.start_date) {
      fields.push({
        label: 'Release date',
        value: mediaItem.release_date || mediaItem.start_date || '-',
      });
    }
    if (mediaItem.status) {
      fields.push({ label: 'Status', value: mediaItem.status });
    }
  } else if (category === 'books') {
    if (mediaItem.page_count) {
      fields.push({ label: 'Page count', value: `${mediaItem.page_count}` });
    }
    if (mediaItem.publisher) {
      fields.push({ label: 'Publisher', value: mediaItem.publisher });
    }
    if (mediaItem.release_date) {
      fields.push({ label: 'Release date', value: mediaItem.release_date });
    }
  } else if (category === 'movies') {
    if (mediaItem.runtime) {
      fields.push({ label: 'Runtime', value: `${mediaItem.runtime} min` });
    }
    if (mediaItem.release_date) {
      fields.push({ label: 'Release date', value: mediaItem.release_date });
    }
    if (mediaItem.status) {
      fields.push({ label: 'Status', value: mediaItem.status });
    }
  }

  if (mediaItem.official_website) {
    fields.push({ label: 'Website', value: mediaItem.official_website });
  }

  if (fields.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-border/70 bg-card/60 p-5">
      <h3 className="text-lg font-semibold text-foreground">Details</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {fields.map(field => (
          <div
            key={`${field.label}-${field.value}`}
            className="rounded-xl border border-border/60 bg-card/70 p-3"
          >
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {field.label}
            </p>
            {field.label === 'Website' ? (
              <a
                href={field.value}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Globe className="h-3.5 w-3.5" />
                {field.value}
              </a>
            ) : (
              <p className="mt-1 text-sm text-foreground">{field.value}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function GallerySection({ title, images }: { title: string; images: GalleryImage[] }) {
  const [activeImage, setActiveImage] = useState<GalleryImage | null>(null);

  if (images.length === 0) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-5">
      <h3 className="text-lg font-semibold text-foreground">Gallery</h3>
      <div className="mt-4 overflow-hidden">
        <Carousel opts={{ align: 'start', loop: false }} className="group relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-background/85 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background/85 to-transparent" />
          <CarouselContent className="ml-0">
            {images.map(image => (
              <CarouselItem
                key={image.id}
                className="basis-[72%] pl-0 pr-4 sm:basis-[42%] lg:basis-[30%]"
              >
                <button
                  type="button"
                  onClick={() => setActiveImage(image)}
                  className="w-full overflow-hidden rounded-xl border border-border/60 bg-card/80 text-left"
                >
                  <div className="relative aspect-video w-full">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      sizes="(max-width: 768px) 70vw, 28vw"
                      className="object-cover"
                    />
                  </div>
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-3 top-1/2 z-20 h-11 w-11 -translate-y-1/2 rounded-full border border-border/80 bg-background/90 text-foreground shadow-md transition-all hover:scale-105 hover:bg-background focus-visible:ring-2 focus-visible:ring-primary" />
          <CarouselNext className="right-3 top-1/2 z-20 h-11 w-11 -translate-y-1/2 rounded-full border border-border/80 bg-background/90 text-foreground shadow-md transition-all hover:scale-105 hover:bg-background focus-visible:ring-2 focus-visible:ring-primary" />
        </Carousel>
      </div>

      <Dialog open={Boolean(activeImage)} onOpenChange={open => !open && setActiveImage(null)}>
        <DialogContent className="max-w-5xl border-border bg-card p-3">
          {activeImage ? (
            <div className="space-y-2">
              <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{activeImage.alt}</DialogDescription>
              </DialogHeader>
              <div className="relative aspect-video w-full overflow-hidden rounded-xl">
                <Image
                  src={activeImage.src}
                  alt={activeImage.alt}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

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
  const [overviewExpanded, setOverviewExpanded] = useState(false);

  const apiBase = getApiBase(category);
  const baseEntry = useMemo(() => buildEntry(mediaItem, entryState), [mediaItem, entryState]);
  const hasEntry = Boolean(entryState?.entryId);

  const galleryImages = useMemo<GalleryImage[]>(() => {
    const artworks = (mediaItem.igdb_artwork_image_ids ?? []).map((id, idx) => ({
      id: `art-${idx}-${id}`,
      src: igdbImageUrl(id),
      alt: `${baseEntry.title} artwork ${idx + 1}`,
    }));
    const screenshots = (mediaItem.igdb_screenshot_image_ids ?? []).map((id, idx) => ({
      id: `shot-${idx}-${id}`,
      src: igdbImageUrl(id),
      alt: `${baseEntry.title} screenshot ${idx + 1}`,
    }));
    return [...artworks, ...screenshots];
  }, [mediaItem.igdb_artwork_image_ids, mediaItem.igdb_screenshot_image_ids, baseEntry.title]);

  const overviewText = mediaItem.summary || mediaItem.description || '';
  const storyText = mediaItem.storyline?.trim() || '';
  const shortOverview =
    overviewText.length > 280 ? `${overviewText.slice(0, 280).trim()}...` : overviewText;

  const refreshEntry = async () => {
    if (!mediaItem.id) {
      return;
    }

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
    void refreshEntry();
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
    if (!apiBase) {
      return;
    }

    setDialogEntry(null);
    setActionLoading(true);
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
    if (!apiBase) {
      return;
    }

    if (!hasEntry) {
      openDialog({ isFavorite: true });
      return;
    }

    setActionLoading(true);
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

  const statusLabel = getStatusLabel(category, entryState);
  const ratingLabel =
    entryState?.rating !== null && entryState?.rating !== undefined
      ? entryState.rating.toFixed(1)
      : '-';

  const categoryLabel = CATEGORY_CONFIG[category]?.title || category;
  const breadcrumbs = [
    { label: 'Home', href: '/dashboard' },
    { label: 'Library', href: '/backlog' },
    { label: categoryLabel, href: `/backlog?category=${category}` },
    { label: baseEntry.title },
  ];

  return (
    <PageContainer size="xl" className="py-8">
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

      <div className="relative space-y-6">
        <div className="absolute inset-0 -z-10 opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,hsl(var(--primary)/0.2),transparent_52%)]" />
          {mediaItem.banner_image ? (
            <div
              className="absolute inset-x-0 top-0 h-72 bg-cover bg-center opacity-20"
              style={{
                backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,.35), transparent), url(${mediaItem.banner_image})`,
              }}
            />
          ) : null}
        </div>

        <section className="rounded-3xl border border-border/70 bg-card/70 p-5 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[260px,1fr]">
            <div className="relative mx-auto w-full max-w-[260px] overflow-hidden rounded-2xl border border-border/70 bg-card/70">
              <div className="relative aspect-[3/4]">
                <CoverHeroImage
                  src={baseEntry.cover}
                  alt={baseEntry.title}
                  sizes="(max-width: 768px) 70vw, 260px"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  {category.toUpperCase()}
                </p>
                <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
                  {baseEntry.title}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {baseEntry.subtitle}
                  {baseEntry.year ? ` - ${baseEntry.year}` : ''}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className="rounded-full border border-border/70 bg-card/70 px-3 py-1"
                >
                  {statusLabel}
                </Badge>
                <Badge
                  variant="secondary"
                  className="rounded-full border border-border/70 bg-card/70 px-3 py-1"
                >
                  <Star className="mr-1 h-3.5 w-3.5 text-primary" />
                  {ratingLabel}
                </Badge>
                {baseEntry.year ? (
                  <Badge
                    variant="secondary"
                    className="rounded-full border border-border/70 bg-card/70 px-3 py-1"
                  >
                    <CalendarDays className="mr-1 h-3.5 w-3.5" />
                    {baseEntry.year}
                  </Badge>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {baseEntry.tags.length > 0 ? (
                  baseEntry.tags.slice(0, 10).map(tag => (
                    <span
                      key={tag}
                      className="rounded-full border border-border/70 bg-card/50 px-2.5 py-1 text-xs text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">No genres available</span>
                )}
                {(mediaItem.igdb_themes ?? []).slice(0, 4).map(theme => (
                  <span
                    key={theme}
                    className="rounded-full border border-border/70 bg-card/50 px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {theme}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  onClick={() => (hasEntry ? openDialog() : openDialog({ status: 'planned' }))}
                  disabled={actionLoading}
                  className="rounded-full px-5"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  {hasEntry ? 'Update Entry' : 'Add Entry'}
                </Button>

                <Button
                  type="button"
                  onClick={handleFavoriteToggle}
                  disabled={actionLoading}
                  variant={entryState?.favorite ? 'primary' : 'secondary'}
                  className="rounded-full"
                >
                  <Heart className="mr-2 h-4 w-4" />
                  {entryState?.favorite ? 'In favorites' : 'Add to favorites'}
                </Button>
              </div>

              <ScoreCluster mediaItem={mediaItem} entryState={entryState} />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border/70 bg-card/60 p-5">
          <h3 className="text-lg font-semibold text-foreground">My Entry</h3>

          {entryLoading ? (
            <div className="mt-4 inline-flex items-center gap-2">
              <Spinner className="size-4" />
              <span className="text-sm text-muted-foreground">Fetching entry data...</span>
            </div>
          ) : entryError ? (
            <div className="mt-4">
              <ErrorAlert message={entryError} />
            </div>
          ) : hasEntry ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border/70 bg-card/70 p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  Status
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">{statusLabel}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-card/70 p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  Progress
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {getProgressDisplay(category, entryState, mediaItem)}
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-card/70 p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  My rating
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">{ratingLabel}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-card/70 p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  Notes
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-foreground/90">
                  {entryState?.notes || 'No notes yet.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 max-w-md">
              <EmptyState
                title="No entry yet"
                description="Add this title to your library to start tracking your progress."
                action={
                  <Button variant="primary" onClick={() => openDialog({ status: 'planned' })}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Entry
                  </Button>
                }
              />
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border/70 bg-card/60 p-5">
          <h3 className="text-lg font-semibold text-foreground">Overview</h3>
          <div className="mt-3 text-sm leading-relaxed text-foreground/90">
            {overviewText ? (
              <p className="whitespace-pre-line">
                {overviewExpanded ? overviewText : shortOverview}
              </p>
            ) : (
              <p className="text-muted-foreground">No description available.</p>
            )}
          </div>
          {overviewText.length > 280 ? (
            <Button
              type="button"
              variant="secondary"
              className="mt-3"
              onClick={() => setOverviewExpanded(v => !v)}
            >
              {overviewExpanded ? 'Show less' : 'Read more'}
            </Button>
          ) : null}
        </section>

        {storyText ? (
          <section className="rounded-2xl border border-border/70 bg-card/60 p-5">
            <h3 className="text-lg font-semibold text-foreground">Story</h3>
            <div className="mt-3 text-sm leading-relaxed text-foreground/90">
              <p className="whitespace-pre-line">{storyText}</p>
            </div>
          </section>
        ) : null}

        <MetadataGrid category={category} mediaItem={mediaItem} />

        <GallerySection title={baseEntry.title} images={galleryImages} />
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
