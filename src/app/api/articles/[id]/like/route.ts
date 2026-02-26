import { withApiRoute } from '@/lib/observability/withApiRoute';

import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { insertActivity } from '@/lib/services/activityService';
import { getUserBasicInfo } from '@/lib/services/userService';
import { API_ERRORS } from '@/lib/api/errors';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { fail, ok } from '@/lib/api/response';
import { revalidateCache } from '@/lib/cache/tags';

async function GETHandler(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Get total likes count (public)
    const { count } = await supabase
      .from('article_likes')
      .select('*', { count: 'exact', head: true })
      .eq('article_id', Number.parseInt(id, 10));

    if (!session) {
      return ok({ liked: false, count: count || 0 });
    }

    // Check if user has liked
    const { data: like } = await supabase
      .from('article_likes')
      .select('id')
      .eq('article_id', Number.parseInt(id, 10))
      .eq('user_id', session.user.id)
      .maybeSingle();

    return ok({
      liked: !!like,
      count: count || 0,
    });
  } catch (error) {
    console.error('Error checking like status:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

async function POSTHandler(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClient();

    const session = await requireAuth(supabase);

    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id, title, slug')
      .eq('id', Number.parseInt(id, 10))
      .single();

    if (articleError || !article) {
      return fail({ error: 'Article not found' }, 404);
    }

    const { data: existingLike } = await supabase
      .from('article_likes')
      .select('id')
      .eq('article_id', Number.parseInt(id, 10))
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (existingLike) {
      return fail({ error: 'Article is already liked', code: 'CONFLICT' }, 409);
    }

    const userData = await getUserBasicInfo(supabase, session.user.id);

    const { error: insertError } = await supabase.from('article_likes').insert({
      article_id: Number.parseInt(id, 10),
      user_id: session.user.id,
    });

    if (insertError) {
      console.error('Error inserting like:', insertError);
      return fail({ error: 'Article like failed' }, 500);
    }

    await insertActivity(supabase, session.user.id, 'article_liked', {
      articleId: article.id,
      articleTitle: article.title,
      articleSlug: article.slug,
      username: userData?.username,
      display_name: userData?.display_name,
      avatar_url: userData?.avatar_url,
    });

    const { count } = await supabase
      .from('article_likes')
      .select('*', { count: 'exact', head: true })
      .eq('article_id', Number.parseInt(id, 10));

    revalidateCache.articleLike(id);

    return ok({
      message: 'Article liked',
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

async function DELETEHandler(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClient();

    const session = await requireAuth(supabase);

    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id, title, slug')
      .eq('id', Number.parseInt(id, 10))
      .single();

    if (articleError || !article) {
      return fail({ error: 'Article not found' }, 404);
    }

    const userData = await getUserBasicInfo(supabase, session.user.id);

    const { error: deleteError } = await supabase
      .from('article_likes')
      .delete()
      .eq('article_id', Number.parseInt(id, 10))
      .eq('user_id', session.user.id);

    if (deleteError) {
      console.error('Error removing like:', deleteError);
      return fail({ error: 'Failed to remove like' }, 500);
    }

    await insertActivity(supabase, session.user.id, 'article_unliked', {
      articleId: article.id,
      articleTitle: article.title,
      articleSlug: article.slug,
      username: userData?.username,
      display_name: userData?.display_name,
      avatar_url: userData?.avatar_url,
    });

    const { count } = await supabase
      .from('article_likes')
      .select('*', { count: 'exact', head: true })
      .eq('article_id', Number.parseInt(id, 10));

    revalidateCache.articleLike(id);

    return ok({
      message: 'Like removed',
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

export const GET = withApiRoute(GETHandler);
export const POST = withApiRoute(POSTHandler);
export const DELETE = withApiRoute(DELETEHandler);
