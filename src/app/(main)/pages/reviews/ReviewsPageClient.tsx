'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, Clock, Eye, Heart, Calendar, User, Tag } from 'lucide-react';
import type { ArticleCategory, ArticleRow } from '@/types/database';
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
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';
import { CATEGORY_LABELS } from '@/app/(main)/pages/news/constants';
import { normalizeSlug } from '@/utils/slugify';
import CategoryFilter from '@/app/(main)/pages/_shared/CategoryFilter';
import { getVisibleCategories } from '@/app/(main)/pages/_shared/categories';

interface ArticleWithAuthor extends ArticleRow {
  users?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

function ReviewCard({ article }: { article: ArticleWithAuthor }) {
  const normalizedSlug = normalizeSlug(article.slug);
  const MotionCard = motion(Card);

  return (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="hover:border-[var(--hb-primary-strong)]/50 group relative overflow-hidden rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] shadow-[var(--hb-shadow-md)] transition hover:shadow-[var(--hb-shadow-md-hover)]"
    >
      {/* Cover Image */}
      <Link href={`/pages/reviews/${normalizedSlug}`} className="block">
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
              <Star size={48} className="text-white/50" />
            </div>
          )}
          {/* Category Badge */}
          <div className="absolute left-3 top-3">
            <span className="rounded-full bg-[var(--hb-primary-strong)] px-3 py-1 text-[11px] font-semibold text-white shadow-lg">
              {CATEGORY_LABELS[article.category] ?? article.category}
            </span>
          </div>
          {/* Review Badge */}
          <div className="absolute right-3 top-3">
            <span className="flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-[11px] font-semibold text-white shadow-[var(--hb-shadow-md)]">
              <Star size={10} className="fill-current" />
              Review
            </span>
          </div>
        </div>
      </Link>

      <CardHeader className="border-b-0 p-4 pb-0">
        <Link href={`/pages/reviews/${normalizedSlug}`}>
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
                href={`/pages/reviews?tag=${encodeURIComponent(tag)}`}
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
}

function ReviewsFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--hb-bg)]">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export default function ReviewsPageClient() {
  return (
    <Suspense fallback={<ReviewsFallback />}>
      <ReviewsPageContent />
    </Suspense>
  );
}

function ReviewsPageContent() {
  const searchParams = useSearchParams();
  const rawCategory = searchParams.get('category');
  const allowedCategories = getVisibleCategories({ scope: 'reviews' });
  const category =
    rawCategory && allowedCategories.includes(rawCategory as ArticleCategory)
      ? (rawCategory as ArticleCategory)
      : null;
  const rawTag = searchParams.get('tag');
  const tag = rawTag ? rawTag : null;

  const [articles, setArticles] = useState<ArticleWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (category) params.set('category', category);
        if (tag) params.set('tag', tag);
        params.set('topic', 'reviews'); // Always fetch reviews
        params.set('status', 'published');
        params.set('limit', '20');

        const response = await fetch(`/api/articles?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch reviews');
        }

        const data = await response.json();
        setArticles(data.data || []);
        setTotal(data.meta?.total || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [category, tag]);

  const categoryLabel = category ? (CATEGORY_LABELS[category] ?? null) : null;
  const metaLine = tag ? `${total} reviews • ${tag}` : `${total} reviews`;

  const pageTitle = categoryLabel ? `Reviews - ${categoryLabel}` : 'Reviews';
  const subtitle = categoryLabel
    ? `Κριτικές και reviews για ${categoryLabel} από την κοινότητα.`
    : 'Κριτικές και reviews για games, anime, ταινίες, σειρές και βιβλία από την κοινότητα.';
  const emptyDescription = categoryLabel
    ? `Δεν βρέθηκαν reviews στην κατηγορία "${categoryLabel}"`
    : 'Δεν υπάρχουν ακόμα δημοσιευμένα reviews';

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
          eyebrow="Κριτικές"
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
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg">
              <Star className="h-6 w-6" />
            </span>
          }
          aside={
            <div className="bg-[var(--hb-card)]/40 rounded-2xl border border-[var(--hb-border)] p-3 shadow-[var(--hb-shadow-md)]">
              <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-[var(--hb-muted)]">
                <span>Κατηγορίες</span>
                <span className="text-[10px]">
                  {categoryLabel ? `Φίλτρο: ${categoryLabel}` : 'Όλες'}
                </span>
              </div>
              <CategoryFilter scope="reviews" currentCategory={category} />
              {tag && (
                <div className="mt-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[var(--hb-muted)]">
                  <Tag size={12} />
                  <span>{tag}</span>
                </div>
              )}
            </div>
          }
        />
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <ErrorState error={error} />
      ) : articles.length === 0 ? (
        <EmptyState
          icon={<Star className="h-16 w-16 text-[var(--hb-muted)]" />}
          title="Δεν υπάρχουν reviews"
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
            <ReviewCard key={article.id} article={article} />
          ))}
        </motion.div>
      )}
    </PageContainer>
  );
}
