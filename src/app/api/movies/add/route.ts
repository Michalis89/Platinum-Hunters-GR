import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import getSupabaseServer from '@/lib/supabase-server';
import type { Database } from '@/lib/supabase/database.types';
import { insertActivity } from '@/lib/services/activityService';

type Category = 'movies' | 'tv';

type MediaPayload = {
  tmdb_id: number;
  category: Category;
  source?: string | null;
  title?: string | null;
  original_title?: string | null;
  description?: string | null;
  release_date?: string | null;
  first_air_date?: string | null;
  runtime?: number | null;
  rating?: number | null;
  vote_count?: number | null;
  popularity?: number | null;
  number_of_seasons?: number | null;
  number_of_episodes?: number | null;
  cover_image_large?: string | null;
  cover_image_medium?: string | null;
  banner_image?: string | null;
  genres?: string[] | null;
};

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/';

const getTmdbApiKey = () => {
  return process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY || '';
};

const fetchDetails = async (category: Category, tmdbId: number) => {
  const apiKey = getTmdbApiKey();
  if (!apiKey) {
    return null;
  }
  const base = category === 'movies' ? 'movie' : 'tv';
  const url = new URL(`https://api.themoviedb.org/3/${base}/${tmdbId}`);
  url.searchParams.set('api_key', apiKey);

  const response = await fetch(url.toString(), { cache: 'no-store' });
  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    runtime?: number | null;
    episode_run_time?: number[] | null;
    number_of_seasons?: number | null;
    number_of_episodes?: number | null;
    genres?: { id: number; name: string }[] | null;
    poster_path?: string | null;
    backdrop_path?: string | null;
  };

  const runtime =
    category === 'movies'
      ? data.runtime ?? null
      : Array.isArray(data.episode_run_time) && data.episode_run_time.length > 0
        ? data.episode_run_time[0] ?? null
        : null;

  return {
    runtime,
    number_of_seasons: data.number_of_seasons ?? null,
    number_of_episodes: data.number_of_episodes ?? null,
    genres: data.genres?.map(item => item.name) ?? [],
    cover_image_large: data.poster_path ? `${TMDB_IMAGE_BASE}w780${data.poster_path}` : null,
    cover_image_medium: data.poster_path ? `${TMDB_IMAGE_BASE}w342${data.poster_path}` : null,
    banner_image: data.backdrop_path ? `${TMDB_IMAGE_BASE}w1280${data.backdrop_path}` : null,
  };
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
        .select('title,original_title,title_english,title_romaji,title_native,category')
        .eq('id', body.mediaId)
        .maybeSingle();

      const typedMediaRow = mediaRow as Pick<
        Database['public']['Tables']['media_items']['Row'],
        'title' | 'original_title' | 'title_english' | 'title_romaji' | 'title_native' | 'category'
      > | null;
      const mediaTitle =
        typedMediaRow?.title ||
        typedMediaRow?.original_title ||
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
        category: typedMediaRow?.category ?? 'movies',
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
    if (!payload.tmdb_id || !payload.category) {
      return NextResponse.json({ error: 'Invalid media payload' }, { status: 400 });
    }

    const details = await fetchDetails(payload.category, payload.tmdb_id);
    const mergedPayload = {
      ...payload,
      runtime: payload.runtime ?? details?.runtime ?? null,
      number_of_seasons: payload.number_of_seasons ?? details?.number_of_seasons ?? null,
      number_of_episodes: payload.number_of_episodes ?? details?.number_of_episodes ?? null,
      genres:
        (payload.genres && payload.genres.length > 0 ? payload.genres : details?.genres) ?? [],
      cover_image_large: payload.cover_image_large ?? details?.cover_image_large ?? null,
      cover_image_medium: payload.cover_image_medium ?? details?.cover_image_medium ?? null,
      banner_image: payload.banner_image ?? details?.banner_image ?? null,
    };

    const { data: profileData } = await supabase
      .from('users')
      .select('username, display_name, avatar_url')
      .eq('id', session.user.id)
      .maybeSingle();

    const { data: existingMedia } = await supabase
      .from('media_items')
      .select('id')
      .eq('tmdb_id', mergedPayload.tmdb_id)
      .eq('category', mergedPayload.category)
      .maybeSingle();

    let mediaId = (existingMedia as { id?: number } | null)?.id;
    if (!mediaId) {
      // Use service role client for catalog writes (media_items has RLS blocking user writes)
      const supabaseAdmin = getSupabaseServer();
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('media_items')
        .insert(mergedPayload as never)
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

    const mediaTitle = mergedPayload.title || mergedPayload.original_title || 'Untitled';
    await insertActivity(supabase, session.user.id, 'media_added', {
      category: mergedPayload.category,
      title: mediaTitle,
      mediaId,
      status: body.status ?? 'planned',
      username: (profileData as { username?: string } | null)?.username,
      display_name: (profileData as { display_name?: string } | null)?.display_name,
      avatar_url: (profileData as { avatar_url?: string } | null)?.avatar_url,
    });

    return NextResponse.json({ entry, mediaId });
  } catch (error) {
    console.error('Movies add error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
