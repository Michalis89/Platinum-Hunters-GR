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

function normalizeSlug(value: string) {
  const trimmed = value.replace(/^-+/, '').replace(/-+$/, '');
  return trimmed || value;
}

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from('articles') as any)
      .select('*, users!author_id(username, display_name, avatar_url)');

    if (isNumeric) {
      query = query.eq('id', parseInt(id));
    } else {
      const normalized = normalizeSlug(id);
      const slugCandidates = Array.from(
        new Set([id, normalized, `-${normalized}`, `${normalized}-`, `-${normalized}-`]),
      ).filter(value => value && value !== '-');
      query = query.in('slug', slugCandidates);
    }

    const { data: article, error } = await query.single();

    if (error || !article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Record view (optionally)
    const { data: { session } } = await supabase.auth.getSession();

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('article_views') as any).insert({
        article_id: article.id,
        user_id: session?.user?.id || null,
      });
    } catch {
      // Views tracking is optional, don't fail if it errors
    }

    return NextResponse.json({ article });
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get existing article
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingArticle, error: fetchError } = await (supabase.from('articles') as any)
      .select('*')
      .eq('id', parseInt(id))
      .single();

    if (fetchError || !existingArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Check permission (author or admin)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userData } = await (supabase.from('users') as any)
      .select('role, username, display_name, avatar_url')
      .eq('id', session.user.id)
      .single();

    const isAuthor = existingArticle.author_id === session.user.id;
    const isAdmin = userData?.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
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

    // Build update object (only include provided fields)
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = normalizeSlug(slug);
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (topic !== undefined) updateData.topic = topic;
    if (tags !== undefined) updateData.tags = tags;
    if (cover_image !== undefined) updateData.cover_image = cover_image;
    if (content_rich !== undefined) updateData.content_rich = content_rich;
    if (content_html !== undefined) updateData.content_html = content_html;
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: article, error: updateError } = await (supabase.from('articles') as any)
      .update(updateData)
      .eq('id', parseInt(id))
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating article:', updateError);
      return NextResponse.json({ error: 'Failed to update article' }, { status: 500 });
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

    return NextResponse.json({
      message: 'Article updated successfully',
      article,
    });
  } catch (error) {
    console.error('Error updating article:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get existing article
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingArticle, error: fetchError } = await (supabase.from('articles') as any)
      .select('*')
      .eq('id', parseInt(id))
      .single();

    if (fetchError || !existingArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Check permission (author or admin)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userData } = await (supabase.from('users') as any)
      .select('role, username, display_name, avatar_url')
      .eq('id', session.user.id)
      .single();

    const isAuthor = existingArticle.author_id === session.user.id;
    const isAdmin = userData?.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Delete article (cascade will handle likes, comments, views)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase.from('articles') as any)
      .delete()
      .eq('id', parseInt(id));

    if (deleteError) {
      console.error('Error deleting article:', deleteError);
      return NextResponse.json({ error: 'Failed to delete article' }, { status: 500 });
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

    return NextResponse.json({
      message: 'Article deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting article:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
