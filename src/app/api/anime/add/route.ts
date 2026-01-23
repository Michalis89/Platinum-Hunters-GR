import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

type Category = 'anime' | 'manga';

type MediaPayload = {
  mal_id: number;
  category: Category;
  source?: string | null;
  title_english?: string | null;
  title_romaji?: string | null;
  title_native?: string | null;
  description?: string | null;
  format?: string | null;
  status?: string | null;
  season?: string | null;
  season_year?: number | null;
  episodes?: number | null;
  duration?: number | null;
  chapters?: number | null;
  volumes?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  cover_image_large?: string | null;
  cover_image_medium?: string | null;
  banner_image?: string | null;
  genres?: string[] | null;
  tags?: unknown[] | null;
  studios?: unknown[] | null;
};

const insertActivity = async (
  supabase: Awaited<ReturnType<typeof createRouteHandlerClient>>,
  userId: string,
  type: 'media_added',
  payload: Record<string, unknown>,
) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('activity_log') as any).insert({
      user_id: userId,
      type,
      payload,
    });
    if (error) {
      console.error('⚠️ Activity insert error:', error);
    }
  } catch (err) {
    console.warn('⚠️ Activity insert exception:', err);
  }
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
        .select('title_english,title_romaji,title_native,category')
        .eq('id', body.mediaId)
        .maybeSingle();

      const typedMediaRow = mediaRow as { title_english?: string | null; title_romaji?: string | null; title_native?: string | null; category?: string | null } | null;
      const mediaTitle =
        typedMediaRow?.title_english ||
        typedMediaRow?.title_romaji ||
        typedMediaRow?.title_native ||
        'Untitled';

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
          } as never,
          { onConflict: 'user_id,media_id' },
        )
        .select('*')
        .single();

      if (entryError) {
        throw entryError;
      }

      await insertActivity(supabase, session.user.id, 'media_added', {
        category: typedMediaRow?.category ?? 'anime',
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
    if (!payload.mal_id || !payload.category) {
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
      .eq('mal_id', payload.mal_id)
      .eq('category', payload.category)
      .maybeSingle();

    let mediaId = (existingMedia as { id?: number } | null)?.id;
    if (!mediaId) {
      const { data: inserted, error: insertError } = await supabase
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
        } as never,
        { onConflict: 'user_id,media_id' },
      )
      .select('*')
      .single();

    if (entryError) {
      throw entryError;
    }

    const mediaTitle =
      payload.title_english || payload.title_romaji || payload.title_native || 'Untitled';
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
    console.error('Anime add error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
