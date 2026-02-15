'use client';

import { CoverHeroImage } from '@/components/ui/cover-image';
import Link from 'next/link';
import useSWR from 'swr';
import {
  ArrowRight,
  BookOpen,
  BookText,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Sparkles,
  Tv,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel';

type ContinueSlide = {
  category: string;
  entry_id: number;
  media_id: number;
  status: string;
  progress: number | null;
  score: string | null;
  updated_at: string;
  created_at: string;
  title: string | null;
  season_year: number | null;
  release_date: string | null;
  cover_image_large: string | null;
  cover_image_medium: string | null;
};

type CountBucket = {
  total: number;
  planned: number;
  current: number;
  completed: number;
  dropped: number;
};

type ContinuePayload = {
  enabledCategories: string[];
  slides: ContinueSlide[];
  countsByCategory: Record<string, CountBucket>;
};

type CategoryConfig = {
  label: string;
  icon: ReactNode;
  verb: (count: number) => string;
  route: string;
};

type SlideItem = {
  slide: ContinueSlide;
  config: CategoryConfig;
  currentCount: number;
};

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(res => res.json());

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  games: {
    label: 'Games',
    icon: <Gamepad2 className="h-4 w-4" />,
    verb: count => `In progress: ${count} games`,
    route: '/pages/backlog?category=games',
  },
  anime: {
    label: 'Anime',
    icon: <Sparkles className="h-4 w-4" />,
    verb: count => `In progress: ${count} anime`,
    route: '/pages/backlog?category=anime',
  },
  manga: {
    label: 'Manga',
    icon: <BookOpen className="h-4 w-4" />,
    verb: count => `In progress: ${count} manga`,
    route: '/pages/backlog?category=manga',
  },
  tv: {
    label: 'TV shows',
    icon: <Tv className="h-4 w-4" />,
    verb: count => `In progress: ${count} TV shows`,
    route: '/pages/backlog?category=tv',
  },
  books: {
    label: 'Books',
    icon: <BookText className="h-4 w-4" />,
    verb: count => `In progress: ${count} books`,
    route: '/pages/backlog?category=books',
  },
};

const CATEGORY_ROUTES = {
  games: '/pages/backlog?category=games&status=current',
  anime: '/pages/backlog?category=anime&status=current',
  manga: '/pages/backlog?category=manga&status=current',
  tv: '/pages/backlog?category=tv&status=current',
  books: '/pages/backlog?category=books&status=current',
};

const appendSearchParam = (route: string, search?: string | null) => {
  const trimmed = search?.trim();
  if (!trimmed) {
    return route;
  }

  const url = new URL(route, 'https://hobbistas.local');
  url.searchParams.set('search', trimmed);
  return `${url.pathname}${url.search}`;
};

const formatTimeAgo = (value: string) => {
  const normalized = value.replace(' ', 'T') + 'Z';
  const timestamp = Date.parse(normalized);
  if (Number.isNaN(timestamp)) return 'just now';

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return 'a few seconds';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'}`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'}`;

  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? 'year' : 'years'}`;
};

function RelativeTimeDisplay({ date }: { date: string }) {
  const [formattedTime, setFormattedTime] = useState<string | null>(null);

  useEffect(() => {
    setFormattedTime(formatTimeAgo(date));
  }, [date]);

  return <span suppressHydrationWarning>{formattedTime ?? '...'}</span>;
}

const getSlideImage = (slide: ContinueSlide) =>
  slide.cover_image_large ?? slide.cover_image_medium ?? null;

const getCategoryRoute = (category: string, search?: string | null) =>
  appendSearchParam(
    CATEGORY_ROUTES[category as keyof typeof CATEGORY_ROUTES] ?? '/pages/backlog',
    search,
  );

const getFallbackRoute = (enabledCategories: string[]) => {
  const firstEnabled = enabledCategories.find(category => category in CATEGORY_ROUTES);
  return firstEnabled ? getCategoryRoute(firstEnabled) : '/pages/backlog';
};

