'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, Clock, Eye, Heart, Calendar, User, Tag } from 'lucide-react';
import type { ArticleRow } from '@/types/database';
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

// Review-specific categories (gaming + media categories + vape)
const REVIEW_CATEGORIES: Record<string, string> = {
  gaming: 'Gaming',
  anime: 'Anime',
  manga: 'Manga',
  movies: 'Ταινίες',
  tv: 'Σειρές',
  vape: 'Vape',
};

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
      className="hover:border-[var(--hb-primary-strong)]/50 group relative overflow-hidden rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] shadow-[0_16px_40px_rgba(0,0,0,0.25)] transition hover:shadow-[0_18px_48px_rgba(0,0,0,0.35)]"
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
              unoptimized
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
            <span className="flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-[11px] font-semibold text-white shadow-[0_6px_18px_rgba(0,0,0,0.35)]">
              <Star size={10} className="fill-current" />
              Review
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
          <CardDescription className="mt-2 line-clamp-2">
            {article.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-3">
        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {article.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--hb-border)] bg-[var(--hb-surface)] px-2.5 py-0.5 text-[11px] text-[var(--hb-muted)]"
              >
                <Tag size={10} />
                {tag}
              </span>
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
  const category = rawCategory && REVIEW_CATEGORIES[rawCategory] ? rawCategory : null;

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
  }, [category]);

  const categoryLabel = category ? REVIEW_CATEGORIES[category] ?? null : null;
  const metaLine = `${total} reviews • ενημερώνεται τακτικά`;

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
        className="relative mb-10 overflow-hidden rounded-3xl border border-[var(--hb-border)] bg-[var(--hb-panel)] px-6 py-8 shadow-2xl backdrop-blur-xl md:px-10"
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
            <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)]/40 p-3 shadow-[0_12px_28px_rgba(0,0,0,0.25)]">
              <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-[var(--hb-muted)]">
                <span>Κατηγορίες</span>
                <span className="text-[10px]">
                  {categoryLabel ? `Φίλτρο: ${categoryLabel}` : 'Όλες'}
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <Link
                  href="/pages/reviews"
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    !category
                      ? 'bg-amber-500/20 ring-amber-500/50 text-amber-400 ring-1'
                      : 'hover:border-amber-500/50 border border-[var(--hb-border)] bg-[var(--hb-surface)] text-[var(--hb-muted)] hover:text-[var(--hb-headline)]'
                  }`}
                >
                  Όλα
                </Link>
                {Object.entries(REVIEW_CATEGORIES).map(([cat, label]) => (
                  <Link
                    key={cat}
                    href={`/pages/reviews?category=${cat}`}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      category === cat
                        ? 'bg-amber-500/20 ring-amber-500/50 text-amber-400 ring-1'
                        : 'hover:border-amber-500/50 border border-[var(--hb-border)] bg-[var(--hb-surface)] text-[var(--hb-muted)] hover:text-[var(--hb-headline)]'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
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
          {articles.map((article) => (
            <ReviewCard key={article.id} article={article} />
          ))}
        </motion.div>
      )}
    </PageContainer>
  );
}
