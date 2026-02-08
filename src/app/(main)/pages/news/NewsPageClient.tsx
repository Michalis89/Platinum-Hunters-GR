'use client';

import { Suspense, memo, useEffect, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Calendar, Clock, Eye, FileText, Heart, Tag, User } from 'lucide-react';
import type { ArticleCategory, ArticleRow } from '@/types/database';
import { PageContainer } from '@/app/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import EmptyState from '@/app/components/ui/EmptyState';
import ErrorState from '@/app/components/ui/ErrorState';
import {
  CATEGORY_LABELS,
  CATEGORY_SUBTITLES,
  TOPIC_LABELS,
} from '@/app/(main)/pages/news/constants';
import { normalizeSlug } from '@/utils/slugify';
import { getVisibleCategories } from '@/app/(main)/pages/_shared/categories';
import { FormattedDate } from '@/app/components/ui/FormattedDate';
import {
  CONTENT_PUBLISHED_EVENT,
  type ContentPublishedEventDetail,
} from '@/app/constants/contentEvents';

interface ArticleWithAuthor extends ArticleRow {
  users?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

const PRIMARY_CATEGORIES: ArticleCategory[] = [
  'games',
  'anime',
  'manga',
  'movies',
  'tv',
  'books',
  'coding',
  'pet',
  'vape',
];

const SKELETON_COUNT = 6;

const ArticleCard = memo(function ArticleCard({ article }: { article: ArticleWithAuthor }) {
  const normalizedSlug = normalizeSlug(article.slug);
  const MotionCard = motion(Card);

  return (
    <MotionCard
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
      className="apple-card group overflow-hidden rounded-[var(--apple-radius-card)] border border-[var(--apple-separator)] bg-[var(--apple-surface)] shadow-[var(--apple-shadow)] focus-within:ring-2 focus-within:ring-[color:var(--apple-system-blue)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--apple-bg)]"
    >
      <Link href={`/pages/news/${normalizedSlug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-[var(--apple-group-bg)]">
          {article.cover_image ? (
            <Image
              src={article.cover_image}
              alt={article.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.015]"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-[var(--apple-tertiary-fill)]">
              <FileText size={42} className="text-[var(--apple-secondary-label)]" />
            </div>
          )}
          <div className="absolute left-3 top-3 flex items-center gap-2">
            <span className="apple-pill px-3 py-1 text-[11px] font-semibold text-[var(--apple-label)]">
              {CATEGORY_LABELS[article.category] ?? article.category}
            </span>
            <span className="apple-pill px-3 py-1 text-[11px] font-semibold text-[var(--apple-label)]">
              {TOPIC_LABELS[article.topic]}
            </span>
          </div>
        </div>
      </Link>

      <CardHeader className="p-4 pb-1">
        <Link href={`/pages/news/${normalizedSlug}`}>
          <CardTitle className="apple-title-tracking text-[19px] leading-tight text-[var(--apple-label)] transition-colors duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:text-[var(--apple-system-blue)] hover:text-[var(--apple-system-blue)]">
            {article.title}
          </CardTitle>
        </Link>
        {article.description ? (
          <CardDescription className="apple-body-tracking mt-2 line-clamp-2 text-[13px] text-[var(--apple-secondary-label)]">
            {article.description}
          </CardDescription>
        ) : null}
      </CardHeader>

      <CardContent className="p-4 pt-2">
        {article.tags && article.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {article.tags.slice(0, 3).map(tag => (
              <Link
                key={tag}
                href={`/pages/news?tag=${encodeURIComponent(tag)}`}
                className="apple-pill inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-[var(--apple-secondary-label)] transition hover:text-[var(--apple-label)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--apple-system-blue)]"
              >
                <Tag size={10} />
                {tag}
              </Link>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-[var(--apple-secondary-label)]">
          {article.users ? (
            <div className="inline-flex items-center gap-1">
              <User size={12} />
              <span>{article.users.display_name || article.users.username}</span>
            </div>
          ) : null}

          {article.published_at ? (
            <div className="inline-flex items-center gap-1">
              <Calendar size={12} />
              <FormattedDate date={article.published_at} className="text-[11px]" fallback="" />
            </div>
          ) : null}

          {article.reading_time_minutes ? (
            <div className="inline-flex items-center gap-1">
              <Clock size={12} />
              <span>{article.reading_time_minutes} λεπτά</span>
            </div>
          ) : null}

          <div className="ml-auto inline-flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Eye size={12} />
              {article.views}
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart size={12} />
              {article.likes}
            </span>
          </div>
        </div>
      </CardContent>
    </MotionCard>
  );
});
ArticleCard.displayName = 'ArticleCard';

const ArticleCardSkeleton = () => (
  <div className="apple-card min-h-[320px] overflow-hidden rounded-[var(--apple-radius-card)] border border-[var(--apple-separator)] bg-[var(--apple-surface)]">
    <div className="aspect-[16/10] animate-pulse bg-[var(--apple-tertiary-fill)]" />
    <div className="space-y-3 p-4">
      <div className="h-4 w-3/4 animate-pulse rounded-full bg-[var(--apple-tertiary-fill)]" />
      <div className="h-3 animate-pulse rounded-full bg-[var(--apple-tertiary-fill)]" />
      <div className="h-3 w-2/3 animate-pulse rounded-full bg-[var(--apple-tertiary-fill)]" />
    </div>
  </div>
);

function NewsSkeletonGrid({ count = SKELETON_COUNT }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <ArticleCardSkeleton key={`news-skeleton-${index}`} />
      ))}
    </div>
  );
}

function NewsFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--apple-bg)] px-4">
      <NewsSkeletonGrid />
    </div>
  );
}

function buildHref({
  category,
  tag,
}: {
  category: ArticleCategory | null;
  tag: string | null;
}) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (tag) params.set('tag', tag);
  const query = params.toString();
  return query ? `/pages/news?${query}` : '/pages/news';
}

function FilterSegment({
  href,
  label,
  isActive,
}: {
  href: string;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-[var(--apple-radius-control)] px-3 py-2 text-[13px] font-medium transition ${
        isActive
          ? 'bg-[var(--apple-system-blue)] text-white'
          : 'text-[var(--apple-secondary-label)] hover:bg-[var(--apple-tertiary-fill)] hover:text-[var(--apple-label)]'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      {label}
    </Link>
  );
}

export default function NewsPageClient() {
  return (
    <Suspense fallback={<NewsFallback />}>
      <NewsPageContent />
    </Suspense>
  );
}

function NewsPageContent() {
  const searchParams = useSearchParams();
  const availableCategories = getVisibleCategories({ scope: 'news' });

  const rawCategory = searchParams.get('category');
  const category =
    rawCategory && availableCategories.includes(rawCategory as ArticleCategory)
      ? (rawCategory as ArticleCategory)
      : null;

  const rawTag = searchParams.get('tag');
  const tag = rawTag || null;

  const [articles, setArticles] = useState<ArticleWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;

    const fetchArticles = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (category) params.set('category', category);
        if (tag) params.set('tag', tag);
        params.set('status', 'published');
        params.set('limit', '20');

        const response = await fetch(`/api/articles?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch articles');
        }

        const data = await response.json();
        const filtered = (data.data || []).filter(
          (article: ArticleWithAuthor) => article.topic !== 'reviews',
        );

        startTransition(() => {
          if (!isMounted) return;
          setArticles(filtered);
          setTotal(filtered.length);
          setLoading(false);
        });
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Something went wrong');
        setLoading(false);
      }
    };

    fetchArticles();
    return () => {
      isMounted = false;
    };
  }, [category, tag, refreshSignal]);

  useEffect(() => {
    const handleContentPublished = (event: Event) => {
      const customEvent = event as CustomEvent<ContentPublishedEventDetail>;
      if (customEvent.detail?.type === 'article') {
        setRefreshSignal(current => current + 1);
      }
    };

    window.addEventListener(CONTENT_PUBLISHED_EVENT, handleContentPublished);
    return () => {
      window.removeEventListener(CONTENT_PUBLISHED_EVENT, handleContentPublished);
    };
  }, []);

  const categoryLabel = category ? (CATEGORY_LABELS[category] ?? null) : null;
  const pageTitle = categoryLabel ? categoryLabel : 'Άρθρα';
  const subtitle = category
    ? (CATEGORY_SUBTITLES[category] ?? 'Άρθρα και ιστορίες από την κοινότητα, με καθαρή δομή.')
    : 'Άρθρα και ιστορίες από όλα τα χόμπι, με καθαρή δομή και ήρεμη ανάγνωση.';
  const metaLine = tag ? `${total} άρθρα • ${tag}` : `${total} άρθρα`;
  const emptyDescription = categoryLabel
    ? `Δεν βρέθηκαν άρθρα για την κατηγορία "${categoryLabel}"`
    : 'Δεν υπάρχουν ακόμα δημοσιευμένα άρθρα';

  const shouldShowSkeleton = loading || isPending;
  const categoryFilters = [null, ...PRIMARY_CATEGORIES.filter(item => availableCategories.includes(item))];
  return (
    <PageContainer size="xl" className="py-10 sm:py-12">
      <div className="apple-page-background rounded-[var(--apple-radius-container)] p-3 sm:p-4">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="apple-material-surface mb-6 rounded-[var(--apple-radius-container)] p-5 sm:p-7"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="apple-secondary-label text-[11px] font-semibold uppercase tracking-[0.18em]">
                Αίθουσα Τύπου
              </p>
              <h1 className="apple-title-tracking text-3xl font-semibold text-[var(--apple-label)] sm:text-4xl">
                {pageTitle}
              </h1>
              <p className="apple-body-tracking max-w-2xl text-[14px] text-[var(--apple-secondary-label)]">
                {subtitle}
              </p>
            </div>
            <span className="apple-pill inline-flex w-fit items-center px-3 py-1.5 text-xs font-medium text-[var(--apple-secondary-label)]">
              {metaLine}
            </span>
          </div>

          <div className="apple-section-divider my-5" />

          <div className="space-y-4">
            <div className="flex flex-col items-center">
              <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--apple-secondary-label)]">
                Κατηγορίες
              </p>
              <div className="apple-pill flex w-full max-w-5xl justify-start gap-1 overflow-x-auto p-1 sm:justify-center">
                {categoryFilters.map(item => (
                  <FilterSegment
                    key={item ?? 'all'}
                    href={buildHref({ category: item, tag })}
                    label={item ? (CATEGORY_LABELS[item] ?? item) : 'Όλα'}
                    isActive={item === category || (!item && !category)}
                  />
                ))}
              </div>
            </div>

            {tag ? (
              <div className="flex items-center justify-between rounded-[var(--apple-radius-control)] border border-[var(--apple-separator)] bg-[var(--apple-tertiary-fill)] px-3 py-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-[var(--apple-secondary-label)]">
                  <Tag size={12} />
                  Tag: <span className="font-semibold text-[var(--apple-label)]">{tag}</span>
                </span>
                <Link
                  href={buildHref({ category, tag: null })}
                  className="text-xs font-medium text-[var(--apple-system-blue)]"
                >
                  Εκκαθάριση
                </Link>
              </div>
            ) : null}
          </div>
        </motion.section>

        {shouldShowSkeleton ? (
          <NewsSkeletonGrid />
        ) : error ? (
          <ErrorState error={error} />
        ) : articles.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-16 w-16 text-[var(--apple-secondary-label)]" />}
            title="Δεν υπάρχουν άρθρα"
            description={emptyDescription}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {articles.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </motion.div>
        )}
      </div>
    </PageContainer>
  );
}
