import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import type { Database } from '@/lib/supabase/database.types';
import { insertActivity } from '@/lib/services/activityService';

type Category = 'movies' | 'tv';

type LibraryRow = {
  id: number;
  status: string;
  is_favorite: boolean | null;
  priority: number | null;
  score: number | null;
  progress: number | null;
  notes: string | null;
  media_items: {
    id: number;
    category: string;
    title: string | null;
    original_title: string | null;
    title_english: string | null;
    title_romaji: string | null;
    title_native: string | null;
    description: string | null;
    release_date: string | null;
    first_air_date: string | null;
    runtime: number | null;
    number_of_episodes: number | null;
    cover_image_large: string | null;
    cover_image_medium: string | null;
    banner_image: string | null;
    genres: Database['public']['Tables']['media_items']['Row']['genres'];
  } | null;
};

const mapLibraryEntry = (row: LibraryRow) => {
  const media = row.media_items;
  if (!media) {
    return null;
  }
  const title =
    media.title ||
    media.original_title ||
    media.title_english ||
    media.title_romaji ||
    media.title_native ||
    'Untitled';
  const subtitle =
    media.original_title && media.original_title !== title ? media.original_title : '';
  const year =
    media.release_date?.slice(0, 4) ||
    media.first_air_date?.slice(0, 4) ||
    undefined;
  return {
    id: `entry-${row.id}`,
    entryId: row.id,
    mediaId: media.id,
    status: row.status,
    isFavorite: row.is_favorite ?? false,
    priority: row.priority ?? 0,
    score: row.score?.toString() ?? undefined,
    progress: row.progress ?? undefined,
    notes: row.notes ?? undefined,
    title,
    subtitle,
    year,
    tags: Array.isArray(media.genres) ? media.genres.map(String) : [],
    cover: media.cover_image_large || media.cover_image_medium || '/og-image.png',
    totalRuntime: media.runtime ?? undefined,
    totalEpisodes: media.number_of_episodes ?? undefined,
    description: media.description ?? undefined,
  };
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = (searchParams.get('category') || 'movies') as Category;

    if (category !== 'movies' && category !== 'tv') {
      return NextResponse.json({ error: 'Unsupported category' }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Μη εξουσιοδοτημένη πρόσβαση' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('user_media_entries')
      .select(
        'id,status,is_favorite,priority,score,progress,notes,media_items!inner(id,category,title,original_title,title_english,title_romaji,title_native,description,release_date,first_air_date,runtime,number_of_episodes,cover_image_large,cover_image_medium,banner_image,genres)',
      )
      .eq('user_id', session.user.id)
      .eq('media_items.category', category)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      items: Array.isArray(data)
        ? data
            .map(mapLibraryEntry)
            .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
        : [],
    });
  } catch (error) {
    console.error('Library fetch error:', error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
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
      mediaId: number;
      status?: 'planned' | 'current' | 'completed' | 'dropped';
      is_favorite?: boolean | null;
      priority?: number | null;
      score?: number | null;
      progress?: number | null;
      notes?: string | null;
    };

    if (!body.mediaId) {
      return NextResponse.json({ error: 'Missing mediaId' }, { status: 400 });
    }

    const updateData: Database['public']['Tables']['user_media_entries']['Update'] = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.is_favorite !== undefined) updateData.is_favorite = body.is_favorite;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.score !== undefined) updateData.score = body.score;
    if (body.progress !== undefined) updateData.progress = body.progress;
    if (body.notes !== undefined) updateData.notes = body.notes;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    const { data: existingEntry } = await supabase
      .from('user_media_entries')
      .select('status,is_favorite')
      .eq('user_id', session.user.id)
      .eq('media_id', body.mediaId)
      .maybeSingle();

    const { data, error } = await supabase
      .from('user_media_entries')
      .update(updateData)
      .eq('user_id', session.user.id)
      .eq('media_id', body.mediaId)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

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

    const payload = {
      category: typedMediaRow?.category ?? 'movies',
      title: mediaTitle,
      mediaId: body.mediaId,
      username: (profileData as { username?: string } | null)?.username,
      display_name: (profileData as { display_name?: string } | null)?.display_name,
      avatar_url: (profileData as { avatar_url?: string } | null)?.avatar_url,
    };

    if (body.status !== undefined && body.status !== existingEntry?.status) {
      await insertActivity(supabase, session.user.id, 'media_status', {
        ...payload,
        status: body.status,
      });
    }

    if (body.is_favorite !== undefined && body.is_favorite !== existingEntry?.is_favorite) {
      await insertActivity(supabase, session.user.id, 'media_favorite', {
        ...payload,
        favoriteAction: body.is_favorite ? 'added' : 'removed',
      });
    }

    return NextResponse.json({ entry: data });
  } catch (error) {
    console.error('Library update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Μη εξουσιοδοτημένη πρόσβαση' }, { status: 401 });
    }

    const body = (await req.json()) as { mediaId?: number };
    if (!body.mediaId) {
      return NextResponse.json({ error: 'Missing mediaId' }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_media_entries')
      .delete()
      .eq('user_id', session.user.id)
      .eq('media_id', body.mediaId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Library delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