const getProgressLabel = (category: string, progress: number | null) => {
  if (!progress || progress <= 0) return null;
  if (category === 'games') return null;
  if (category === 'anime' || category === 'tv') return `Episode ${progress}`;
  if (category === 'manga') {
    const plural = progress === 1 ? 'Volume' : 'Volumes';
    return `${plural} ${progress}`;
  }
  if (category === 'books') return `Page ${progress}`;
  return null;
};

const SlideCard = ({ item }: { item: SlideItem }) => {
  const imageUrl = getSlideImage(item.slide);
  const progressLabel = getProgressLabel(item.slide.category, item.slide.progress);

  return (
    <div className="grid min-h-[324px] items-center gap-8 rounded-2xl border border-border/35 bg-card p-6 shadow-[0_10px_35px_-22px_rgba(0,0,0,0.8)] md:grid-cols-[minmax(0,1fr)_minmax(280px,320px)] md:p-7">
      <div className="space-y-5 md:space-y-6">
        <div className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.08em] text-muted-foreground">
          <span>{item.config.icon}</span>
          {item.config.label}
        </div>

        <div className="space-y-2.5">
          <h2 className="text-3xl font-semibold leading-[1.05] tracking-[-0.03em] text-foreground md:text-4xl">
            Continue where you left off
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {item.config.verb(item.currentCount)}
          </p>
        </div>

        <div className="space-y-1.5">
          <p className="text-lg font-semibold tracking-[-0.02em] text-foreground">
            {item.slide.title ?? 'Untitled'}
          </p>
          <p className="text-sm text-muted-foreground">
            Last updated: <RelativeTimeDisplay date={item.slide.updated_at} /> ago
          </p>
        </div>

        {progressLabel && (
          <div className="inline-flex items-center rounded-full border border-border/50 bg-muted/20 px-3 py-1 text-xs text-foreground/90">
            {progressLabel}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button
            variant="primary"
            href={getCategoryRoute(item.slide.category, item.slide.title)}
            className="min-h-11 rounded-[20px] px-5 py-3 text-[13px] font-semibold tracking-[-0.01em] shadow-sm"
          >
            Continue
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="secondary"
            href={getCategoryRoute(item.slide.category)}
            className="min-h-11 rounded-[20px] border-border/60 px-5 py-3 text-[13px] font-medium tracking-[-0.01em]"
          >
            All {item.config.label} in progress
          </Button>
        </div>
      </div>

      <div className="w-full md:w-[260px] md:min-w-[240px] md:max-w-[260px]">
        <AspectRatio ratio={4 / 5} className="relative">
          {imageUrl ? (
            <>
              <CoverHeroImage
                src={imageUrl}
                alt={item.slide.title ?? 'Title'}
                sizes="(max-width: 768px) 88vw, 300px"
                className="absolute inset-0 object-contain p-2"
                priority
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_60%)]">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                {item.config.icon}
              </span>
              <p className="text-xs font-medium tracking-[0.06em] text-white/65">No image</p>
            </div>
          )}
        </AspectRatio>
      </div>
    </div>
  );
};

