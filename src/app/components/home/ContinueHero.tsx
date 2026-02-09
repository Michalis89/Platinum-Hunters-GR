'use client';

import Image from 'next/image';
import Link from 'next/link';
import useSWR from 'swr';
import {
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
    verb: count => `Σε εξέλιξη: ${count} παιχνίδια`,
    route: '/pages/backlog?category=games',
  },
  anime: {
    label: 'Anime',
    icon: <Sparkles className="h-4 w-4" />,
    verb: count => `Σε εξέλιξη: ${count} anime`,
    route: '/pages/backlog?category=anime',
  },
  manga: {
    label: 'Manga',
    icon: <BookOpen className="h-4 w-4" />,
    verb: count => `Σε εξέλιξη: ${count} manga`,
    route: '/pages/backlog?category=manga',
  },
  tv: {
    label: 'Σειρές',
    icon: <Tv className="h-4 w-4" />,
    verb: count => `Σε εξέλιξη: ${count} σειρές`,
    route: '/pages/backlog?category=tv',
  },
  books: {
    label: 'Βιβλία',
    icon: <BookText className="h-4 w-4" />,
    verb: count => `Σε εξέλιξη: ${count} βιβλία`,
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
  if (Number.isNaN(timestamp)) return 'λίγο';

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return 'λίγα δευτερόλεπτα';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'λεπτό' : 'λεπτά'}`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'ώρα' : 'ώρες'}`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? 'ημέρα' : 'ημέρες'}`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} ${weeks === 1 ? 'εβδομάδα' : 'εβδομάδες'}`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? 'μήνας' : 'μήνες'}`;

  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? 'χρόνος' : 'χρόνια'}`;
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
  if (category === 'anime' || category === 'tv') return `Επεισόδιο ${progress}`;
  if (category === 'manga') {
    const plural = progress === 1 ? 'Τόμος' : 'Τόμοι';
    return `${plural} ${progress}`;
  }
  if (category === 'books') return `Σελίδα ${progress}`;
  return null;
};

const SlideCard = ({ item }: { item: SlideItem }) => {
  const imageUrl = getSlideImage(item.slide);
  const progressLabel = getProgressLabel(item.slide.category, item.slide.progress);

  return (
    <div className="grid min-h-[304px] items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(280px,320px)]">
      <div className="space-y-5">
        <div className="apple-secondary-label inline-flex items-center gap-2 text-xs font-medium tracking-[0.06em]">
          <span>{item.config.icon}</span>
          {item.config.label}
        </div>

        <div className="space-y-2">
          <h2 className="apple-label text-3xl font-semibold leading-[1.08] tracking-[-0.03em] md:text-4xl">
            Συνέχισε από εκεί που σταμάτησες
          </h2>
          <p className="apple-secondary-label text-sm leading-relaxed">
            {item.config.verb(item.currentCount)}
          </p>
        </div>

        <div className="space-y-1.5">
          <p className="apple-label text-lg font-semibold tracking-[-0.02em]">
            {item.slide.title ?? 'Χωρίς τίτλο'}
          </p>
          <p className="apple-secondary-label text-sm">
            Τελευταία ενημέρωση: πριν <RelativeTimeDisplay date={item.slide.updated_at} />
          </p>
        </div>

        {progressLabel && (
          <div className="apple-pill apple-secondary-label inline-flex items-center px-3 py-1 text-xs">
            {progressLabel}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button
            variant="primary"
            href={getCategoryRoute(item.slide.category, item.slide.title)}
            className="min-h-11 rounded-[20px] px-5 py-3 text-[13px] font-medium tracking-[-0.01em]"
          >
            Συνέχεια
            <span aria-hidden="true">→</span>
          </Button>
          <Button
            variant="secondary"
            href={getCategoryRoute(item.slide.category)}
            className="min-h-11 rounded-[20px] px-5 py-3 text-[13px] font-medium tracking-[-0.01em]"
          >
            Όλα τα {item.config.label} σε εξέλιξη
          </Button>
        </div>
      </div>

      <div className="w-full md:w-[260px] md:min-w-[240px] md:max-w-[260px]">
        <AspectRatio
          ratio={4 / 5}
          className="apple-card relative overflow-hidden"
        >
          {imageUrl ? (
            <>
              <Image
                src={imageUrl}
                alt={item.slide.title ?? 'Τίτλος'}
                fill
                sizes="(max-width: 768px) 88vw, 300px"
                className="absolute inset-0 object-contain p-2"
                priority
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_60%)]">
              <span className="apple-system-blue flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                {item.config.icon}
              </span>
              <p className="text-xs font-medium tracking-[0.06em] text-white/65">Χωρίς εικόνα</p>
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
      <section className="px-4 py-6 md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="apple-material-surface min-h-[304px] animate-pulse p-6">
            <div className="grid min-h-[260px] items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(320px,360px)]">
              <div className="space-y-4">
                <div className="bg-[var(--hb-card)]/60 h-4 w-24 rounded" />
                <div className="bg-[var(--hb-card)]/70 h-8 w-3/4 rounded" />
                <div className="bg-[var(--hb-card)]/50 h-4 w-1/2 rounded" />
                <div className="flex gap-3 pt-4">
                  <div className="bg-[var(--hb-card)]/60 h-12 w-32 rounded-full" />
                  <div className="bg-[var(--hb-card)]/40 h-12 w-48 rounded-full" />
                </div>
              </div>
              <div className="bg-[var(--hb-card)]/30 aspect-[4/5] w-full rounded-2xl md:w-[340px]" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (slideItems.length === 0) {
    return (
      <section className="px-4 py-6 md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="apple-material-surface p-7">
            <h2 className="apple-label text-3xl font-semibold tracking-[-0.03em]">
              Συνέχισε από εκεί που σταμάτησες
            </h2>
            <p className="apple-secondary-label mt-2 text-sm">Δεν έχεις κάτι σε εξέλιξη ακόμα.</p>
            <div className="mt-6">
              <Link
                href={getFallbackRoute(enabledCategories)}
                className="apple-pill apple-label inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition hover:brightness-95"
              >
                Δες το backlog
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="apple-material-surface overflow-hidden p-7">
          <Carousel
            setApi={setCarouselApi}
            opts={{
              align: 'start',
              loop: slideItems.length > 1,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-0">
              {slideItems.map(item => (
                <CarouselItem key={`slide-${item.slide.entry_id}`} className="basis-full pl-0">
                  <SlideCard item={item} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {slideItems.length > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
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
                      isActive
                        ? 'border-[var(--apple-label)] bg-[var(--apple-label)]'
                        : 'border-[var(--apple-separator)] bg-[var(--apple-tertiary-fill)]'
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
