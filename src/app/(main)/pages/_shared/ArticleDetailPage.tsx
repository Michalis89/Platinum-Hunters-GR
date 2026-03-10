import { CoverHeroImage, CoverThumbImage } from '@/components/ui/cover-image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, Eye, FileText, Heart } from 'lucide-react';
import type { ArticleCategory, ArticleRow, ArticleTopic } from '@/types/database';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import ReadingProgress from '@/app/components/article/ReadingProgress.client';
import EmptyState from '@/components/ui/empty';
import { buildMetadata } from '@/utils/seo/metadata/helpers';
import StructuredData from '@/utils/seo/StructuredData';
import { getBreadcrumbStructuredData } from '@/utils/seo/metadata/structuredData';
import { SITE_URL } from '@/config/site';
import { CATEGORY_LABELS, TOPIC_LABELS } from '@/app/(main)/articles/constants';
import { sanitizeHtmlContent } from '@/utils/security/sanitizeHtml';
import getSupabaseServer from '@/lib/supabase-server';
import { normalizeSlug } from '@/utils/slugify';
import ArticleComments from '@/app/components/article/ArticleComments.client';
import ArticleAuthHint from '@/app/components/article/ArticleAuthHint.client';
import { FormattedDate } from '@/utils/components/FormattedDate';
import { buildArticleJsonLd, buildReviewJsonLd } from '@/lib/seo/jsonld';
import MetaActionsBar from '@/app/components/article/MetaActionsBar';
import { ArticleContent } from '@/components/article/ArticleContent';
import { ARTICLE_SUBTITLE, ARTICLE_TITLE } from '@/components/article/typography';
import TrackArticleView from '@/app/components/article/TrackArticleView.client';

type MaybePromise<T> = T | Promise<T>;

interface ArticleWithAuthor extends ArticleRow {
  users?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

type ArticleMetadataRow = Pick<
  ArticleRow,
  | 'slug'
  | 'title'
  | 'description'
  | 'meta_title'
  | 'meta_description'
  | 'cover_image'
  | 'published_at'
  | 'updated_at'
  | 'topic'
  | 'tags'
  | 'category'
> & {
  users?: {
    username: string;
    display_name: string | null;
  } | null;
};

export interface ArticleDetailPageOptions {
  basePath: `/${string}`;
  breadcrumbLabel: string;
  topicFilter?: ArticleTopic;
}

export interface ArticleDetailPageProps extends ArticleDetailPageOptions {
  params: MaybePromise<{ slug: string }>;
}

interface ArticleMetadataArgs {
  params: MaybePromise<{ slug: string }>;
  options: ArticleDetailPageOptions;
}

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

const HEADING_REGEX = /<h2([^>]*)>(.*?)<\/h2>/gi;
const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

const truncateForMeta = (value: string, maxLength = 160) => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
};

function enrichContentHeadings(html: string) {
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

    return `<h2${normalizedAttrString}>${inner}</h2>`;
  });

  return enriched;
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

  // Use live likes count from the relation table so UI stays accurate even if
  // the denormalized `articles.likes` column is stale.
  const { count: liveLikesCount } = await supabase
    .from('article_likes')
    .select('*', { count: 'exact', head: true })
    .eq('article_id', article.id);

  if (typeof liveLikesCount === 'number') {
    article.likes = liveLikesCount;
  }

  return article;
}

async function fetchArticleMetadata(
  slug: string,
  topicFilter?: ArticleTopic,
): Promise<ArticleMetadataRow | null> {
  const supabase = getSupabaseServer();
  const slugCandidates = buildSlugCandidates(slug);

  let query = supabase
    .from('articles')
    .select(
      'slug, title, description, meta_title, meta_description, cover_image, published_at, updated_at, topic, tags, category, users!author_id(username, display_name)',
    )
    .eq('status', 'published')
    .in('slug', slugCandidates);

  if (topicFilter) {
    query = query.eq('topic', topicFilter);
  }

  const { data: article, error } = await query.limit(1).single<ArticleMetadataRow>();
  if (error || !article) {
    return null;
  }

  return article;
}

