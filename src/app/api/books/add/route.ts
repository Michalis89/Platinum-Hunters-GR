import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import getSupabaseServer from '@/lib/supabase-server';
import type { Database } from '@/lib/supabase/database.types';
import { insertActivity } from '@/lib/services/activityService';

type Category = 'books';

type MediaPayload = {
  google_books_id: string;
  category: Category;
  source?: string | null;
  title?: string | null;
  original_title?: string | null;
  description?: string | null;
  page_count?: number | null;
  release_date?: string | null;
  cover_image_large?: string | null;
  cover_image_medium?: string | null;
  genres?: string[] | null;
  tags?: string[] | null;
};

export async function POST(req: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Μη εξουσιοδοτημένη πρόσβαση' }, { status: 401 });
    }

    const body = (await req.json()) as {
      source: 'local' | 'external';
      mediaId?: number;
      payload?: MediaPayload;
      status?: 'planned' | 'current' | 'completed' | 'dropped';
      progress?: number;
      score?: number;
      notes?: string | null;
      is_favorite?: boolean;
    };

    if (body.source === 'local' && body.mediaId) {
      const { data: profileData } = await supabase
        .from('users')
        .select('username, display_name, avatar_url')
        .eq('id', session.user.id)
        .maybeSingle();

      const { data: mediaRow } = await supabase
        .from('media_items')
        .select('title,original_title,category')
        .eq('id', body.mediaId)
        .maybeSingle();

      const typedMediaRow = mediaRow as Pick<
        Database['public']['Tables']['media_items']['Row'],
        'title' | 'original_title' | 'category'
      > | null;
      const mediaTitle = typedMediaRow?.title || typedMediaRow?.original_title || 'Untitled';

      const updatedAt = new Date().toISOString();
      const { data: entry, error: entryError } = await supabase
        .from('user_media_entries')
        .upsert(
          {
            user_id: session.user.id,
            media_id: body.mediaId,
            status: body.status ?? 'planned',
            is_favorite: body.is_favorite ?? false,
            progress: body.progress ?? null,
            score: body.score ?? null,
            notes: body.notes ?? null,
            updated_at: updatedAt,
          } as never,
          { onConflict: 'user_id,media_id' },
        )
        .select('*')
        .single();

      if (entryError) {
        throw entryError;
      }

      await insertActivity(supabase, session.user.id, 'media_added', {
        category: typedMediaRow?.category ?? 'books',
        title: mediaTitle,
        mediaId: body.mediaId,
        status: body.status ?? 'planned',
        username: (profileData as { username?: string } | null)?.username,
        display_name: (profileData as { display_name?: string } | null)?.display_name,
        avatar_url: (profileData as { avatar_url?: string } | null)?.avatar_url,
      });

      return NextResponse.json({ entry });
    }

    if (body.source !== 'external' || !body.payload) {
      return NextResponse.json({ error: 'Missing media payload' }, { status: 400 });
    }

    const { payload } = body;
    if (!payload.google_books_id || !payload.category) {
      return NextResponse.json({ error: 'Invalid media payload' }, { status: 400 });
    }

    const { data: profileData } = await supabase
      .from('users')
      .select('username, display_name, avatar_url')
      .eq('id', session.user.id)
      .maybeSingle();

    const { data: existingMedia } = await supabase
      .from('media_items')
      .select('id')
      .eq('google_books_id', payload.google_books_id)
      .eq('category', payload.category)
      .maybeSingle();

    let mediaId = (existingMedia as { id?: number } | null)?.id;
    if (!mediaId) {
      // Use service role client for catalog writes (media_items has RLS blocking user writes)
      const supabaseAdmin = getSupabaseServer();
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('media_items')
        .insert(payload as never)
        .select('id')
        .single();
      if (insertError) {
        throw insertError;
      }
      mediaId = (inserted as { id?: number } | null)?.id;
    }

    if (!mediaId) {
      return NextResponse.json({ error: 'Failed to resolve media ID' }, { status: 500 });
    }

    const updatedAt = new Date().toISOString();
    const { data: entry, error: entryError } = await supabase
      .from('user_media_entries')
      .upsert(
        {
          user_id: session.user.id,
          media_id: mediaId,
          status: body.status ?? 'planned',
          is_favorite: body.is_favorite ?? false,
          progress: body.progress ?? null,
          score: body.score ?? null,
          notes: body.notes ?? null,
          updated_at: updatedAt,
        } as never,
        { onConflict: 'user_id,media_id' },
      )
      .select('*')
      .single();

    if (entryError) {
      throw entryError;
    }

    const mediaTitle = payload.title || payload.original_title || 'Untitled';
    await insertActivity(supabase, session.user.id, 'media_added', {
      category: payload.category,
      title: mediaTitle,
      mediaId,
      status: body.status ?? 'planned',
      username: (profileData as { username?: string } | null)?.username,
      display_name: (profileData as { display_name?: string } | null)?.display_name,
      avatar_url: (profileData as { avatar_url?: string } | null)?.avatar_url,
    });

    return NextResponse.json({ entry, mediaId });
  } catch (error) {
    console.error('Books add error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
