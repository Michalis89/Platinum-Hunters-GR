import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { insertActivity } from '@/lib/services/activityService';
import { API_ERRORS } from '@/lib/api/errors';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { fail, ok } from '@/lib/api/response';

// GET - Check if user has liked the article
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return ok({ liked: false, count: 0 });
    }

    // Check if user has liked
    const { data: like } = await supabase
      .from('article_likes')
      .select('id')
      .eq('article_id', Number.parseInt(id, 10))
      .eq('user_id', session.user.id)
      .maybeSingle();

    // Get total likes count
    const { count } = await supabase
      .from('article_likes')
      .select('*', { count: 'exact', head: true })
      .eq('article_id', Number.parseInt(id, 10));

    return ok({
      liked: !!like,
      count: count || 0,
    });
  } catch (error) {
    console.error('Error checking like status:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

// POST - Like the article
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClient();

    const session = await requireAuth(supabase);

    // Get article info for activity log
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id, title, slug')
      .eq('id', Number.parseInt(id, 10))
      .single();

    if (articleError || !article) {
      return fail({ error: 'Το άρθρο δεν βρέθηκε' }, 404);
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('article_likes')
      .select('id')
      .eq('article_id', Number.parseInt(id, 10))
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (existingLike) {
      return fail({ error: 'Το άρθρο έχει ήδη γίνει like', code: 'CONFLICT' }, 409);
    }

    // Get user info for activity log
    const { data: userData } = await supabase
      .from('users')
      .select('username, display_name, avatar_url')
      .eq('id', session.user.id)
      .single();

    // Insert like
    const { error: insertError } = await supabase
      .from('article_likes')
      .insert({
        article_id: Number.parseInt(id, 10),
        user_id: session.user.id,
      });

    if (insertError) {
      console.error('Error inserting like:', insertError);
      return fail({ error: 'Αποτυχία like άρθρου' }, 500);
    }

    // Log activity
    await insertActivity(supabase, session.user.id, 'article_liked', {
      articleId: article.id,
      articleTitle: article.title,
      articleSlug: article.slug,
      username: userData?.username,
      display_name: userData?.display_name,
      avatar_url: userData?.avatar_url,
    });

    // Get updated count
    const { count } = await supabase
      .from('article_likes')
      .select('*', { count: 'exact', head: true })
      .eq('article_id', Number.parseInt(id, 10));

    return ok({
      message: 'Το άρθρο έγινε like',
      liked: true,
      count: count || 0,
    });
  } catch (error) {
    console.error('Error liking article:', error);
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

// DELETE - Unlike the article
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClient();

    const session = await requireAuth(supabase);

    // Delete like
    const { error: deleteError } = await supabase
      .from('article_likes')
      .delete()
      .eq('article_id', Number.parseInt(id, 10))
      .eq('user_id', session.user.id);

    if (deleteError) {
      console.error('Error removing like:', deleteError);
      return fail({ error: 'Αποτυχία αφαίρεσης like' }, 500);
    }

    // Get updated count
    const { count } = await supabase
      .from('article_likes')
      .select('*', { count: 'exact', head: true })
      .eq('article_id', Number.parseInt(id, 10));

    return ok({
      message: 'Το like αφαιρέθηκε',
      liked: false,
      count: count || 0,
    });
  } catch (error) {
    console.error('Error unliking article:', error);
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}