export async function buildArticleDetailMetadata({
  params,
  options: { basePath, topicFilter },
}: ArticleMetadataArgs) {
  const { slug } = await params;
  const article = await fetchArticleMetadata(slug, topicFilter);

  if (!article) {
    notFound();
  }

  const authorName = article.users?.display_name || article.users?.username || 'Hobbistas';
  const coverImage = article.cover_image ?? undefined;
  const metaTitle = article.meta_title || article.title;
  const rawMetaDescription =
    article.meta_description ||
    article.description ||
    'Stay tuned for updates or explore another story while we resolve this.';
  const metaDescription = truncateForMeta(rawMetaDescription);
  const normalizedSlug = normalizeSlug(article.slug);
  const canonicalPath = `${basePath}/${normalizedSlug}`;
  const modifiedTime = article.updated_at ?? article.published_at ?? undefined;

  return buildMetadata({
    title: metaTitle,
    description: metaDescription,
    path: canonicalPath,
    openGraphType: 'article',
    publishedTime: article.published_at ?? undefined,
    modifiedTime,
    authors: [authorName],
    images: coverImage
      ? [{ url: coverImage, alt: article.title, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT }]
      : undefined,
  });
}

export default async function ArticleDetailPage({
  params,
  basePath,
  breadcrumbLabel,
  topicFilter,
}: ArticleDetailPageProps) {
  const { slug } = await params;
  const isPublicReviewPage = basePath === '/review';
  let currentUserId: string | null = null;
  let showSocialLayerSections = false;
  try {
    const { createRouteHandlerClient } = await import('@/lib/supabase-route-handler');
    const sessionClient = await createRouteHandlerClient();
    const {
      data: { session },
    } = await sessionClient.auth.getSession();
    currentUserId = session?.user.id ?? null;

    if (currentUserId) {
      const { getUserSettings } = await import('@/lib/settings');
      const settings = await getUserSettings(currentUserId, { supabase: sessionClient });
      showSocialLayerSections = settings.social_enabled;
    }
  } catch {
    // Public rendering should not fail when auth cookies are stale/expired
    // or settings fetch fails.
    currentUserId = null;
    showSocialLayerSections = false;
  }
  const showEngagementUi = Boolean(currentUserId) && showSocialLayerSections;
  const article = await fetchArticle(slug, topicFilter);

  if (!article) {
    notFound();
  }

  const listBasePath = article.topic === 'reviews' ? '/review' : '/articles';
  const hasCategory = Boolean(article.category);
  const ARTICLE_HEADER_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  const readTime = article.reading_time_minutes ? `${article.reading_time_minutes} min read` : null;
  const articleSlug = normalizeSlug(article.slug);
  const articlePath = `${basePath}/${articleSlug}`;
  const articleUrl = `${SITE_URL}${articlePath}`;
  const sanitizedContentHtml = sanitizeHtmlContent(article.content_html).trim();
  const contentWithHeadingIds = enrichContentHeadings(sanitizedContentHtml);
  const relatedArticles = await fetchRelatedArticles(article);
  const relatedContentLabel = article.topic === 'reviews' ? 'reviews' : 'articles';
  const categoryLabel = CATEGORY_LABELS[article.category] ?? article.category;
  const uiBreadcrumbs = [
    { label: 'Home', href: '/dashboard' },
    { label: breadcrumbLabel, href: basePath },
    ...(hasCategory ? [{ label: categoryLabel, href: `${basePath}?category=${article.category}` }] : []),
    { label: article.title },
  ];

  const breadcrumbItems = [
    { name: 'Home', url: `${SITE_URL}/` },
    { name: breadcrumbLabel, url: `${SITE_URL}${basePath}` },
    { name: categoryLabel, url: `${SITE_URL}${basePath}?category=${article.category}` },
    { name: article.title, url: articleUrl },
  ];
  const articleDescription =
    article.meta_description || article.description || 'Explore this entry on Hobbistas.';
  const NON_REVIEW_SCHEMA_CATEGORIES: ArticleCategory[] = ['coding'];
  const useReviewSchema =
    article.topic === 'reviews' && !NON_REVIEW_SCHEMA_CATEGORIES.includes(article.category);
  const jsonLd = useReviewSchema
    ? buildReviewJsonLd({
        title: article.title,
        description: articleDescription,
        url: articleUrl,
        image: article.cover_image,
        publishedAt: article.published_at,
        updatedAt: article.updated_at,
        authorName: article.users?.display_name || article.users?.username || null,
        category: article.category,
        tags: article.tags,
        score: article.score,
      })
    : buildArticleJsonLd({
        title: article.title,
        description: articleDescription,
        url: articleUrl,
        image: article.cover_image,
        publishedAt: article.published_at,
        updatedAt: article.updated_at,
        authorName: article.users?.display_name || article.users?.username || null,
        tags: article.tags,
      });
  const jsonLdMarkup = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {isPublicReviewPage && currentUserId !== article.author_id ? (
        <TrackArticleView articleId={article.id} />
      ) : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdMarkup }} />
      <StructuredData data={getBreadcrumbStructuredData(breadcrumbItems)} />
      <ReadingProgress />

      {/* Hero */}
      <div className="relative h-[clamp(280px,45vh,480px)] w-full">
        {article.cover_image ? (
          <CoverHeroImage
            src={article.cover_image}
            alt={article.title}
            priority
            sizes="(min-width: 1280px) 1120px, 100vw"
            className="object-cover object-[center_35%]"
          />
        ) : (
          <div className="h-full w-full bg-card" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

      </div>

      {/* Masthead + Body */}
      <div className="relative mx-auto -mt-14 max-w-5xl px-3 pb-16 sm:px-4 md:-mt-20">
        <article className="rounded-3xl border border-border bg-card p-4 shadow-2xl sm:p-6 md:p-10">
          <header className="mx-auto">
            <Breadcrumbs items={uiBreadcrumbs} className="mb-4" />

            <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              <span className="rounded-full border border-border bg-card/80 px-3 py-1">
                {categoryLabel}
              </span>
              <span className="rounded-full border border-border bg-card/80 px-3 py-1">
                {TOPIC_LABELS[article.topic]}
              </span>
              {article.topic === 'reviews' && article.score != null && (
                <span className="rounded-full border border-border bg-card/80 px-3 py-1">
                  ⭐ {article.score} / 10
                </span>
              )}
            </div>

            <h1 className={ARTICLE_TITLE}>{article.title}</h1>

            {article.description && <p className={ARTICLE_SUBTITLE}>{article.description}</p>}
          </header>

          <div className="mt-8">
            <div>
              <MetaActionsBar
                article={article}
                readTime={readTime}
                dateOptions={ARTICLE_HEADER_DATE_OPTIONS}
                showEngagementMetrics={showEngagementUi}
                showActions={showEngagementUi}
              />

              {showEngagementUi && (
                <section className="mt-3 space-y-3">
                  <ArticleAuthHint />
                </section>
              )}

              {contentWithHeadingIds && <ArticleContent html={contentWithHeadingIds} />}
              {showEngagementUi && <ArticleComments articleId={article.id} />}
            </div>
          </div>

          <div className="mt-12 border-t border-border pt-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                {`Related ${relatedContentLabel}`}
              </h2>
              <Link
                href={basePath}
                className="text-sm font-semibold text-primary underline-offset-4 transition hover:underline"
              >
                See all
              </Link>
            </div>
            {relatedArticles.length > 0 ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedArticles.map(related => {
                  const relatedHref = `${basePath}/${related.slug}`;

                  return (
                    <Card
                      key={related.id}
                      className="group rounded-3xl border border-border bg-card shadow-md transition hover:shadow-lg"
                    >
                      <Link href={relatedHref} className="block">
                        <div className="relative h-36 w-full bg-muted">
                          {related.cover_image ? (
                            <CoverThumbImage
                              src={related.cover_image}
                              alt={related.title}
                              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              className="object-cover transition duration-300 group-hover:scale-[1.02]"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-primary/20">
                              <FileText size={32} className="text-primary" />
                            </div>
                          )}
                        </div>
                      </Link>
                      <CardContent className="px-4 pb-4 pt-3">
                        <Link href={relatedHref}>
                          <CardTitle className="text-[16px] leading-snug text-foreground transition-colors group-hover:text-primary">
                            {related.title}
                          </CardTitle>
                        </Link>
                        {related.description && (
                          <CardDescription className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                            {related.description}
                          </CardDescription>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
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
                          {showEngagementUi ? (
                            <>
                              <div className="flex items-center gap-1">
                                <Eye size={12} />
                                <span>{related.views ?? 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart size={12} />
                                <span>{related.likes ?? 0}</span>
                              </div>
                            </>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-border bg-card p-6">
                <EmptyState
                  title={`No related ${relatedContentLabel} yet`}
                  description="Try refreshing the page or explore a different topic."
                />
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
