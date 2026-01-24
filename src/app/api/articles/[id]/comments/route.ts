import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { insertActivity } from '@/lib/services/activityService';
import { API_ERRORS } from '@/lib/api/errors';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { fail, ok, okWithMeta } from '@/lib/api/response';

// GET - Fetch comments for an article
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClient();
    const { searchParams } = new URL(req.url);

    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data: comments, error, count } = await supabase
      .from('article_comments')
      .select('*, users!user_id(username, display_name, avatar_url)', { count: 'exact' })
      .eq('article_id', Number.parseInt(id, 10))
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching comments:', error);
      return fail({ error: 'Αποτυχία φόρτωσης σχολίων' }, 500);
    }

    return okWithMeta(comments || [], { total: count || 0, limit, offset });
  } catch (error) {
    console.error('Error:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

// POST - Add a comment to an article
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClient();

    const session = await requireAuth(supabase);

    const body = await req.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return fail({ error: 'Το περιεχόμενο του σχολίου είναι υποχρεωτικό' }, 400);
    }

    if (content.length > 2000) {
      return fail({ error: 'Το σχόλιο είναι πολύ μεγάλο (μέχρι 2000 χαρακτήρες)' }, 400);
    }

    // Get article info for activity log
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id, title, slug')
      .eq('id', Number.parseInt(id, 10))
      .single();

    if (articleError || !article) {
      return fail({ error: 'Το άρθρο δεν βρέθηκε' }, 404);
    }

    // Get user info for activity log
    const { data: userData } = await supabase
      .from('users')
      .select('username, display_name, avatar_url')
      .eq('id', session.user.id)
      .single();

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
      return fail({ error: 'Αποτυχία προσθήκης σχολίου' }, 500);
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

    return ok({ message: 'Το σχόλιο προστέθηκε επιτυχώς', comment });
  } catch (error) {
    console.error('Error adding comment:', error);
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

// DELETE - Delete a comment (own comments only or admin)
export async function DELETE(req: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return fail({ error: 'Το ID σχολίου είναι υποχρεωτικό' }, 400);
    }

    const session = await requireAuth(supabase);

    // Get the comment to check ownership
    const { data: comment, error: fetchError } = await supabase
      .from('article_comments')
      .select('*')
      .eq('id', Number.parseInt(commentId, 10))
      .single();

    if (fetchError || !comment) {
      return fail({ error: 'Το σχόλιο δεν βρέθηκε' }, 404);
    }

    // Check permission (owner or admin)
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const isOwner = comment.user_id === session.user.id;
    const isAdmin = userData?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return fail({ error: 'Απαγορεύεται η πρόσβαση' }, 403);
    }

    // Delete comment
    const { error: deleteError } = await supabase
      .from('article_comments')
      .delete()
      .eq('id', Number.parseInt(commentId, 10));

    if (deleteError) {
      console.error('Error deleting comment:', deleteError);
      return fail({ error: 'Αποτυχία διαγραφής σχολίου' }, 500);
    }

    return ok({ message: 'Το σχόλιο διαγράφηκε επιτυχώς' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}
