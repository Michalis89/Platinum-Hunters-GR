import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

async function insertActivity(
  supabase: Awaited<ReturnType<typeof createRouteHandlerClient>>,
  userId: string,
  type: string,
  payload: Record<string, unknown>,
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('activity_log') as any).insert({
      user_id: userId,
      type,
      payload,
    });
  } catch (err) {
    console.warn(`Activity insert (${type}) failed:`, err);
  }
}

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
      return NextResponse.json({ liked: false, count: 0 });
    }

    // Check if user has liked
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: like } = await (supabase.from('article_likes') as any)
      .select('id')
      .eq('article_id', parseInt(id))
      .eq('user_id', session.user.id)
      .maybeSingle();

    // Get total likes count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (supabase.from('article_likes') as any)
      .select('*', { count: 'exact', head: true })
      .eq('article_id', parseInt(id));

    return NextResponse.json({
      liked: !!like,
      count: count || 0,
    });
  } catch (error) {
    console.error('Error checking like status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get article info for activity log
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: article, error: articleError } = await (supabase.from('articles') as any)
      .select('id, title, slug')
      .eq('id', parseInt(id))
      .single();

    if (articleError || !article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Check if already liked
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingLike } = await (supabase.from('article_likes') as any)
      .select('id')
      .eq('article_id', parseInt(id))
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (existingLike) {
      return NextResponse.json({ error: 'Already liked' }, { status: 409 });
    }

    // Get user info for activity log
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userData } = await (supabase.from('users') as any)
      .select('username, display_name, avatar_url')
      .eq('id', session.user.id)
      .single();

    // Insert like
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase.from('article_likes') as any)
      .insert({
        article_id: parseInt(id),
        user_id: session.user.id,
      });

    if (insertError) {
      console.error('Error inserting like:', insertError);
      return NextResponse.json({ error: 'Failed to like article' }, { status: 500 });
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (supabase.from('article_likes') as any)
      .select('*', { count: 'exact', head: true })
      .eq('article_id', parseInt(id));

    return NextResponse.json({
      message: 'Article liked successfully',
      liked: true,
      count: count || 0,
    });
  } catch (error) {
    console.error('Error liking article:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete like
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase.from('article_likes') as any)
      .delete()
      .eq('article_id', parseInt(id))
      .eq('user_id', session.user.id);

    if (deleteError) {
      console.error('Error removing like:', deleteError);
      return NextResponse.json({ error: 'Failed to unlike article' }, { status: 500 });
    }

    // Get updated count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (supabase.from('article_likes') as any)
      .select('*', { count: 'exact', head: true })
      .eq('article_id', parseInt(id));

    return NextResponse.json({
      message: 'Article unliked successfully',
      liked: false,
      count: count || 0,
    });
  } catch (error) {
    console.error('Error unliking article:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
