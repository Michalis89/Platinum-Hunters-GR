import Image from 'next/image';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, Eye, Heart, User } from 'lucide-react';
import type { ArticleRow } from '@/types/database';
import ActionRow from '@/app/components/article/ActionRow.client';
import Button from '@/app/components/ui/Button';
import ReadingProgress from '@/app/components/article/ReadingProgress.client';
import { buildMetadata } from '@/utils/seo/metadata/helpers';
import StructuredData from '@/utils/seo/StructuredData';
import {
  getArticleStructuredData,
  getBreadcrumbStructuredData,
} from '@/utils/seo/metadata/structuredData';
import { SITE_URL } from '@/config/site';
import { CATEGORY_LABELS, TOPIC_LABELS } from '@/app/(main)/pages/news/constants';
import { sanitizeHtmlContent } from '@/utils/security/sanitizeHtml';

interface ArticleWithAuthor extends ArticleRow {
  users?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}


async function getArticle(slug: string): Promise<ArticleWithAuthor | null> {
  const headersList = await headers();
  const protocol = headersList.get('x-forwarded-proto') ?? 'http';
  const host = headersList.get('host');
  const baseUrl = host ? `${protocol}://${host}` : '';

  const response = await fetch(`${baseUrl}/api/articles/${slug}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { article?: ArticleWithAuthor };
  return data.article ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);
  const path = `/pages/news/${slug}`;

  if (!article) {
    return buildMetadata({
      title: 'Άρθρο | Χομπίστας',
      description: 'Το άρθρο που ζήτησες δεν είναι διαθέσιμο αυτή τη στιγμή.',
      path,
    });
  }

  const authorName = article.users?.display_name || article.users?.username || 'Χομπίστας';
  const coverImage = article.cover_image ?? undefined;
  const metaTitle = article.meta_title || article.title;
  const metaDescription =
    article.meta_description ||
    article.description ||
    'Διάβασε το άρθρο και ανακάλυψε ιδέες, εμπειρίες και πρακτικά guides στον Χομπίστα.';

  return buildMetadata({
    title: `${metaTitle} | Χομπίστας`,
    description: metaDescription,
    path: `/pages/news/${article.slug}`,
    openGraphType: 'article',
    publishedTime: article.published_at ?? undefined,
    authors: [authorName],
    images: coverImage ? [{ url: coverImage, alt: article.title }] : undefined,
  });
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const headersList = await headers();
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('el-GR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const readTime = article.reading_time_minutes
    ? `${article.reading_time_minutes} λεπτά`
    : null;

  const referer = headersList.get('referer');
  const host = headersList.get('host');
  const protocol = headersList.get('x-forwarded-proto') ?? 'http';
  const baseUrl = host ? `${protocol}://${host}` : '';
  const fallbackHref = `/pages/news?category=${article.category}`;
  let backHref = fallbackHref;

  if (referer && baseUrl && referer.startsWith(baseUrl)) {
    try {
      const url = new URL(referer);
      const path = `${url.pathname}${url.search}`;
      if (path.startsWith('/pages/news')) {
        backHref = path;
      }
    } catch {
      backHref = fallbackHref;
    }
  }

  const articleUrl = `${SITE_URL}/pages/news/${article.slug}`;
  const sanitizedContentHtml = sanitizeHtmlContent(article.content_html).trim();
  const breadcrumbItems = [
    { name: 'Αρχική', url: `${SITE_URL}/` },
    { name: 'Άρθρα', url: `${SITE_URL}/pages/news` },
    {
      name: CATEGORY_LABELS[article.category] ?? article.category,
      url: `${SITE_URL}/pages/news?category=${article.category}`,
    },
    { name: article.title, url: articleUrl },
  ];

  return (
    <div className="relative min-h-screen bg-[var(--hb-bg)] text-[var(--hb-text)]">
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
      <div className="relative h-[40vh] min-h-[280px] w-full overflow-hidden">
        {article.cover_image ? (
          <Image
            src={article.cover_image}
            alt={article.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="h-full w-full bg-[var(--hb-panel)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--hb-bg)] via-[var(--hb-bg)]/60 to-transparent" />

        <div className="absolute left-4 top-4 z-10">
          <Button
            href={backHref}
            variant="secondary"
            icon={<ArrowLeft size={16} />}
            className="border-[var(--hb-border)] bg-[var(--hb-panel)]/80 text-[var(--hb-headline)] backdrop-blur-sm"
          >
            Πίσω
          </Button>
        </div>
      </div>

      {/* Masthead + Body */}
      <div className="relative mx-auto -mt-16 max-w-5xl px-4 pb-16 md:-mt-20">
        <article className="rounded-3xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 shadow-2xl backdrop-blur-xl md:p-10">
          <header className="mx-auto max-w-[760px]">
            <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[var(--hb-muted)]">
              <span className="rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)]/80 px-3 py-1">
                {CATEGORY_LABELS[article.category]}
              </span>
              <span className="rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)]/80 px-3 py-1">
                {TOPIC_LABELS[article.topic]}
              </span>
            </div>

            <h1 className="mt-4 text-[28px] font-bold leading-[1.15] tracking-tight text-[var(--hb-headline)] md:text-[38px]">
              {article.title}
            </h1>

            {article.description && (
              <p className="mt-4 text-base leading-relaxed text-[var(--hb-muted)] md:text-lg">
                {article.description}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--hb-muted)] md:text-sm">
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
                      <User size={14} />
                    )}
                    <span>{article.users.display_name || article.users.username}</span>
                  </div>
                )}

                {publishedDate && (
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>{publishedDate}</span>
                  </div>
                )}

                {readTime && (
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{readTime}</span>
                  </div>
                )}

                <div className="flex items-center gap-1 md:ml-auto">
                  <Eye size={14} />
                  <span>{article.views} προβολές</span>
                </div>

                <div className="flex items-center gap-1">
                  <Heart size={14} />
                  <span>{article.likes} likes</span>
                </div>
              </div>
              <ActionRow article={article} />
            </div>

            {article.tags && article.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {article.tags.map(tag => (
                  <span
                    key={tag}
                    className="rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)]/80 px-3 py-1 text-[11px] text-[var(--hb-text)] backdrop-blur-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {sanitizedContentHtml && (
            <section
              className="article-content mx-auto max-w-[760px] pt-8 text-[17px] leading-[1.8] text-[var(--hb-text)]
                [&_h1]:mb-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-[var(--hb-headline)]
                [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[var(--hb-headline)]
                [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-[var(--hb-headline)]
                [&_p]:mb-3
                [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6
                [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6
                [&_li]:mb-1
                [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--hb-primary)] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[var(--hb-muted)]
                [&_code]:rounded [&_code]:bg-[var(--hb-panel)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm [&_code]:text-[var(--hb-primary)]
                [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-[var(--hb-panel)] [&_pre]:p-4
                [&_pre_code]:bg-transparent [&_pre_code]:p-0
                [&_hr]:my-6 [&_hr]:border-[var(--hb-border)]
                [&_a]:text-[var(--hb-primary)] [&_a]:underline [&_a]:underline-offset-2
                [&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-lg"
              dangerouslySetInnerHTML={{ __html: sanitizedContentHtml }}
            />
          )}
        </article>
      </div>
    </div>
  );
}
