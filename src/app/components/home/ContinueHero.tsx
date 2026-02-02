'use client';

import Image from 'next/image';
import Link from 'next/link';
import Slider from 'react-slick';
import useSWR from 'swr';
import { BookOpen, BookText, Gamepad2, Sparkles, Tv } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import styles from './ContinueHero.module.css';

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
  placeholder: string;
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
    placeholder: 'from-rose-500/30 via-transparent to-transparent',
    route: '/pages/backlog?category=games',
  },
  anime: {
    label: 'Anime',
    icon: <Sparkles className="h-4 w-4" />,
    verb: count => `Σε εξέλιξη: ${count} anime`,
    placeholder: 'from-fuchsia-500/30 via-transparent to-transparent',
    route: '/pages/backlog?category=anime',
  },
  manga: {
    label: 'Manga',
    icon: <BookOpen className="h-4 w-4" />,
    verb: count => `Σε εξέλιξη: ${count} manga`,
    placeholder: 'from-amber-500/30 via-transparent to-transparent',
    route: '/pages/backlog?category=manga',
  },
  tv: {
    label: 'Σειρές',
    icon: <Tv className="h-4 w-4" />,
    verb: count => `Σε εξέλιξη: ${count} σειρές`,
    placeholder: 'from-sky-500/30 via-transparent to-transparent',
    route: '/pages/backlog?category=tv',
  },
  books: {
    label: 'Βιβλία',
    icon: <BookText className="h-4 w-4" />,
    verb: count => `Σε εξέλιξη: ${count} βιβλία`,
    placeholder: 'from-emerald-500/30 via-transparent to-transparent',
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

// Hydration-safe relative time display component
function RelativeTimeDisplay({ date }: { date: string }) {
  const [formattedTime, setFormattedTime] = useState<string | null>(null);

  useEffect(() => {
    setFormattedTime(formatTimeAgo(date));
  }, [date]);

  return (
    <span suppressHydrationWarning>
      {formattedTime ?? '...'}
    </span>
  );
}

const getSlideImage = (slide: ContinueSlide) =>
  slide.cover_image_large ?? slide.cover_image_medium ?? null;

const isLandscapeUrl = (url: string) =>
  /screenshots|rawg|screenshot/i.test(url) || /widescreen/i.test(url);

const useLandscapeDetection = (url?: string) => {
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    if (!url) {
      setIsLandscape(false);
      return;
    }
    if (isLandscapeUrl(url)) {
      setIsLandscape(true);
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    let cancelled = false;
    const detector = new window.Image();
    detector.src = url;
    detector.onload = () => {
      if (!cancelled) {
        setIsLandscape(detector.width > detector.height);
      }
    };

    return () => {
      cancelled = true;
      detector.onload = null;
    };
  }, [url]);

  return isLandscape;
};

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
  const isLandscape = useLandscapeDetection(imageUrl ?? undefined);
  const needsLandscapeLayout = item.slide.category === 'games';
  const useBlurBackdrop = needsLandscapeLayout || (!needsLandscapeLayout && isLandscape);
  const gridColumnClass = needsLandscapeLayout
    ? 'md:grid-cols-[minmax(0,1fr)_minmax(480px,560px)]'
    : 'md:grid-cols-[minmax(0,1fr)_minmax(320px,360px)]';
  const thumbnailFrameClass = needsLandscapeLayout
    ? 'aspect-[16/9] w-full md:w-[520px] md:min-w-[480px] md:max-w-[520px]'
    : 'aspect-[4/5] w-full md:w-[340px] md:min-w-[320px] md:max-w-[340px]';
  const thumbnailSizes = needsLandscapeLayout
    ? '(max-width: 768px) 90vw, 520px'
    : '(max-width: 768px) 90vw, 340px';
  const imageScaleClass = needsLandscapeLayout ? 'scale-[1.042] lg:scale-[1.04]' : 'scale-[1.02]';

  return (
    <div className={`grid min-h-[300px] items-center gap-6 ${gridColumnClass}`}>
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.4em] text-[var(--hb-muted)]">
          <span className="text-[var(--hb-primary-strong)]">{item.config.icon}</span>
          {item.config.label}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--hb-headline)] md:text-3xl">
            Συνέχισε από εκεί που σταμάτησες
          </h2>
          <p className="mt-2 text-sm text-[var(--hb-muted)]">
            {item.config.verb(item.currentCount)}
          </p>
        </div>
        <div>
          <p className="text-lg font-semibold text-[var(--hb-headline)]">
            {item.slide.title ?? 'Χωρίς τίτλο'}
          </p>
          <p className="mt-1 text-sm text-[var(--hb-muted)]">
            Τελευταία ενημέρωση: πριν <RelativeTimeDisplay date={item.slide.updated_at} />
          </p>
        </div>
        {progressLabel && (
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--hb-border)] px-3 py-1 text-xs font-medium text-[var(--hb-muted)]">
            {progressLabel}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href={getCategoryRoute(item.slide.category, item.slide.title)}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--hb-primary-strong)] px-7 py-3 text-sm font-semibold text-slate-950 transition duration-300 hover:shadow-[var(--hb-shadow-md-hover)] hover:brightness-110"
          >
            Συνέχεια
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href={getCategoryRoute(item.slide.category)}
            className="hover:border-[var(--hb-primary-strong)]/60 inline-flex items-center gap-2 rounded-full border border-[var(--hb-border)] px-6 py-3 text-sm font-semibold text-[var(--hb-headline)] transition"
          >
            Δες όλα τα {item.config.label} σε εξέλιξη
          </Link>
        </div>
      </div>

      <div
        className={`relative overflow-hidden rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] dark:border-white/10 dark:bg-white/5 ${thumbnailFrameClass}`}
      >
        {imageUrl ? (
          <>
            {useBlurBackdrop && (
              <>
                <Image
                  src={imageUrl}
                  alt={item.slide.title ?? 'Τίτλος'}
                  fill
                  sizes={thumbnailSizes}
                  className="absolute inset-0 object-cover opacity-20 blur-3xl"
                  priority
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              </>
            )}
            <Image
              src={imageUrl}
              alt={item.slide.title ?? 'Τίτλος'}
              fill
              sizes={thumbnailSizes}
              className={`absolute inset-0 object-cover object-center transition-transform duration-700 ${imageScaleClass}`}
              priority
            />
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_60%)]">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[var(--hb-primary-strong)]">
              {item.config.icon}
            </span>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">
              Χωρίς εικόνα
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export function ContinueHero() {
  const { data: response } = useSWR<ContinuePayload | { data: ContinuePayload }>(
    '/api/user/continue',
    fetcher,
    {
      refreshInterval: 120000,
      revalidateOnFocus: true,
    },
  );

  const payload = (response && 'data' in response ? response.data : response) as
    | ContinuePayload
    | undefined;

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

  const releaseSlideFocus = useCallback(() => {
    if (typeof document === 'undefined') return;
    const active = document.activeElement as HTMLElement | null;
    active?.blur();
  }, []);

  const sliderSettings = useMemo(
    () => ({
      dots: slideItems.length > 1,
      infinite: slideItems.length > 1,
      speed: 600,
      slidesToShow: 1,
      slidesToScroll: 1,
      autoplay: slideItems.length > 1,
      autoplaySpeed: 8000,
      pauseOnHover: true,
      arrows: false,
      className: 'continue-slider',
      dotsClass: 'slick-dots continueHero-dots',
      appendDots: (dots: ReactNode) => <div className="mt-4 flex justify-center">{dots}</div>,
      customPaging: (i: number) => (
        <button type="button" aria-label={`Go to slide ${i + 1}`} className="continueHero-dot" />
      ),
      beforeChange: () => releaseSlideFocus(),
    }),
    [slideItems.length, releaseSlideFocus],
  );

  if (slideItems.length === 0) {
    return (
      <section className="px-4 py-10 md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[28px] border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-[var(--hb-headline)]">
              Συνέχισε από εκεί που σταμάτησες
            </h2>
            <p className="mt-2 text-sm text-[var(--hb-muted)]">Δεν έχεις κάτι σε εξέλιξη ακόμα.</p>
            <div className="mt-6">
              <Link
                href={getFallbackRoute(enabledCategories)}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--hb-primary-strong)] px-6 py-3 text-sm font-semibold text-slate-950 transition duration-300 hover:shadow-[var(--hb-shadow-md-hover)] hover:brightness-110"
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
    <section className="px-4 py-10 md:px-6">
      <div className="mx-auto max-w-7xl">
        <div
          className={`overflow-hidden rounded-[28px] border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 shadow-sm ${styles.continueHero}`}
        >
          <Slider {...sliderSettings}>
            {slideItems.map(item => (
              <SlideCard key={`slide-${item.slide.entry_id}`} item={item} />
            ))}
          </Slider>
        </div>
      </div>
    </section>
  );
}
