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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: comments, error, count } = await (supabase.from('article_comments') as any)
      .select('*, users!user_id(username, display_name, avatar_url)', { count: 'exact' })
      .eq('article_id', parseInt(id))
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }

    return NextResponse.json({
      comments: comments || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: 'Comment is too long (max 2000 characters)' }, { status: 400 });
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

    // Get user info for activity log
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userData } = await (supabase.from('users') as any)
      .select('username, display_name, avatar_url')
      .eq('id', session.user.id)
      .single();

    // Insert comment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: comment, error: insertError } = await (supabase.from('article_comments') as any)
      .insert({
        article_id: parseInt(id),
        user_id: session.user.id,
        content: content.trim(),
      })
      .select('*, users!user_id(username, display_name, avatar_url)')
      .single();

    if (insertError) {
      console.error('Error inserting comment:', insertError);
      return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
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

    return NextResponse.json({
      message: 'Comment added successfully',
      comment,
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a comment (own comments only or admin)
export async function DELETE(req: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the comment to check ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: comment, error: fetchError } = await (supabase.from('article_comments') as any)
      .select('*')
      .eq('id', parseInt(commentId))
      .single();

    if (fetchError || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check permission (owner or admin)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userData } = await (supabase.from('users') as any)
      .select('role')
      .eq('id', session.user.id)
      .single();

    const isOwner = comment.user_id === session.user.id;
    const isAdmin = userData?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Delete comment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase.from('article_comments') as any)
      .delete()
      .eq('id', parseInt(commentId));

    if (deleteError) {
      console.error('Error deleting comment:', deleteError);
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
