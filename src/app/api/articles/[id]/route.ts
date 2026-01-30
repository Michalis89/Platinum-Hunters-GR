import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { sanitizeHtmlContent } from '@/utils/security/sanitizeHtml';
import { validatePlainText, validatePlainTextArray } from '@/utils/validation/text';
import { normalizeSlug } from '@/utils/slugify';
import { insertActivity } from '@/lib/services/activityService';
import type { Database } from '@/lib/supabase/database.types';
import { API_ERRORS } from '@/lib/api/errors';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { fail, ok } from '@/lib/api/response';
import { revalidateCache } from '@/lib/cache/tags';
import { hasAnyRole } from '@/lib/roles';

// GET - Fetch single article by ID or slug
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClient();

    // Try to fetch by ID first, then by slug
    const isNumeric = /^\d+$/.test(id);

    let query = supabase
      .from('articles')
      .select('*, users!author_id(username, display_name, avatar_url)');

    if (isNumeric) {
      query = query.eq('id', Number.parseInt(id, 10));
    } else {
      const normalized = normalizeSlug(id);
      const slugCandidates = Array.from(
        new Set([id, normalized, `-${normalized}`, `${normalized}-`, `-${normalized}-`]),
      ).filter(value => value && value !== '-');
      query = query.in('slug', slugCandidates);
    }

    const { data: article, error } = await query.single();

    if (error || !article) {
      return fail({ error: 'Το άρθρο δεν βρέθηκε' }, 404);
    }

    // Record view (optionally)
    const { data: { session } } = await supabase.auth.getSession();

    try {
      const viewPayload: Database['public']['Tables']['article_views']['Insert'] = {
        article_id: article.id,
        user_id: session?.user?.id || null,
      };
      await supabase.from('article_views').insert(viewPayload);
    } catch {
      // Views tracking is optional, don't fail if it errors
    }

    return ok(article);
  } catch (error) {
    console.error('Error fetching article:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

// PUT - Update article
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClient();

    const session = await requireAuth(supabase);

    // Get existing article
    const { data: existingArticle, error: fetchError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', Number.parseInt(id, 10))
      .single();

    if (fetchError || !existingArticle) {
      return fail({ error: 'Το άρθρο δεν βρέθηκε' }, 404);
    }

    // Check permission (author or admin)
    const { data: userData } = await supabase
      .from('users')
      .select('role, roles, username, display_name, avatar_url')
      .eq('id', session.user.id)
      .single();

    const isAuthor = existingArticle.author_id === session.user.id;
    const isAdmin = hasAnyRole(userData, ['admin', 'owner', 'reviewer']);

    if (!isAuthor && !isAdmin) {
      return fail({ error: 'Απαγορεύεται η πρόσβαση' }, 403);
    }

    const body = await req.json();
    const {
      title,
      slug,
      description,
      category,
      topic,
      tags,
      cover_image,
      content_rich,
      content_html,
      meta_title,
      meta_description,
      status,
      is_featured,
    } = body;
    if (title !== undefined) {
      const titleValidation = validatePlainText(title, 'Ο τίτλος');
      if (!titleValidation.isValid) {
        return fail({ error: titleValidation.error || 'Μη έγκυρος τίτλος' }, 400);
      }
    }
    if (description !== undefined) {
      const descriptionValidation = validatePlainText(description, 'Η περιγραφή');
      if (!descriptionValidation.isValid) {
        return fail({ error: descriptionValidation.error || 'Μη έγκυρη περιγραφή' }, 400);
      }
    }
    if (meta_title !== undefined) {
      const metaTitleValidation = validatePlainText(meta_title, 'Ο meta τίτλος');
      if (!metaTitleValidation.isValid) {
        return fail({ error: metaTitleValidation.error || 'Μη έγκυρος meta τίτλος' }, 400);
      }
    }
    if (meta_description !== undefined) {
      const metaDescriptionValidation = validatePlainText(
        meta_description,
        'Το meta description',
      );
      if (!metaDescriptionValidation.isValid) {
        return fail({ error: metaDescriptionValidation.error || 'Μη έγκυρο meta description' }, 400);
      }
    }
    if (tags !== undefined) {
      const tagsValidation = validatePlainTextArray(tags, 'Τα tags');
      if (!tagsValidation.isValid) {
        return fail({ error: tagsValidation.error || 'Μη έγκυρα tags' }, 400);
      }
    }

    // Build update object (only include provided fields)
    const updateData: Database['public']['Tables']['articles']['Update'] = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = normalizeSlug(slug);
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (topic !== undefined) updateData.topic = topic;
    if (tags !== undefined) updateData.tags = tags;
    if (cover_image !== undefined) updateData.cover_image = cover_image;
    if (content_rich !== undefined) updateData.content_rich = content_rich;
    if (content_html !== undefined) {
      updateData.content_html = sanitizeHtmlContent(content_html).trim() || null;
    }
    if (meta_title !== undefined) updateData.meta_title = meta_title;
    if (meta_description !== undefined) updateData.meta_description = meta_description;
    if (is_featured !== undefined) updateData.is_featured = is_featured;

    // Handle status change
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'published' && !existingArticle.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }

    const { data: article, error: updateError } = await supabase
      .from('articles')
      .update(updateData)
      .eq('id', Number.parseInt(id, 10))
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating article:', updateError);
      return fail({ error: 'Αποτυχία ενημέρωσης άρθρου' }, 500);
    }

    // Log activity
    await insertActivity(supabase, session.user.id, 'article_updated', {
      articleId: article.id,
      articleTitle: article.title,
      articleSlug: article.slug,
      changes: Object.keys(updateData),
      username: userData?.username,
      display_name: userData?.display_name,
      avatar_url: userData?.avatar_url,
    });

    // Revalidate article caches
    revalidateCache.article(article.id);

    return ok({ message: 'Επιτυχής ενημέρωση άρθρου', article });
  } catch (error) {
    console.error('Error updating article:', error);
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

// DELETE - Delete article
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClient();

    const session = await requireAuth(supabase);

    // Get existing article
    const { data: existingArticle, error: fetchError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', Number.parseInt(id, 10))
      .single();

    if (fetchError || !existingArticle) {
      return fail({ error: 'Το άρθρο δεν βρέθηκε' }, 404);
    }

    // Check permission (author or admin)
    const { data: userData } = await supabase
      .from('users')
      .select('role, roles, username, display_name, avatar_url')
      .eq('id', session.user.id)
      .single();

    const isAuthor = existingArticle.author_id === session.user.id;
    const isAdmin = hasAnyRole(userData, ['admin', 'owner', 'reviewer']);

    if (!isAuthor && !isAdmin) {
      return fail({ error: 'Απαγορεύεται η πρόσβαση' }, 403);
    }

    // Delete article (cascade will handle likes, comments, views)
    const { error: deleteError } = await supabase
      .from('articles')
      .delete()
      .eq('id', Number.parseInt(id, 10));

    if (deleteError) {
      console.error('Error deleting article:', deleteError);
      return fail({ error: 'Αποτυχία διαγραφής άρθρου' }, 500);
    }

    // Log activity
    await insertActivity(supabase, session.user.id, 'article_deleted', {
      articleId: existingArticle.id,
      articleTitle: existingArticle.title,
      articleSlug: existingArticle.slug,
      username: userData?.username,
      display_name: userData?.display_name,
      avatar_url: userData?.avatar_url,
    });

    // Revalidate article caches
    revalidateCache.article(existingArticle.id);

    return ok({ message: 'Το άρθρο διαγράφηκε επιτυχώς' });
  } catch (error) {
    console.error('Error deleting article:', error);
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}