export function ContinueHero() {
  const { data: response, isLoading } = useSWR<ContinuePayload | { data: ContinuePayload }>(
    '/api/user/continue',
    fetcher,
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
    },
  );

  const payload = (response && 'data' in response ? response.data : response) as
    | ContinuePayload
    | undefined;
  const isInitialLoading = isLoading && !response;

  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const enabledCategories = payload?.enabledCategories ?? [];
  const slides = useMemo(() => payload?.slides ?? [], [payload]);
  const countsByCategory = useMemo(() => payload?.countsByCategory ?? {}, [payload]);

  const slideItems = useMemo(
    () =>
      slides
        .map<SlideItem | null>(slide => {
          const config = CATEGORY_CONFIG[slide.category];
          if (!config) return null;
          return {
            slide,
            config,
            currentCount: countsByCategory[slide.category]?.current ?? 0,
          };
        })
        .filter((item): item is SlideItem => Boolean(item)),
    [slides, countsByCategory],
  );

  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      setSelectedIndex(carouselApi.selectedScrollSnap());
    };

    onSelect();
    carouselApi.on('select', onSelect);
    carouselApi.on('reInit', onSelect);

    return () => {
      carouselApi.off('select', onSelect);
      carouselApi.off('reInit', onSelect);
    };
  }, [carouselApi]);

  useEffect(() => {
    if (!carouselApi || slideItems.length <= 1) return;

    const intervalId = window.setInterval(() => {
      carouselApi.scrollNext();
    }, 8500);

    return () => window.clearInterval(intervalId);
  }, [carouselApi, slideItems.length]);

  if (isInitialLoading) {
    return (
      <section className="px-4 py-7 md:px-6 md:py-8">
        <div className="mx-auto max-w-screen-2xl">
          <div className="min-h-[304px] animate-pulse rounded-3xl border border-border/30 bg-card/90 p-6 md:p-7">
            <div className="grid min-h-[260px] items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(320px,360px)]">
              <div className="space-y-4">
                <div className="h-4 w-24 rounded bg-card/60" />
                <div className="h-8 w-3/4 rounded bg-card/70" />
                <div className="h-4 w-1/2 rounded bg-card/50" />
                <div className="flex gap-3 pt-4">
                  <div className="h-12 w-32 rounded-full bg-card/60" />
                  <div className="h-12 w-48 rounded-full bg-card/40" />
                </div>
              </div>
              <div className="aspect-[4/5] w-full rounded-2xl bg-card/30 md:w-[340px]" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (slideItems.length === 0) {
    return (
      <section className="px-4 py-7 md:px-6 md:py-8">
        <div className="mx-auto max-w-screen-2xl">
          <div className="rounded-3xl border border-border/30 bg-card/90 p-7 shadow-[0_10px_35px_-22px_rgba(0,0,0,0.8)]">
            <h2 className="text-3xl font-semibold tracking-[-0.03em]">
              Continue where you left off
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You don&apos;t have anything in progress yet.
            </p>
            <div className="mt-6">
              <Link
                href={getFallbackRoute(enabledCategories)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-95"
              >
                View backlog
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-7 md:px-6 md:py-8">
      <div className="mx-auto max-w-screen-2xl">
        <div className="rounded-3xl border border-border/30 bg-card/95 p-7 shadow-[0_16px_40px_-24px_rgba(0,0,0,0.85)] md:p-8">
          <Carousel
            setApi={setCarouselApi}
            opts={{
              align: 'start',
              loop: slideItems.length > 1,
              containScroll: 'trimSnaps',
            }}
            className="w-full overflow-hidden"
          >
            <CarouselContent>
              {slideItems.map(item => (
                <CarouselItem key={`slide-${item.slide.entry_id}`} className="min-w-0 basis-full">
                  <SlideCard item={item} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {slideItems.length > 1 && (
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                type="button"
                aria-label="Previous slide"
                className="h-8 w-8 rounded-full"
                onClick={() => carouselApi?.scrollPrev()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {slideItems.map((_, index) => {
                const isActive = index === selectedIndex;
                return (
                  <button
                    key={`dot-${index}`}
                    type="button"
                    onClick={() => carouselApi?.scrollTo(index)}
                    aria-label={`Go to slide ${index + 1}`}
                    className={`h-2.5 w-2.5 rounded-full border transition ${
                      isActive ? 'border-foreground bg-foreground' : 'border-input bg-card'
                    }`}
                  />
                );
              })}

              <Button
                variant="secondary"
                size="icon"
                type="button"
                aria-label="Next slide"
                className="h-8 w-8 rounded-full"
                onClick={() => carouselApi?.scrollNext()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
