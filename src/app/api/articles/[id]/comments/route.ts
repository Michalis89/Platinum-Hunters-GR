import { withApiRoute } from '@/lib/observability/withApiRoute';

import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { insertActivity } from '@/lib/services/activityService';
import { getUserBasicInfo, getUserFullInfo } from '@/lib/services/userService';
import { API_ERRORS } from '@/lib/api/errors';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { fail, ok, okWithMeta } from '@/lib/api/response';
import { revalidateCache } from '@/lib/cache/tags';
import { hasAnyRole } from '@/lib/roles';
// GET - Fetch comments for an article
async function GETHandler(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClient();
    const { searchParams } = new URL(req.url);

    const MAX_LIMIT = 100;
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), MAX_LIMIT);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    const {
      data: comments,
      error,
      count,
    } = await supabase
      .from('article_comments')
      .select('*, users!user_id(username, display_name, avatar_url)', { count: 'exact' })
      .eq('article_id', Number.parseInt(id, 10))
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching comments:', error);
      return fail({ error: 'Failed to load comments' }, 500);
    }

    return okWithMeta(comments || [], { total: count || 0, limit, offset });
  } catch (error) {
    console.error('Error:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

// POST - Add a comment to an article
async function POSTHandler(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClient();

    const session = await requireAuth(supabase);

    const body = await req.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return fail({ error: 'Comment content is required' }, 400);
    }

    if (content.length > 2000) {
      return fail({ error: 'Comment is too long (up to 2000 characters)' }, 400);
    }

    // Get article info for activity log
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id, title, slug')
      .eq('id', Number.parseInt(id, 10))
      .single();

    if (articleError || !article) {
      return fail({ error: 'Article not found' }, 404);
    }

    // Get user info for activity log
    const userData = await getUserBasicInfo(supabase, session.user.id);

    // Insert comment
    const { data: comment, error: insertError } = await supabase
      .from('article_comments')
      .insert({
        article_id: Number.parseInt(id, 10),
        user_id: session.user.id,
        content: content.trim(),
      })
      .select('*, users!user_id(username, display_name, avatar_url)')
      .single();

    if (insertError) {
      console.error('Error inserting comment:', insertError);
      return fail({ error: 'Failed to add comment' }, 500);
    }

    // Log activity
    await insertActivity(supabase, session.user.id, 'article_comment', {
      articleId: article.id,
      articleTitle: article.title,
      articleSlug: article.slug,
      commentId: comment.id,
      commentPreview: content.trim().substring(0, 100),
      username: userData?.username,
      display_name: userData?.display_name,
      avatar_url: userData?.avatar_url,
    });

    // Revalidate comment caches
    revalidateCache.articleComment(article.id);

    return ok({ message: 'Comment added successfully', comment });
  } catch (error) {
    console.error('Error adding comment:', error);
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

// DELETE - Delete a comment (own comments only or admin)
async function DELETEHandler(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: articleId } = await params;
    const supabase = await createRouteHandlerClient();
    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return fail({ error: 'Comment ID is required' }, 400);
    }

    const session = await requireAuth(supabase);

    // Get ?? comment and verify it belongs to this article
    const { data: comment, error: fetchError } = await supabase
      .from('article_comments')
      .select('*')
      .eq('id', Number.parseInt(commentId, 10))
      .eq('article_id', Number.parseInt(articleId, 10))
      .single();

    if (fetchError || !comment) {
      return fail({ error: 'Comment not found' }, 404);
    }

    // Check permission (owner or admin)
    const userData = await getUserFullInfo(supabase, session.user.id);

    const isOwner = comment.user_id === session.user.id;
    const isAdmin = hasAnyRole(userData, ['admin', 'owner']);

    if (!isOwner && !isAdmin) {
      return fail({ error: 'Access forbidden' }, 403);
    }

    // Delete comment
    const { error: deleteError } = await supabase
      .from('article_comments')
      .delete()
      .eq('id', Number.parseInt(commentId, 10));

    if (deleteError) {
      console.error('Error deleting comment:', deleteError);
      return fail({ error: 'Failed to delete comment' }, 500);
    }

    // Revalidate comment caches
    revalidateCache.articleComment(comment.article_id);

    return ok({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

// PATCH - Update a comment (own or admin)
async function PATCHHandler(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: articleId } = await params;
    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);
    const body = await req.json();
    const commentId = Number.parseInt(body?.commentId ?? '', 10);
    const content = typeof body?.content === 'string' ? body.content.trim() : '';

    if (!commentId || !content) {
      return fail({ error: 'Comment ID and content are required' }, 400);
    }

    if (content.length > 2000) {
      return fail({ error: 'Comment is too long (up to 2000 characters)' }, 400);
    }

    // Get ?? comment and verify it belongs to this article
    const { data: comment, error: fetchError } = await supabase
      .from('article_comments')
      .select('*')
      .eq('id', commentId)
      .eq('article_id', Number.parseInt(articleId, 10))
      .single();

    if (fetchError || !comment) {
      return fail({ error: 'Comment not found' }, 404);
    }

    const userData = await getUserFullInfo(supabase, session.user.id);

    const isOwner = comment.user_id === session.user.id;
    const isAdmin = hasAnyRole(userData, ['admin', 'owner']);

    if (!isOwner && !isAdmin) {
      return fail({ error: 'Access forbidden' }, 403);
    }

    const { data: updatedComment, error: updateError } = await supabase
      .from('article_comments')
      .update({
        content,
      })
      .eq('id', commentId)
      .select('*, users!user_id(username, display_name, avatar_url)')
      .single();

    if (updateError || !updatedComment) {
      console.error('Error updating comment:', updateError);
      return fail({ error: 'Failed to update comment' }, 500);
    }

    revalidateCache.articleComment(comment.article_id);

    return ok({ message: 'Comment updated successfully', comment: updatedComment });
  } catch (error) {
    console.error('Error updating comment:', error);
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

export const GET = withApiRoute(GETHandler);
export const POST = withApiRoute(POSTHandler);
export const DELETE = withApiRoute(DELETEHandler);
export const PATCH = withApiRoute(PATCHHandler);
