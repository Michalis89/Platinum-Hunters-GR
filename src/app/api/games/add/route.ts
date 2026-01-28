import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import getSupabaseServer from '@/lib/supabase-server';
import { insertActivity } from '@/lib/services/activityService';
import type { GamePayload } from '@/lib/services/rawgService';

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
      payload?: GamePayload;
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
        .select('title,title_english,category')
        .eq('id', body.mediaId)
        .maybeSingle();

      const typedMediaRow = mediaRow as {
        title?: string | null;
        title_english?: string | null;
        category?: string | null;
      } | null;
      const mediaTitle = typedMediaRow?.title || typedMediaRow?.title_english || 'Untitled';

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
        category: typedMediaRow?.category ?? 'games',
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
      return NextResponse.json({ error: 'Missing game payload' }, { status: 400 });
    }

    const { payload } = body;
    if (!payload.rawg_id || payload.category !== 'games') {
      return NextResponse.json({ error: 'Invalid game payload' }, { status: 400 });
    }

    const { data: profileData } = await supabase
      .from('users')
      .select('username, display_name, avatar_url')
      .eq('id', session.user.id)
      .maybeSingle();

    // Check if game already exists in media_items
    const supabaseAdmin = getSupabaseServer();
    const { data: existingMedia } = await supabaseAdmin
      .from('media_items')
      .select('id')
      .eq('category', 'games')
      .filter('rawg_id', 'eq', payload.rawg_id)
      .maybeSingle();

    let mediaId = (existingMedia as { id?: number } | null)?.id;
    if (!mediaId) {
      // Insert new game into media_items
      const mediaInsert = {
        category: 'games',
        title: payload.title,
        title_english: payload.title,
        description: payload.description,
        cover_image_large: payload.cover_image_large,
        cover_image_medium: payload.cover_image_medium,
        season_year: payload.season_year,
        release_date: payload.release_date,
        rating: payload.rating,
        genres: payload.genres,
        // Game-specific fields (may need to be added to DB)
        rawg_id: payload.rawg_id,
        metacritic: payload.metacritic,
        platforms: payload.platforms,
        developer: payload.developer,
        publisher: payload.publisher,
        esrb_rating: payload.esrb_rating,
        runtime: payload.runtime,
      };

      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('media_items')
        .insert(mediaInsert as never)
        .select('id')
        .single();

      if (insertError) {
        console.error('Media insert error:', insertError);
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

    await insertActivity(supabase, session.user.id, 'media_added', {
      category: 'games',
      title: payload.title,
      mediaId,
      status: body.status ?? 'planned',
      username: (profileData as { username?: string } | null)?.username,
      display_name: (profileData as { display_name?: string } | null)?.display_name,
      avatar_url: (profileData as { avatar_url?: string } | null)?.avatar_url,
    });

    return NextResponse.json({ entry, mediaId });
  } catch (error) {
    console.error('Games add error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
