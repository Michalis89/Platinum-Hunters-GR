'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Eye,
  Heart,
  User,
  Tag,
  Loader2,
  Share2,
  Pencil,
} from 'lucide-react';
import type { ArticleRow, ArticleCategory, ArticleTopic } from '@/types/database';
import { selectUser } from '@/store/slices/authSlice';
import EditArticleDialog from '@/app/components/articles/EditArticleDialog';

interface ArticleWithAuthor extends ArticleRow {
  users?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface CategoryConfig {
  label: string;
  color: string;
}

const CATEGORY_CONFIG: Record<ArticleCategory, CategoryConfig> = {
  gaming: { label: 'Gaming', color: 'from-blue-500 to-cyan-400' },
  anime: { label: 'Anime', color: 'from-pink-500 to-rose-400' },
  manga: { label: 'Manga', color: 'from-orange-500 to-amber-400' },
  books: { label: 'Βιβλία', color: 'from-emerald-500 to-green-400' },
  movies: { label: 'Movies', color: 'from-purple-500 to-violet-400' },
  tv: { label: 'TV Series', color: 'from-indigo-500 to-blue-400' },
  coding: { label: 'Coding', color: 'from-cyan-500 to-teal-400' },
  pet: { label: 'Pet', color: 'from-amber-500 to-yellow-400' },
  vape: { label: 'Vape', color: 'from-slate-400 to-slate-300' },
};

const TOPIC_LABELS: Record<ArticleTopic, string> = {
  articles: 'Άρθρα',
  reviews: 'Reviews',
  tutorials: 'Tutorials',
  guides: 'Οδηγοί',
  'weird-cases': 'Weird Cases',
  care: 'Φροντίδα',
  experiences: 'Εμπειρίες',
  health: 'Υγεία',
  devices: 'Συσκευές',
  liquids: 'Υγρά',
};

export default function ArticlePage() {
  const params = useParams();
  const slug = params?.slug as string;
  const currentUser = useSelector(selectUser);

  const [article, setArticle] = useState<ArticleWithAuthor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/articles/${slug}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Το άρθρο δεν βρέθηκε');
          }
          throw new Error('Failed to fetch article');
        }

        const data = await response.json();
        setArticle(data.article);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  const handleShare = async () => {
    if (navigator.share && article) {
      try {
        await navigator.share({
          title: article.title,
          text: article.description || '',
          url: window.location.href,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--hb-bg)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--hb-primary-strong)]" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-[var(--hb-bg)] px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-12 text-center">
            <p className="mb-4 text-red-400">{error || 'Το άρθρο δεν βρέθηκε'}</p>
            <Link
              href="/pages/news"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--hb-card)] px-4 py-2 text-sm text-[var(--hb-headline)] transition hover:bg-[var(--hb-surface)]"
            >
              <ArrowLeft size={16} />
              Πίσω στα άρθρα
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const categoryConfig = CATEGORY_CONFIG[article.category];
  const canEdit =
    !!currentUser &&
    (currentUser.role === 'admin' || (article.author_id && currentUser.id === article.author_id));

  return (
    <div className="relative min-h-screen bg-[var(--hb-bg)] text-[var(--hb-text)]">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 opacity-80 blur-[90px]">
        <div className="absolute inset-0 bg-[var(--hb-gradient)]" />
      </div>

      {/* Hero with cover image */}
      <div className="relative z-10">
        {article.cover_image ? (
          <div className="relative h-[40vh] min-h-[300px] w-full overflow-hidden">
            <Image
              src={article.cover_image}
              alt={article.title}
              fill
              sizes="100vw"
              className="object-cover"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--hb-bg)] via-[var(--hb-bg)]/50 to-transparent" />
          </div>
        ) : (
          <div className={`relative h-[30vh] min-h-[200px] bg-gradient-to-br ${categoryConfig.color}`}>
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--hb-bg)] via-[var(--hb-bg)]/50 to-transparent" />
          </div>
        )}

        {/* Back button */}
        <div className="absolute left-4 top-4 z-10">
          <Link
            href={`/pages/news?category=${article.category}`}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--hb-panel)]/80 px-3 py-2 text-sm text-[var(--hb-headline)] backdrop-blur-sm transition hover:bg-[var(--hb-card)]"
          >
            <ArrowLeft size={16} />
            Πίσω
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 pb-16">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="-mt-20 rounded-3xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 shadow-2xl backdrop-blur-xl md:p-10"
        >
          {/* Badges */}
          <div className="mb-4 flex flex-wrap gap-2">
            <span className={`rounded-full bg-gradient-to-r ${categoryConfig.color} px-4 py-1 text-sm font-semibold text-white`}>
              {categoryConfig.label}
            </span>
            <span className="rounded-full bg-[var(--hb-surface)] px-4 py-1 text-sm font-medium text-[var(--hb-muted)]">
              {TOPIC_LABELS[article.topic]}
            </span>
          </div>

          {/* Title */}
          <h1 className="mb-4 text-3xl font-bold text-[var(--hb-headline)] md:text-4xl">
            {article.title}
          </h1>

          {/* Meta */}
          <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-[var(--hb-muted)]">
            {article.users && (
              <div className="flex items-center gap-2">
                {article.users.avatar_url ? (
                  <div className="relative h-6 w-6 overflow-hidden rounded-full">
                    <Image
                      src={article.users.avatar_url}
                      alt={article.users.username}
                      fill
                      sizes="24px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <User size={16} />
                )}
                <span>{article.users.display_name || article.users.username}</span>
              </div>
            )}

            {article.published_at && (
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>{new Date(article.published_at).toLocaleDateString('el-GR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}</span>
              </div>
            )}

            {article.reading_time_minutes && (
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{article.reading_time_minutes} λεπτά ανάγνωση</span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <Eye size={14} />
              <span>{article.views} προβολές</span>
            </div>

            <div className="flex items-center gap-1">
              <Heart size={14} />
              <span>{article.likes} likes</span>
            </div>

            <button
              onClick={handleShare}
              className="ml-auto flex items-center gap-1 rounded-lg bg-[var(--hb-card)]/50 px-3 py-1 transition hover:bg-[var(--hb-surface)]"
            >
              <Share2 size={14} />
              <span>Κοινοποίηση</span>
            </button>
            {canEdit && (
              <button
                onClick={() => setIsEditOpen(true)}
                className="flex items-center gap-1 rounded-lg bg-[var(--hb-card)]/50 px-3 py-1 transition hover:bg-[var(--hb-surface)]"
              >
                <Pencil size={14} />
                <span>Επεξεργασία</span>
              </button>
            )}
          </div>

          {/* Description */}
          {article.description && (
            <p className="mb-8 text-lg leading-relaxed text-[var(--hb-text)]">
              {article.description}
            </p>
          )}

          {/* Content */}
          {article.content_html && (
            <div
              className="article-content prose prose-invert max-w-none
                prose-headings:text-[var(--hb-headline)] prose-headings:font-bold
                prose-h1:text-2xl prose-h1:mt-8 prose-h1:mb-4
                prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3
                prose-h3:text-lg prose-h3:mt-5 prose-h3:mb-2
                prose-p:text-[var(--hb-text)] prose-p:leading-relaxed prose-p:mb-4
                prose-a:text-[var(--hb-primary)] prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-[var(--hb-accent)]
                prose-strong:text-[var(--hb-headline)] prose-strong:font-semibold
                prose-em:italic
                prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4
                prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-4
                prose-li:mb-1 prose-li:text-[var(--hb-text)]
                prose-blockquote:border-l-4 prose-blockquote:border-[var(--hb-primary)] prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-[var(--hb-muted)] prose-blockquote:my-6
                prose-code:bg-[var(--hb-surface)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[var(--hb-primary)] prose-code:text-sm prose-code:font-mono
                prose-pre:bg-[var(--hb-surface)] prose-pre:rounded-xl prose-pre:p-4 prose-pre:my-6 prose-pre:overflow-x-auto
                prose-img:rounded-xl prose-img:my-6 prose-img:max-w-full prose-img:h-auto
                prose-hr:border-[var(--hb-border)] prose-hr:my-8"
              dangerouslySetInnerHTML={{ __html: article.content_html }}
            />
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-10 border-t border-[var(--hb-border)] pt-6">
              <div className="flex flex-wrap items-center gap-2">
                <Tag size={16} className="text-[var(--hb-muted)]" />
                {article.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/pages/news?category=${article.category}`}
                    className="rounded-full bg-[var(--hb-card)]/70 px-3 py-1 text-sm text-[var(--hb-muted)] transition hover:bg-[var(--hb-surface)] hover:text-[var(--hb-headline)]"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </motion.article>
      </div>
      {article && (
        <EditArticleDialog
          isOpen={isEditOpen}
          article={article}
          onClose={() => setIsEditOpen(false)}
          onSuccess={updated => setArticle(updated)}
        />
      )}
    </div>
  );
}
