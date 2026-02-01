'use client';

import { Suspense, useEffect, useState, useTransition, memo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FileText, Clock, Eye, Heart, Calendar, User, Tag } from 'lucide-react';
import type { ArticleRow, ArticleCategory, ArticleTopic } from '@/types/database';
import { PageContainer, PageHeader } from '@/app/components/layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/Card';
import EmptyState from '@/app/components/ui/EmptyState';
import ErrorState from '@/app/components/ui/ErrorState';
import {
  CATEGORY_LABELS,
  CATEGORY_SUBTITLES,
  TOPIC_LABELS,
} from '@/app/(main)/pages/news/constants';
import { normalizeSlug } from '@/utils/slugify';
import FilterBar from '@/app/components/shared/FilterBar';
import { getVisibleCategories } from '@/app/(main)/pages/_shared/categories';
import {
  CONTENT_PUBLISHED_EVENT,
  ContentPublishedEventDetail,
} from '@/app/constants/contentEvents';

interface ArticleWithAuthor extends ArticleRow {
  users?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

const ArticleCard = memo(function ArticleCard({ article }: { article: ArticleWithAuthor }) {
  const normalizedSlug = normalizeSlug(article.slug);
  const MotionCard = motion(Card);

  return (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="hover:border-[var(--hb-primary-strong)]/50 group relative overflow-hidden rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] shadow-[var(--hb-shadow-md)] transition hover:shadow-[var(--hb-shadow-md-hover)]"
    >
      {/* Cover Image */}
      <Link href={`/pages/news/${normalizedSlug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-[var(--hb-surface)]">
          {article.cover_image ? (
          <Image
            src={article.cover_image}
            alt={article.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
          />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-[var(--hb-primary-strong)] to-[var(--hb-accent)]">
              <FileText size={48} className="text-white/50" />
            </div>
          )}
          {/* Category Badge */}
          <div className="absolute left-3 top-3">
            <span className="rounded-full bg-[var(--hb-primary-strong)] px-3 py-1 text-[11px] font-semibold text-white shadow-lg">
              {CATEGORY_LABELS[article.category] ?? article.category}
            </span>
          </div>
          {/* Topic Badge */}
          <div className="absolute right-3 top-3">
            <span className="rounded-full bg-sky-500 px-3 py-1 text-[11px] font-semibold text-white shadow-[var(--hb-shadow-md)]">
              {TOPIC_LABELS[article.topic]}
            </span>
          </div>
        </div>
      </Link>

      <CardHeader className="border-b-0 p-4 pb-0">
        <Link href={`/pages/news/${normalizedSlug}`}>
          <CardTitle className="text-[18px] leading-snug transition group-hover:text-[var(--hb-primary-strong)]">
            {article.title}
          </CardTitle>
        </Link>

        {article.description && (
          <CardDescription className="mt-2 line-clamp-2">{article.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-3">
        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {article.tags.slice(0, 3).map(tag => (
              <Link
                key={tag}
                href={`/pages/news?tag=${encodeURIComponent(tag)}`}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--hb-border)] bg-[var(--hb-surface)] px-2.5 py-0.5 text-[11px] text-[var(--hb-muted)] transition hover:border-[var(--hb-primary)] hover:text-[var(--hb-headline)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hb-primary)]"
              >
                <Tag size={10} />
                {tag}
              </Link>
            ))}
            {article.tags.length > 3 && (
              <span className="text-[11px] text-[var(--hb-muted)]">+{article.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Meta */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-[var(--hb-muted)]">
          {/* Author */}
          {article.users && (
            <div className="flex items-center gap-1">
              <User size={12} />
              <span>{article.users.display_name || article.users.username}</span>
            </div>
          )}

          {/* Date */}
          {article.published_at && (
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{new Date(article.published_at).toLocaleDateString('el-GR')}</span>
            </div>
          )}

          {/* Reading time */}
          {article.reading_time_minutes && (
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>{article.reading_time_minutes} λεπτά</span>
            </div>
          )}

          {/* Stats */}
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Eye size={12} />
              <span>{article.views}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart size={12} />
              <span>{article.likes}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </MotionCard>
  );
});
ArticleCard.displayName = 'ArticleCard';

const SKELETON_COUNT = 6;

const ArticleCardSkeleton = () => (
  <div className="min-h-[320px] overflow-hidden rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] shadow-[var(--hb-shadow-md)]">
    <div className="relative aspect-[16/10] overflow-hidden bg-[var(--hb-surface)]">
      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[var(--hb-border)]/60 to-[var(--hb-card)]" />
    </div>
    <div className="space-y-3 p-4">
      <div className="h-4 w-3/4 rounded-full bg-[var(--hb-border)]/50 animate-pulse" />
      <div className="h-3 rounded-full bg-[var(--hb-border)]/40 animate-pulse" />
      <div className="flex items-center gap-2">
        <span className="h-3 w-16 rounded-full bg-[var(--hb-border)]/40 animate-pulse" />
        <span className="h-3 w-10 rounded-full bg-[var(--hb-border)]/40 animate-pulse" />
      </div>
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
    <div className="flex min-h-screen items-center justify-center bg-[var(--hb-bg)]">
      <NewsSkeletonGrid />
    </div>
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
  const rawCategory = searchParams.get('category');
  const availableCategories = getVisibleCategories({ scope: 'news' });
  const category =
    rawCategory && availableCategories.includes(rawCategory as ArticleCategory)
      ? (rawCategory as ArticleCategory)
      : null;
  const topic = searchParams.get('topic') as ArticleTopic | null;
  const normalizedTopic = topic === 'articles' ? null : topic;
  const rawTag = searchParams.get('tag');
  const tag = rawTag ? rawTag : null;

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
        if (normalizedTopic) params.set('topic', normalizedTopic);
        if (tag) params.set('tag', tag);
        params.set('status', 'published');
        params.set('limit', '20');

        const response = await fetch(`/api/articles?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch articles');
        }

        const data = await response.json();
        const articlesData = (data.data || []).filter(
          (article: ArticleWithAuthor) => article.topic !== 'reviews',
        );
        const totalCount = articlesData.length;

        startTransition(() => {
          if (!isMounted) return;
          setArticles(articlesData);
          setTotal(totalCount);
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
  }, [category, normalizedTopic, tag, refreshSignal]);

  useEffect(() => {
    const handleContentPublished = (event: Event) => {
      const customEvent = event as CustomEvent<ContentPublishedEventDetail>;
      if (customEvent?.detail?.type === 'article') {
        setRefreshSignal(signal => signal + 1);
      }
    };

    window.addEventListener(CONTENT_PUBLISHED_EVENT, handleContentPublished);
    return () => {
      window.removeEventListener(CONTENT_PUBLISHED_EVENT, handleContentPublished);
    };
  }, []);

  const categoryLabel = category ? (CATEGORY_LABELS[category] ?? null) : null;
  const topicLabel = normalizedTopic ? TOPIC_LABELS[normalizedTopic] : null;
  const metaLine = tag ? `${total} άρθρα • ${tag}` : `${total} άρθρα`;
  const shouldShowSkeleton = loading || isPending;

  const pageTitle = categoryLabel
    ? topicLabel
      ? `${topicLabel} - ${categoryLabel}`
      : categoryLabel
    : 'Άρθρα';
  const subtitle = category
    ? (CATEGORY_SUBTITLES[category] ?? 'Άρθρα και ιστορίες από όλα τα χόμπι, σε καθαρή ροή.')
    : 'Άρθρα και ιστορίες από όλα τα χόμπι, σε καθαρή ροή.';
  const emptyDescription = category
    ? `Δεν βρέθηκαν άρθρα στην κατηγορία "${categoryLabel}"`
    : 'Δεν υπάρχουν ακόμα δημοσιευμένα άρθρα';

  return (
    <PageContainer size="xl" className="py-12">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative mb-10 overflow-hidden rounded-3xl border border-[var(--hb-border)] bg-[var(--hb-panel)] px-6 py-8 shadow-xl backdrop-blur-xl md:px-10"
      >
        <PageHeader
          eyebrow="Αίθουσα Τύπου"
          title={pageTitle}
          description={subtitle}
          meta={
            <span className="rounded-full border border-[var(--hb-border)] bg-[var(--hb-surface)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--hb-muted)]">
              {metaLine}
            </span>
          }
          align="left"
          contentClassName="items-start"
          titleClassName="text-3xl font-bold md:text-4xl"
          descriptionClassName="max-w-xl text-sm text-[var(--hb-muted)]"
          eyebrowClassName="text-[var(--hb-muted)]"
          icon={
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/80 to-sky-400/40 text-white shadow-lg">
              <FileText className="h-6 w-6" />
            </span>
          }
          aside={<FilterBar scope="news" currentCategory={category} tagLabel={tag} />}
        />
      </motion.div>

      {/* Content */}
      {shouldShowSkeleton ? (
        <NewsSkeletonGrid />
      ) : error ? (
        <ErrorState error={error} />
      ) : articles.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-16 w-16 text-[var(--hb-muted)]" />}
          title="Δεν υπάρχουν άρθρα"
          description={emptyDescription}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {articles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </motion.div>
      )}
    </PageContainer>
  );
}
