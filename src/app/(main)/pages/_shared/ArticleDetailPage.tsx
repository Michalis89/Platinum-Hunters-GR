import Image from 'next/image';
import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, Eye, FileText, Heart, Tag, User } from 'lucide-react';
import type { ArticleRow, ArticleTopic } from '@/types/database';
import ActionRow from '@/app/components/article/ActionRow.client';
import { Card, CardContent, CardDescription, CardTitle } from '@/app/components/ui/Card';
import { Button } from '@/components/ui/button';
import ReadingProgress from '@/app/components/article/ReadingProgress.client';
import EmptyState from '@/app/components/ui/EmptyState';
import { buildMetadata } from '@/utils/seo/metadata/helpers';
import StructuredData from '@/utils/seo/StructuredData';
import {
  getArticleStructuredData,
  getBreadcrumbStructuredData,
} from '@/utils/seo/metadata/structuredData';
import { SITE_URL } from '@/config/site';
import { CATEGORY_LABELS, TOPIC_LABELS } from '@/app/(main)/pages/news/constants';
import { sanitizeHtmlContent } from '@/utils/security/sanitizeHtml';
import getSupabaseServer from '@/lib/supabase-server';
import { normalizeSlug } from '@/utils/slugify';
import ArticleComments from '@/app/components/article/ArticleComments.client';
import ArticleAuthHint from '@/app/components/article/ArticleAuthHint.client';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { FormattedDate } from '@/app/components/ui/FormattedDate';

type MaybePromise<T> = T | Promise<T>;

