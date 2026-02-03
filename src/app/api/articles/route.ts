import { withApiRoute } from '@/lib/observability/withApiRoute';

import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { sanitizeHtmlContent } from '@/utils/security/sanitizeHtml';
import { validatePlainText, validatePlainTextArray } from '@/utils/validation/text';
import { validateTipTapContent } from '@/utils/validation/tiptap';
import { normalizeSlug } from '@/utils/slugify';
import { insertActivity } from '@/lib/services/activityService';
import { getArticlesWithFilters } from '@/lib/supabase/queries';
import { API_ERRORS } from '@/lib/api/errors';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { fail, ok, okWithMeta } from '@/lib/api/response';
import { revalidateCache } from '@/lib/cache/tags';
import { hasAnyRole } from '@/lib/roles';

// GET - Fetch articles with filtering
async function GETHandler(req: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    const { searchParams } = new URL(req.url);

    const category = searchParams.get('category');
    const topic = searchParams.get('topic');
    const status = searchParams.get('status') || 'published';
    const authorId = searchParams.get('author_id');
    const featured = searchParams.get('featured');
    const MAX_LIMIT = 100;
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), MAX_LIMIT);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    const { data: articles, error, count } = await getArticlesWithFilters(supabase, {
      category,
      topic,
      status,
      authorId,
      featured: featured === 'true',
      limit,
      offset,
    });

    if (error) {
      console.error('Error fetching articles:', error);
      return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    }

    return okWithMeta(
      articles ?? [],
      { total: count ?? articles?.length ?? 0, limit, offset },
    );
  } catch (error) {
    console.error('Error:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

// POST - Create new article
async function POSTHandler(req: Request) {
  try {
    const supabase = await createRouteHandlerClient();

    const session = await requireAuth(supabase);

    // Check if user has permission (admin or author)
    const { data: userData } = await supabase
      .from('users')
      .select('role, roles, username, display_name, avatar_url')
      .eq('id', session.user.id)
      .single();

    if (!userData || !hasAnyRole(userData, ['admin', 'owner', 'author', 'reviewer'])) {
      return fail(API_ERRORS.FORBIDDEN, API_ERRORS.FORBIDDEN.status);
    }

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
    } = body;
    const titleValidation = validatePlainText(title, 'Ο τίτλος');
    if (!titleValidation.isValid) {
      return fail({ error: titleValidation.error || 'Μη έγκυρος τίτλος' }, 400);
    }
    const descriptionValidation = validatePlainText(description, 'Η περιγραφή');
    if (!descriptionValidation.isValid) {
      return fail({ error: descriptionValidation.error || 'Μη έγκυρη περιγραφή' }, 400);
    }
    const metaTitleValidation = validatePlainText(meta_title, 'Ο meta τίτλος');
    if (!metaTitleValidation.isValid) {
      return fail({ error: metaTitleValidation.error || 'Μη έγκυρος meta τίτλος' }, 400);
    }
    const metaDescriptionValidation = validatePlainText(meta_description, 'Το meta description');
    if (!metaDescriptionValidation.isValid) {
      return fail({ error: metaDescriptionValidation.error || 'Μη έγκυρο meta description' }, 400);
    }
    const tagsValidation = validatePlainTextArray(tags, 'Τα tags');
    if (!tagsValidation.isValid) {
      return fail({ error: tagsValidation.error || 'Μη έγκυρα tags' }, 400);
    }

    // Validate content_rich JSON structure (TipTap format)
    const contentRichValidation = validateTipTapContent(content_rich);
    if (!contentRichValidation.isValid) {
      return fail({ error: contentRichValidation.error || 'Μη έγκυρη μορφή περιεχομένου' }, 400);
    }

    const sanitizedContentHtml = sanitizeHtmlContent(content_html).trim() || null;

    // Validate required fields
    if (!title || !slug || !category) {
      return fail({ error: 'Ο τίτλος, το slug και η κατηγορία είναι υποχρεωτικά' }, 400);
    }

    const normalizedSlug = normalizeSlug(slug);

    // Check if slug already exists
    const { data: existingArticle } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', normalizedSlug)
      .maybeSingle();

    if (existingArticle) {
      return fail({ error: 'An article with this slug already exists', code: 'CONFLICT' }, 409);
    }

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
      })
      .select('*')
      .single();

    if (insertError) {
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
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

export const GET = withApiRoute(GETHandler);
export const POST = withApiRoute(POSTHandler);
