import { withApiRoute } from '@/lib/observability/withApiRoute';

import { unstable_cache } from 'next/cache';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { sanitizeHtmlContent } from '@/utils/security/sanitizeHtml';
import { validatePlainText, validatePlainTextArray } from '@/utils/validation/text';
import { validateTipTapContent } from '@/utils/validation/tiptap';
import { normalizeSlug } from '@/utils/slugify';
import { insertActivity } from '@/lib/services/activityService';
import { getArticlesWithFilters } from '@/lib/supabase/queries';
import { API_ERRORS } from '@/lib/api/errors';
import { UnauthorizedError } from '@/lib/api/auth';
import { requireAuthorRole, ForbiddenError } from '@/lib/api/permissions';
import { fail, ok, okWithMeta } from '@/lib/api/response';
import { CACHE_CONFIG, CACHE_TAGS, revalidateCache } from '@/lib/cache/tags';

type ArticlePayloadValidationInput = {
  title?: string | null;
  description?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  tags?: string[] | null;
};

type ArticlePayloadValidationResult = { isValid: true } | { isValid: false; error: string };

function validateArticlePayload({
  title,
  description,
  meta_title,
  meta_description,
  tags,
}: ArticlePayloadValidationInput): ArticlePayloadValidationResult {
  const plainTextFieldChecks = [
    { validation: validatePlainText(title, 'Title'), fallbackError: 'Invalid title' },
    {
      validation: validatePlainText(description, 'Description'),
      fallbackError: 'Invalid description',
    },
    {
      validation: validatePlainText(meta_title, 'Meta title'),
      fallbackError: 'Invalid meta title',
    },
    {
      validation: validatePlainText(meta_description, 'Meta description'),
      fallbackError: 'Invalid meta description',
    },
  ];

  for (const check of plainTextFieldChecks) {
    if (!check.validation.isValid) {
      return { isValid: false, error: check.validation.error || check.fallbackError };
    }
  }

  const tagsValidation = validatePlainTextArray(tags, 'Tags');
  if (!tagsValidation.isValid) {
    return { isValid: false, error: tagsValidation.error || 'Invalid tags' };
  }

  return { isValid: true };
}

// GET - Fetch articles with filtering
async function GETHandler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const category = searchParams.get('category');
    const topic = searchParams.get('topic');
    const status = searchParams.get('status') || 'published';
    const authorIdParam = searchParams.get('author_id');
    const featured = searchParams.get('featured');

    // Resolve 'me' to the authenticated user's ID
    let authorId = authorIdParam;
    if (authorIdParam === 'me') {
      const supabase = await createRouteHandlerClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
      }
      authorId = session.user.id;
    }
    const mediaIdRaw = searchParams.get('media_id');
    const mediaId = mediaIdRaw ? parseInt(mediaIdRaw, 10) : null;
    const MAX_LIMIT = 100;
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), MAX_LIMIT);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    const runQuery = async (ignoreCookies = false) => {
      const supabase = await createRouteHandlerClient(undefined, { ignoreCookies });
      return getArticlesWithFilters(supabase, {
        category,
        topic,
        status,
        authorId,
        featured: featured === 'true',
        mediaId,
        limit,
        offset,
      });
    };

    const shouldUseCachedPublicQuery = status === 'published' && !authorId && !mediaId;
    if (shouldUseCachedPublicQuery) {
      const cacheKey = JSON.stringify({
        category,
        topic,
        status,
        featured: featured === 'true',
        limit,
        offset,
      });

      const getCachedArticles = unstable_cache(
        async () => {
          const { data: articles, error, count } = await runQuery(true);
          if (error) {
            throw new Error(error.message);
          }

          return {
            articles: articles ?? [],
            total: count ?? articles?.length ?? 0,
          };
        },
        ['articles-list', cacheKey],
        {
          revalidate: CACHE_CONFIG.PUBLIC_DATA.revalidate,
          tags: [CACHE_TAGS.ARTICLES],
        },
      );

      const cachedResult = await getCachedArticles();
      return okWithMeta(cachedResult.articles, { total: cachedResult.total, limit, offset });
    }

    const shouldUsePublicContext = status === 'published';
    let { data: articles, error, count } = await runQuery(shouldUsePublicContext);
    if (error && error.code === 'PGRST303') {
      const retry = await runQuery(true);
      articles = retry.data;
      error = retry.error;
      count = retry.count;
    }

    if (error) {
      console.error('Error fetching articles:', error);
      return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    }

    return okWithMeta(articles ?? [], { total: count ?? articles?.length ?? 0, limit, offset });
  } catch (error) {
    console.error('Error:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

// POST - Create new article
async function POSTHandler(req: Request) {
  try {
    const supabase = await createRouteHandlerClient();

    // Require author-level permissions (admin, owner, author, reviewer)
    const { session, user: userData } = await requireAuthorRole(supabase);

    const body = await req.json();
    const {
      title,
      slug,
      description,
      category,
      topic = 'articles',
      tags = [],
      cover_image,
      content_rich,
      content_html,
      meta_title,
      meta_description,
      status = 'draft',
      is_featured = false,
      published_at,
      score = null,
      media_id = null,
    } = body;
    const articlePayloadValidation = validateArticlePayload({
      title,
      description,
      meta_title,
      meta_description,
      tags,
    });
    if (!articlePayloadValidation.isValid) {
      return fail({ error: articlePayloadValidation.error }, 400);
    }

    // Validate content_rich JSON structure (TipTap format)
    const contentRichValidation = validateTipTapContent(content_rich);
    if (!contentRichValidation.isValid) {
      return fail({ error: contentRichValidation.error || 'Invalid content format' }, 400);
    }

    const sanitizedContentHtml = sanitizeHtmlContent(content_html).trim() || null;

    // Validate required fields
    if (!title || !slug || !category) {
      return fail({ error: 'Title, slug, and category are required' }, 400);
    }

    const normalizedSlug = normalizeSlug(slug);

    // Insert article
    const { data: article, error: insertError } = await supabase
      .from('articles')
      .insert({
        title,
        slug: normalizedSlug,
        description,
        category,
        topic,
        tags,
        cover_image,
        content_rich,
        content_html: sanitizedContentHtml,
        meta_title,
        meta_description,
        author_id: session.user.id,
        status,
        is_featured,
        published_at: status === 'published' ? published_at || new Date().toISOString() : null,
        ...(score != null ? { score: Number(score) } : {}),
        ...(media_id != null ? { media_id: Number(media_id) } : {}),
      })
      .select('*')
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return fail({ error: 'An article with this slug already exists.', code: 'CONFLICT' }, 409);
      }
      console.error('Error inserting article:', insertError);
      return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    }

    // Log activity
    await insertActivity(supabase, session.user.id, 'article_created', {
      articleId: article.id,
      articleTitle: article.title,
      articleSlug: article.slug,
      category: article.category,
      topic: article.topic,
      status: article.status,
      username: userData.username,
      display_name: userData.display_name,
      avatar_url: userData.avatar_url,
    });

    // Revalidate article caches
    revalidateCache.article(article.id);

    return ok({ message: 'Article created successfully', article }, { status: 201 });
  } catch (error) {
    console.error('Error creating article:', error);
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    if (error instanceof ForbiddenError) {
      return fail(API_ERRORS.FORBIDDEN, API_ERRORS.FORBIDDEN.status);
    }
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

export const GET = withApiRoute(GETHandler);
export const POST = withApiRoute(POSTHandler);