interface ArticleWithAuthor extends ArticleRow {
  users?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface ArticleDetailPageOptions {
  basePath: `/pages/${string}`;
  breadcrumbLabel: string;
  topicFilter?: ArticleTopic;
  designVariant?: 'default' | 'apple';
}

export interface ArticleDetailPageProps extends ArticleDetailPageOptions {
  params: MaybePromise<{ slug: string }>;
}

interface ArticleMetadataArgs {
  params: MaybePromise<{ slug: string }>;
  options: ArticleDetailPageOptions;
}

type HeadingData = {
  id: string;
  title: string;
};

type RelatedArticle = Pick<
  ArticleRow,
  | 'id'
  | 'slug'
  | 'title'
  | 'description'
  | 'cover_image'
  | 'category'
  | 'topic'
  | 'published_at'
  | 'views'
  | 'likes'
>;

const buildSlugCandidates = (value: string) => {
  const normalized = normalizeSlug(value);
  return Array.from(
    new Set(
      [value, normalized, `-${normalized}`, `${normalized}-`, `-${normalized}-`].filter(
        candidate => candidate && candidate !== '-',
      ),
    ),
  );
};

const TOC_MIN_HEADINGS = 3;
const HEADING_REGEX = /<h2([^>]*)>(.*?)<\/h2>/gi;

function enrichContentHeadings(html: string) {
  const headings: HeadingData[] = [];
  const slugCounts = new Map<string, number>();

  const enriched = html.replace(HEADING_REGEX, (match, attrs, inner) => {
    const textContent = inner.replace(/<[^>]+>/g, '').trim();
    if (!textContent) {
      return match;
    }

    const normalizedAttrs = attrs ?? '';
    const existingIdMatch = normalizedAttrs.match(/id\s*=\s*["']([^"']+)["']/i);
    let headingId = existingIdMatch?.[1];

    const decodedTitle = textContent.replace(/&amp;+/gi, '&');
    const baseId = normalizeSlug(decodedTitle) || 'section';
    const occurrence = slugCounts.get(baseId) ?? 0;
    const slugId = occurrence === 0 ? baseId : `${baseId}-${occurrence}`;
    slugCounts.set(baseId, occurrence + 1);

    if (!headingId) {
      headingId = slugId;
    } else {
      headingId = slugId;
    }

    const attrsWithoutId = normalizedAttrs.replace(/id\s*=\s*["'][^"']+["']/i, '').trim();
    const attrWithId = attrsWithoutId ? `${attrsWithoutId} id="${headingId}"` : `id="${headingId}"`;
    const normalizedAttrString = attrWithId.trim() ? ` ${attrWithId.trim()}` : '';

    headings.push({ id: headingId, title: decodedTitle });
    return `<h2${normalizedAttrString}>${inner}</h2>`;
  });

  return { html: enriched, headings };
}

async function fetchRelatedArticles(
  article: ArticleWithAuthor,
  limit = 3,
): Promise<RelatedArticle[]> {
  const supabase = getSupabaseServer();
  const buildQuery = (filters: { topic?: ArticleTopic | null; category?: string | null }) => {
    let query = supabase
      .from('articles')
      .select(
        'id, slug, title, description, cover_image, category, topic, published_at, views, likes',
      )
      .eq('status', 'published')
      .neq('id', article.id)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (filters.topic) {
      query = query.eq('topic', filters.topic);
    }
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    return query;
  };

  const execute = async (filters: { topic?: ArticleTopic | null; category?: string | null }) => {
    const { data, error } = await buildQuery(filters);
    if (error) {
      console.error('Related articles fetch error:', error);
      return null;
    }
    return (data ?? []) as RelatedArticle[];
  };

  const byTopicAndCategory = await execute({ topic: article.topic, category: article.category });
  if (byTopicAndCategory && byTopicAndCategory.length > 0) {
    return byTopicAndCategory;
  }

  const byCategoryOnly = await execute({ category: article.category });
  if (byCategoryOnly && byCategoryOnly.length > 0) {
    return byCategoryOnly;
  }

  return [];
}

async function fetchArticle(
  slug: string,
  topicFilter?: ArticleTopic,
): Promise<ArticleWithAuthor | null> {
  const supabase = getSupabaseServer();
  const slugCandidates = buildSlugCandidates(slug);

  let query = supabase
    .from('articles')
    .select('*, users!author_id(username, display_name, avatar_url)')
    .eq('status', 'published')
    .in('slug', slugCandidates);

  if (topicFilter) {
    query = query.eq('topic', topicFilter);
  }

  const { data: article, error } = await query.limit(1).single<ArticleWithAuthor>();
  if (error || !article) {
    return null;
  }

  return article;
}

async function trackArticleView(articleId: number, userId: string | null) {
  const supabase = getSupabaseServer();
  try {
    await supabase.from('article_views').insert({
      article_id: articleId,
      user_id: userId ?? null,
    });
  } catch {
    // Tracking views is optional, swallow failures
  }
}

export async function buildArticleDetailMetadata({
  params,
  options: { basePath, topicFilter },
}: ArticleMetadataArgs) {
  const { slug } = await params;
  const article = await fetchArticle(slug, topicFilter);
  const defaultPath = `${basePath}/${slug}`;

  if (!article) {
    return buildMetadata({
      title: 'Άρθρο | Hobbistas',
      description: 'Το άρθρο που ζήτησες δεν είναι διαθέσιμο αυτή τη στιγμή.',
      path: defaultPath,
    });
  }

  const authorName = article.users?.display_name || article.users?.username || 'Hobbistas';
  const coverImage = article.cover_image ?? undefined;
  const metaTitle = article.meta_title || article.title;
  const metaDescription =
    article.meta_description ||
    article.description ||
    'Διάβασε το άρθρο και ανακάλυψε ιδέες, εμπειρίες και πρακτικά άρθρα στον Χομπίστα.';
  const normalizedSlug = normalizeSlug(article.slug);
  const canonicalPath = `${basePath}/${normalizedSlug}`;
  const modifiedTime = article.updated_at ?? article.published_at ?? undefined;

  return buildMetadata({
    title: `${metaTitle} | Hobbistas`,
    description: metaDescription,
    path: canonicalPath,
    openGraphType: 'article',
    publishedTime: article.published_at ?? undefined,
    modifiedTime,
    authors: [authorName],
    images: coverImage ? [{ url: coverImage, alt: article.title }] : undefined,
  });
}

export default async function ArticleDetailPage({
  params,
  basePath,
  breadcrumbLabel,
  topicFilter,
  designVariant = 'default',
}: ArticleDetailPageProps) {
  const { slug } = await params;
  const sessionClient = await createRouteHandlerClient();
  const {
    data: { session },
  } = await sessionClient.auth.getSession();
  const currentUserId = session?.user.id ?? null;
  const article = await fetchArticle(slug, topicFilter);

  if (!article) {
    notFound();
  }

  const isAuthorViewer =
    !!currentUserId && !!article.author_id && currentUserId === article.author_id;
  if (!isAuthorViewer) {
    await trackArticleView(article.id, currentUserId);
  }

  const headersList = await headers();
  const protocol = headersList.get('x-forwarded-proto') ?? 'http';
  const host = headersList.get('host');
  const referer = headersList.get('referer');
  const baseUrl = host ? `${protocol}://${host}` : '';
  const listBasePath = article.topic === 'reviews' ? '/pages/reviews' : '/pages/news';
  const hasCategory = Boolean(article.category);
  const fallbackHref = hasCategory ? `${listBasePath}?category=${article.category}` : listBasePath;
  let backHref = fallbackHref;

  if (referer && baseUrl && referer.startsWith(baseUrl)) {
    try {
      const url = new URL(referer);
      const path = `${url.pathname}${url.search}`;
      const isListPath = url.pathname === listBasePath || url.pathname === `${listBasePath}/`;
      if (isListPath) {
        backHref = path;
      }
    } catch {
      backHref = fallbackHref;
    }
  }

  const ARTICLE_HEADER_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  const readTime = article.reading_time_minutes ? `${article.reading_time_minutes} λεπτά` : null;
  const articleSlug = normalizeSlug(article.slug);
  const articlePath = `${basePath}/${articleSlug}`;
  const articleUrl = `${SITE_URL}${articlePath}`;
  const tagListBase = article.topic === 'reviews' ? '/pages/reviews' : '/pages/news';
  const buildTagUrl = (tag: string) => {
    const params = new URLSearchParams();
    params.set('tag', tag);
    if (article.category) {
      params.set('category', article.category);
    }
    return `${tagListBase}?${params.toString()}`;
  };
  const sanitizedContentHtml = sanitizeHtmlContent(article.content_html).trim();
  const { html: contentWithHeadingIds, headings } = enrichContentHeadings(sanitizedContentHtml);
  const shouldShowTOC = headings.length >= TOC_MIN_HEADINGS;
  const relatedArticles = await fetchRelatedArticles(article);
  const categoryLabel = CATEGORY_LABELS[article.category] ?? article.category;
  const isAppleVariant = designVariant === 'apple';
  const breadcrumbItems = [
    { name: 'Αρχική', url: `${SITE_URL}/` },
    { name: breadcrumbLabel, url: `${SITE_URL}${basePath}` },
    { name: categoryLabel, url: `${SITE_URL}${basePath}?category=${article.category}` },
    { name: article.title, url: articleUrl },
  ];
  const pageShellClass = isAppleVariant
    ? 'apple-page-background relative min-h-screen text-[var(--apple-label)]'
    : 'relative min-h-screen bg-[var(--hb-bg)] text-[var(--hb-text)]';
  const heroOverlayClass = isAppleVariant
    ? 'absolute inset-0 bg-gradient-to-t from-[var(--apple-bg)]/95 via-[var(--apple-bg)]/58 to-transparent'
    : 'via-[var(--hb-bg)]/60 absolute inset-0 bg-gradient-to-t from-[var(--hb-bg)] to-transparent';
  const articleShellClass = isAppleVariant
    ? 'apple-material-surface rounded-[28px] p-5 sm:p-8 md:p-10'
    : 'rounded-3xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-4 shadow-2xl backdrop-blur-xl sm:p-6 md:p-10';
  const badgeClass = isAppleVariant
    ? 'apple-pill inline-flex items-center px-3 py-1 text-[11px] uppercase tracking-[0.2em] apple-secondary-label'
    : 'bg-[var(--hb-panel)]/80 rounded-full border border-[var(--hb-border)] px-3 py-1';
  const metaPanelClass = isAppleVariant
    ? 'apple-card mt-6 rounded-[20px] p-4 apple-secondary-label'
    : 'bg-[var(--hb-panel)]/60 mt-6 rounded-3xl border border-[var(--hb-border)] p-4 text-[var(--hb-muted)] shadow-[var(--hb-shadow-md)]';
  const metaChipClass = isAppleVariant
    ? 'apple-pill inline-flex items-center gap-1 px-3 py-1 text-[10px] uppercase tracking-[0.2em] apple-secondary-label'
    : 'flex items-center gap-1 rounded-full border border-[var(--hb-border)] bg-[var(--hb-card)] px-3 py-1';
  const statChipClass = isAppleVariant
    ? 'apple-pill inline-flex items-center gap-1 rounded-[20px] px-3 py-2 text-xs apple-secondary-label'
    : 'flex items-center gap-1 rounded-full border border-[var(--hb-border)] px-3 py-1';
  const authorChipClass = isAppleVariant
    ? 'inline-flex items-center gap-2 rounded-[20px] border border-[var(--apple-separator)] bg-[var(--apple-tertiary-fill)] px-3 py-2 text-xs apple-secondary-label'
    : 'flex items-center gap-2 rounded-full border border-[var(--hb-border)] px-3 py-1 text-[var(--hb-muted)]';
  const squircleControlClass = isAppleVariant
    ? 'rounded-[20px] px-4 py-2.5 text-sm apple-label'
    : '';
  const tagsWrapClass = isAppleVariant
    ? 'mt-4 flex flex-wrap gap-2.5'
    : 'mt-4 flex flex-wrap gap-2';
  const tagLinkClass = isAppleVariant
    ? 'inline-flex items-center gap-2 rounded-[20px] border border-[var(--apple-separator)] bg-[var(--apple-tertiary-fill)] px-4 py-2 text-xs apple-label transition hover:border-[var(--apple-system-blue)] hover:text-[var(--apple-system-blue)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--apple-system-blue)]'
    : 'inline-flex items-center gap-2 rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-1 text-[11px] text-[var(--hb-text)] transition hover:border-[var(--hb-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hb-primary)]';
  const actionRowWrapClass = isAppleVariant
    ? 'mt-4 flex justify-center [&_a]:rounded-[20px] [&_a]:px-4 [&_a]:py-2.5 [&_button]:rounded-[20px] [&_button]:px-4 [&_button]:py-2.5'
    : 'mt-4 flex justify-center';
  const tocSummaryClass = isAppleVariant
    ? 'cursor-pointer rounded-[20px] border border-[var(--apple-separator)] bg-[var(--apple-tertiary-fill)] px-4 py-2.5 text-sm font-semibold apple-label transition hover:border-[var(--apple-system-blue)]'
    : 'cursor-pointer rounded-2xl border border-[var(--hb-border)] px-3 py-2 text-sm font-semibold text-[var(--hb-headline)] transition hover:border-[var(--hb-primary)]';
  const detailGridClass = 'mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]';
  const asideStackClass = isAppleVariant
    ? 'space-y-4 lg:sticky lg:top-24 lg:self-start'
    : 'space-y-4';
  const tocShellClass = isAppleVariant
    ? 'apple-card w-full rounded-[20px] shadow-[var(--apple-shadow)]'
    : 'w-full rounded-3xl border border-[var(--hb-border)] bg-[var(--hb-card)] shadow-[var(--hb-shadow-md)]';
  const tocHeaderClass = isAppleVariant
    ? 'apple-secondary-label flex flex-wrap items-center justify-between gap-2 border-b border-[var(--apple-separator)] px-5 py-3 text-[10px] uppercase tracking-[0.3em]'
    : 'flex flex-wrap items-center justify-between gap-2 border-b border-[var(--hb-border)] px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-[var(--hb-muted)]';
  const tocLinkClass = isAppleVariant
    ? 'inline-flex w-full rounded-[20px] px-4 py-2 text-sm apple-secondary-label transition hover:text-[var(--apple-system-blue)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--apple-system-blue)]'
    : 'inline-flex w-full rounded-md px-2 py-1 text-sm text-[var(--hb-text)] transition hover:text-[var(--hb-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hb-primary)]';
  const contentClass = isAppleVariant
    ? 'article-content apple-body-tracking mx-auto max-w-[760px] pt-8 text-base leading-[1.8] apple-label sm:text-[17px] [&_a]:apple-system-blue [&_a]:underline [&_a]:underline-offset-2 [&_a]:transition [&_a]:focus-visible:outline [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-4 [&_a]:focus-visible:outline-[var(--apple-system-blue)] [&_blockquote]:my-6 [&_blockquote]:rounded-2xl [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--apple-system-blue)] [&_blockquote]:bg-[var(--apple-tertiary-fill)] [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:italic [&_code]:rounded [&_code]:bg-[var(--apple-tertiary-fill)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm [&_code]:apple-system-blue [&_h1]:apple-title-tracking [&_h1]:mb-4 [&_h1]:mt-10 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:apple-label sm:[&_h1]:text-3xl [&_h2]:apple-title-tracking [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:scroll-mt-32 [&_h2]:text-xl [&_h2]:font-semibold sm:[&_h2]:text-2xl [&_h3]:apple-title-tracking [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:scroll-mt-28 [&_h3]:text-lg [&_h3]:font-semibold sm:[&_h3]:text-xl [&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-[20px] [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-6 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-[20px] [&_pre]:bg-[var(--apple-group-bg)] [&_pre]:p-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6'
    : 'article-content [&_blockquote]:bg-[var(--hb-primary)]/5 mx-auto max-w-[760px] pt-8 text-base leading-[1.8] text-[var(--hb-text)] sm:text-[17px] [&_a]:text-[var(--hb-primary)] [&_a]:underline [&_a]:underline-offset-2 [&_a]:transition [&_a]:focus-visible:outline [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-4 [&_a]:focus-visible:outline-[var(--hb-primary)] [&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--hb-primary)] [&_blockquote]:px-4 [&_blockquote]:py-2 [&_blockquote]:italic [&_code]:rounded [&_code]:bg-[var(--hb-panel)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm [&_code]:text-[var(--hb-primary)] [&_h1]:mb-4 [&_h1]:mt-10 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-[var(--hb-headline)] sm:[&_h1]:text-3xl [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:scroll-mt-32 [&_h2]:text-xl [&_h2]:font-semibold sm:[&_h2]:text-2xl [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:scroll-mt-28 [&_h3]:text-lg [&_h3]:font-semibold sm:[&_h3]:text-xl [&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-2xl [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-6 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-[var(--hb-panel)] [&_pre]:p-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6';
  const tocItems = headings.map(heading => (
    <li key={heading.id}>
      <a href={`#${heading.id}`} className={tocLinkClass}>
        {heading.title}
      </a>
    </li>
  ));

  return (
    <div className={pageShellClass}>
      <StructuredData
        data={getArticleStructuredData({
          title: article.title,
          description: article.description,
          url: articleUrl,
          image: article.cover_image,
          publishedAt: article.published_at,
          updatedAt: article.updated_at,
          authorName: article.users?.display_name || article.users?.username || null,
        })}
      />
      <StructuredData data={getBreadcrumbStructuredData(breadcrumbItems)} />
      <ReadingProgress />

      {/* Hero */}
      <div className="relative h-[clamp(280px,45vh,480px)] w-full overflow-hidden">
        {article.cover_image ? (
          <Image
            src={article.cover_image}
            alt={article.title}
            fill
            priority
            sizes="(min-width: 1280px) 1120px, 100vw"
            className="object-cover object-[center_35%]"
          />
        ) : (
          <div className="h-full w-full bg-[var(--hb-panel)]" />
        )}
        <div className={heroOverlayClass} />

        <div className="absolute left-4 top-4 z-10">
          <Button
            href={backHref}
            variant="secondary"
            icon={<ArrowLeft size={16} />}
            className={squircleControlClass}
          >
            Πίσω
          </Button>
        </div>
      </div>

      {/* Masthead + Body */}
      <div className="relative mx-auto -mt-14 max-w-5xl px-3 pb-16 sm:px-4 md:-mt-20">
        <article className={articleShellClass}>
          <header className="mx-auto max-w-[760px]">
            <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.2em] text-[var(--hb-muted)]">
              <span className={badgeClass}>{categoryLabel}</span>
              <span className={badgeClass}>{TOPIC_LABELS[article.topic]}</span>
            </div>

            <h1
              className={`mt-4 text-[24px] leading-[1.15] sm:text-[28px] md:text-[38px] ${
                isAppleVariant
                  ? 'apple-title-tracking apple-label font-semibold'
                  : 'font-bold tracking-tight text-[var(--hb-headline)]'
              }`}
            >
              {article.title}
            </h1>

            {article.description && (
              <p
                className={`mt-4 text-base leading-relaxed md:text-lg ${
                  isAppleVariant
                    ? 'apple-body-tracking apple-secondary-label'
                    : 'text-[var(--hb-muted)]'
                }`}
              >
                {article.description}
              </p>
            )}
          </header>

          {isAppleVariant ? (
            <>
              <div className="mx-auto max-w-[760px]">
                <div className={metaPanelClass}>
                  <div className="flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.2em]">
                    <span className={metaChipClass}>{categoryLabel}</span>
                    <span className={metaChipClass}>{TOPIC_LABELS[article.topic]}</span>
                    {article.published_at && (
                      <span className={metaChipClass}>
                        <Calendar size={12} />
                        <FormattedDate
                          date={article.published_at}
                          options={ARTICLE_HEADER_DATE_OPTIONS}
                          fallback=""
                          className="text-[10px]"
                        />
                      </span>
                    )}
                    {readTime && (
                      <span className={metaChipClass}>
                        <Clock size={12} />
                        <span className="text-[10px]">{readTime}</span>
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {article.users && (
                      <div className={authorChipClass}>
                        {article.users.avatar_url ? (
                          <div className="relative h-5 w-5 overflow-hidden rounded-full">
                            <Image
                              src={article.users.avatar_url}
                              alt={article.users.username}
                              fill
                              sizes="20px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <User size={12} />
                        )}
                        <span>{article.users.display_name || article.users.username}</span>
                      </div>
                    )}
                    <div className={statChipClass}>
                      <Eye size={12} />
                      <span>{article.views ?? 0} προβολές</span>
                    </div>
                    <div className={statChipClass}>
                      <Heart size={12} />
                      <span>{article.likes ?? 0} likes</span>
                    </div>
                  </div>
                </div>

                <div className={`${asideStackClass} mt-4`}>
                  <div className={actionRowWrapClass}>
                    <ActionRow article={article} />
                  </div>
                  <ArticleAuthHint />

                  {shouldShowTOC && (
                    <section>
                      <div className={tocShellClass}>
                        <div className={tocHeaderClass}>
                          <span>Πίνακας περιεχομένων</span>
                          <span>{headings.length} ενότητες</span>
                        </div>
                        <div className="px-4 py-4">
                          <ul className="space-y-2">{tocItems}</ul>
                        </div>
                      </div>
                    </section>
                  )}

                  {article.tags && article.tags.length > 0 && (
                    <div className={tagsWrapClass}>
                      {article.tags.map(tag => (
                        <Link key={tag} href={buildTagUrl(tag)} className={tagLinkClass}>
                          <Tag size={10} />
                          {tag}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {contentWithHeadingIds && (
                <section
                  className={contentClass}
                  dangerouslySetInnerHTML={{ __html: contentWithHeadingIds }}
                />
              )}
              <ArticleComments articleId={article.id} />
            </>
          ) : (
            <div className={detailGridClass}>
              <div>
                <div className={metaPanelClass}>
                  <div className="flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.2em]">
                    <span className={metaChipClass}>{categoryLabel}</span>
                    <span className={metaChipClass}>{TOPIC_LABELS[article.topic]}</span>
                    {article.published_at && (
                      <span className={metaChipClass}>
                        <Calendar size={12} />
                        <FormattedDate
                          date={article.published_at}
                          options={ARTICLE_HEADER_DATE_OPTIONS}
                          fallback=""
                          className="text-[10px]"
                        />
                      </span>
                    )}
                    {readTime && (
                      <span className={metaChipClass}>
                        <Clock size={12} />
                        <span className="text-[10px]">{readTime}</span>
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {article.users && (
                      <div className={authorChipClass}>
                        {article.users.avatar_url ? (
                          <div className="relative h-5 w-5 overflow-hidden rounded-full">
                            <Image
                              src={article.users.avatar_url}
                              alt={article.users.username}
                              fill
                              sizes="20px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <User size={12} />
                        )}
                        <span>{article.users.display_name || article.users.username}</span>
                      </div>
                    )}
                    <div className={statChipClass}>
                      <Eye size={12} />
                      <span>{article.views ?? 0} προβολές</span>
                    </div>
                    <div className={statChipClass}>
                      <Heart size={12} />
                      <span>{article.likes ?? 0} likes</span>
                    </div>
                  </div>
                </div>

                {shouldShowTOC && (
                  <section className="mt-8 w-full">
                    <div className={tocShellClass}>
                      <div className={tocHeaderClass}>
                        <span>Πίνακας περιεχομένων</span>
                        <span>{headings.length} ενότητες</span>
                      </div>
                      <div className="px-5 py-4">
                        <details className="md:hidden">
                          <summary className={tocSummaryClass}>Εμφάνιση</summary>
                          <ul className="mt-3 space-y-2">{tocItems}</ul>
                        </details>
                        <div className="hidden md:block">
                          <ul className="grid gap-3 md:grid-cols-2">{tocItems}</ul>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {contentWithHeadingIds && (
                  <section
                    className={contentClass}
                    dangerouslySetInnerHTML={{ __html: contentWithHeadingIds }}
                  />
                )}
                <ArticleComments articleId={article.id} />
              </div>

              <aside className={asideStackClass}>
                <div className={actionRowWrapClass}>
                  <ActionRow article={article} />
                </div>
                <ArticleAuthHint />
              </aside>
            </div>
          )}

          <div className="mt-12 border-t border-[var(--hb-border)] pt-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight text-[var(--hb-headline)]">
                Σχετικά άρθρα
              </h2>
              <Link
                href={basePath}
                className="text-sm font-semibold text-[var(--hb-primary)] underline-offset-4 transition hover:underline"
              >
                Δες όλα
              </Link>
            </div>
            {relatedArticles.length > 0 ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedArticles.map(related => {
                  const relatedHref = `${basePath}/${related.slug}`;

                  return (
                    <Card
                      key={related.id}
                      className="group overflow-hidden rounded-3xl border border-[var(--hb-border)] bg-[var(--hb-card)] shadow-[var(--hb-shadow-md)] transition hover:shadow-[var(--hb-shadow-lg)]"
                    >
                      <Link href={relatedHref} className="block">
                        <div className="relative h-36 w-full overflow-hidden bg-[var(--hb-surface)]">
                          {related.cover_image ? (
                            <Image
                              src={related.cover_image}
                              alt={related.title}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              className="object-cover transition duration-300 group-hover:scale-[1.02]"
                            />
                          ) : (
                            <div className="bg-[var(--hb-primary)]/20 flex h-full items-center justify-center">
                              <FileText size={32} className="text-[var(--hb-primary)]" />
                            </div>
                          )}
                        </div>
                      </Link>
                      <CardContent className="px-4 pb-4 pt-3">
                        <Link href={relatedHref}>
                          <CardTitle className="text-[16px] leading-snug text-[var(--hb-headline)] transition-colors group-hover:text-[var(--hb-primary)]">
                            {related.title}
                          </CardTitle>
                        </Link>
                        {related.description && (
                          <CardDescription className="mt-2 line-clamp-2 text-sm text-[var(--hb-muted)]">
                            {related.description}
                          </CardDescription>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-[var(--hb-muted)]">
                          {related.published_at && (
                            <div className="flex items-center gap-1">
                              <Calendar size={12} />
                              <FormattedDate
                                date={related.published_at}
                                className="text-[10px]"
                                fallback=""
                              />
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Eye size={12} />
                            <span>{related.views ?? 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart size={12} />
                            <span>{related.likes ?? 0}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6">
                <EmptyState
                  title="Δεν υπάρχουν σχετικά άρθρα"
                  description="Δοκίμασε ξανά αργότερα ή επέλεξε άλλη κατηγορία."
                />
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
