import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { sanitizeHtmlContent } from '@/utils/security/sanitizeHtml';
import { validatePlainText, validatePlainTextArray } from '@/utils/validation/text';

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

// GET - Fetch articles with filtering
export async function GET(req: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    const { searchParams } = new URL(req.url);

    const category = searchParams.get('category');
    const topic = searchParams.get('topic');
    const status = searchParams.get('status') || 'published';
    const authorId = searchParams.get('author_id');
    const featured = searchParams.get('featured');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from('articles') as any)
      .select('*, users!author_id(username, display_name, avatar_url)', { count: 'exact' })
      .eq('status', status)
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq('category', category);
    }
    if (topic) {
      query = query.eq('topic', topic);
    }
    if (authorId) {
      query = query.eq('author_id', authorId);
    }
    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    const { data: articles, error, count } = await query;

    if (error) {
      console.error('Error fetching articles:', error);
      return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
    }

    return NextResponse.json({
      articles,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new article
export async function POST(req: Request) {
  try {
    const supabase = await createRouteHandlerClient();

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission (admin or author)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userData } = await (supabase.from('users') as any)
      .select('role, username, display_name, avatar_url')
      .eq('id', session.user.id)
      .single();

    if (!userData || !['admin', 'author'].includes(userData.role as string)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
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
      return NextResponse.json({ error: titleValidation.error }, { status: 400 });
    }
    const descriptionValidation = validatePlainText(description, 'Η περιγραφή');
    if (!descriptionValidation.isValid) {
      return NextResponse.json({ error: descriptionValidation.error }, { status: 400 });
    }
    const metaTitleValidation = validatePlainText(meta_title, 'Ο meta τίτλος');
    if (!metaTitleValidation.isValid) {
      return NextResponse.json({ error: metaTitleValidation.error }, { status: 400 });
    }
    const metaDescriptionValidation = validatePlainText(meta_description, 'Το meta description');
    if (!metaDescriptionValidation.isValid) {
      return NextResponse.json({ error: metaDescriptionValidation.error }, { status: 400 });
    }
    const tagsValidation = validatePlainTextArray(tags, 'Τα tags');
    if (!tagsValidation.isValid) {
      return NextResponse.json({ error: tagsValidation.error }, { status: 400 });
    }
    const sanitizedContentHtml = sanitizeHtmlContent(content_html).trim() || null;

    // Validate required fields
    if (!title || !slug || !category) {
      return NextResponse.json(
        { error: 'Title, slug, and category are required' },
        { status: 400 },
      );
    }

    const normalizedSlug = normalizeSlug(slug);

    // Check if slug already exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingArticle } = await (supabase.from('articles') as any)
      .select('id')
      .eq('slug', normalizedSlug)
      .maybeSingle();

    if (existingArticle) {
      return NextResponse.json(
        { error: 'An article with this slug already exists' },
        { status: 409 },
      );
    }

    // Insert article
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: article, error: insertError } = await (supabase.from('articles') as any)
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
      return NextResponse.json({ error: 'Failed to create article' }, { status: 500 });
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

    return NextResponse.json({
      message: 'Article created successfully',
      article,
    });
  } catch (error) {
    console.error('Error creating article:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
