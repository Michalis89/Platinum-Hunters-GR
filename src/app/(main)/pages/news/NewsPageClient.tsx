'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FileText, Clock, Eye, Heart, Calendar, User, Tag, Loader2 } from 'lucide-react';
import type { ArticleRow, ArticleCategory, ArticleTopic } from '@/types/database';
import { PageContainer, PageHeader } from '@/app/components/layout';
import { CATEGORY_LABELS, CATEGORY_SUBTITLES, TOPIC_LABELS } from '@/app/(main)/pages/news/constants';
import { normalizeSlug } from '@/utils/slugify';

interface ArticleWithAuthor extends ArticleRow {
  users?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

function ArticleCard({ article }: { article: ArticleWithAuthor }) {
  const normalizedSlug = normalizeSlug(article.slug);
  return (
    <motion.article
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
            <span className="rounded-full bg-[var(--hb-primary-strong)] px-3 py-1 text-[11px] font-semibold text-white shadow-[0_6px_18px_rgba(0,0,0,0.35)]">
              {TOPIC_LABELS[article.topic]}
            </span>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link href={`/pages/news/${normalizedSlug}`}>
          <h2 className="text-[18px] font-semibold leading-snug text-[var(--hb-headline)] transition group-hover:text-[var(--hb-primary-strong)]">
            {article.title}
          </h2>
        </Link>

        {article.description && (
          <p className="mt-2 line-clamp-2 text-sm text-[var(--hb-muted)]">{article.description}</p>
        )}

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
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
      </div>
    </motion.article>
  );
}

function NewsFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--hb-bg)]">
      <Loader2 className="h-8 w-8 animate-spin text-[var(--hb-primary)]" />
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
  const category =
    rawCategory && CATEGORY_LABELS[rawCategory as ArticleCategory]
      ? (rawCategory as ArticleCategory)
      : null;
  const topic = searchParams.get('topic') as ArticleTopic | null;
  const normalizedTopic = topic === 'articles' ? null : topic;

  const [articles, setArticles] = useState<ArticleWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (category) params.set('category', category);
        if (normalizedTopic) params.set('topic', normalizedTopic);
        params.set('status', 'published');
        params.set('limit', '20');

        const response = await fetch(`/api/articles?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch articles');
        }

        const data = await response.json();
        setArticles(data.articles || []);
        setTotal(data.total || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [category, normalizedTopic]);

  const categoryLabel = category ? CATEGORY_LABELS[category] ?? null : null;
  const topicLabel = normalizedTopic ? TOPIC_LABELS[normalizedTopic] : null;
  const metaLine = `${total} άρθρα • ενημερώνεται τακτικά`;

  const pageTitle = categoryLabel
    ? topicLabel
      ? `${topicLabel} - ${categoryLabel}`
      : categoryLabel
    : 'Άρθρα';
  const subtitle = category
    ? CATEGORY_SUBTITLES[category] ?? 'Άρθρα και ιστορίες από όλα τα χόμπι, σε καθαρή ροή.'
    : 'Άρθρα και ιστορίες από όλα τα χόμπι, σε καθαρή ροή.';

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
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--hb-primary-strong)] to-[var(--hb-accent)] text-white shadow-lg">
                <FileText className="h-6 w-6" />
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
                    href="/pages/news"
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      !category
                        ? 'bg-[var(--hb-primary-strong)]/20 ring-[var(--hb-primary-strong)]/50 text-[var(--hb-primary-strong)] ring-1'
                        : 'hover:border-[var(--hb-primary-strong)]/50 border border-[var(--hb-border)] bg-[var(--hb-surface)] text-[var(--hb-muted)] hover:text-[var(--hb-headline)]'
                    }`}
                  >
                    Όλα
                  </Link>
                  {(Object.keys(CATEGORY_LABELS) as ArticleCategory[]).map((cat) => (
                    <Link
                      key={cat}
                      href={`/pages/news?category=${cat}`}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        category === cat
                          ? 'bg-[var(--hb-primary-strong)]/20 ring-[var(--hb-primary-strong)]/50 text-[var(--hb-primary-strong)] ring-1'
                          : 'hover:border-[var(--hb-primary-strong)]/50 border border-[var(--hb-border)] bg-[var(--hb-surface)] text-[var(--hb-muted)] hover:text-[var(--hb-headline)]'
                      }`}
                    >
                      {CATEGORY_LABELS[cat] ?? cat}
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
            <Loader2 className="h-8 w-8 animate-spin text-[var(--hb-primary-strong)]" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-12 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] px-6 py-20 text-center">
            <FileText className="mx-auto mb-4 h-16 w-16 text-[var(--hb-muted)]" />
            <h2 className="mb-2 text-xl font-semibold text-[var(--hb-headline)]">
              Δεν υπάρχουν άρθρα
            </h2>
            <p className="text-[var(--hb-muted)]">
              {category
                ? `Δεν βρέθηκαν άρθρα στην κατηγορία "${categoryLabel}"`
                : 'Δεν υπάρχουν ακόμα δημοσιευμένα άρθρα'}
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </motion.div>
        )}
    </PageContainer>
  );
}
