import { withApiRoute } from '@/lib/observability/withApiRoute';

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { isMediaCategory } from '@/app/components/backlog/types';
import type { MediaItem } from '@/lib/media/types';

const selectFields =
  'id,category,title,original_title,title_english,title_romaji,title_native,description,summary,storyline,format,season_year,start_date,first_release_date,release_date,first_air_date,cover_image_id,cover_url_thumb,cover_url_big,cover_image_large,cover_image_medium,banner_image,genres,episodes,chapters,volumes,runtime,number_of_episodes,page_count,rating,rating_count,aggregated_rating,aggregated_rating_count,popularity,mal_id,tmdb_id,google_books_id,rawg_id,igdb_id,igdb_category,igdb_slug,platforms,developer,publisher,metacritic,esrb_rating,igdb_themes,igdb_game_modes,igdb_player_perspectives,igdb_artwork_image_ids,igdb_screenshot_image_ids,official_website,igdb_updated_at,websites';

const isNumeric = (value: string) => /^\d+$/.test(value);

const escapeLike = (value: string) => value.replace(/[%_]/g, match => `\\${match}`);

async function fetchBySlug(category: string, slug: string) {
  const supabase = await createRouteHandlerClient();
  const slugText = escapeLike(slug.replace(/[-_]/g, ' ').trim());
  if (!slugText) return null;

  const { data, error } = await supabase
    .from('media_items')
    .select(selectFields)
    .eq('category', category)
    .or(
      [
        `title.ilike.%${slugText}%`,
        `original_title.ilike.%${slugText}%`,
        `title_english.ilike.%${slugText}%`,
        `title_romaji.ilike.%${slugText}%`,
        `title_native.ilike.%${slugText}%`,
      ].join(','),
    )
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as MediaItem | null;
}

async function fetchById(category: string, id: number) {
  const supabase = await createRouteHandlerClient();
  const { data, error } = await supabase
    .from('media_items')
    .select(selectFields)
    .eq('category', category)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as MediaItem | null;
}

async function fetchByExternalId(category: string, externalId: number | string) {
  const supabase = await createRouteHandlerClient();
  let query = supabase.from('media_items').select(selectFields).eq('category', category);

  if (category === 'anime' || category === 'manga') {
    query = query.eq('mal_id', Number(externalId));
  } else if (category === 'movies' || category === 'tv') {
    query = query.eq('tmdb_id', Number(externalId));
  } else if (category === 'games') {
    const numericId = Number(externalId);
    if (!Number.isFinite(numericId)) return null;
    query = query.eq('igdb_id', numericId);
  } else if (category === 'books') {
    query = query.eq('google_books_id', String(externalId));
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data as MediaItem | null;
}

async function GETHandler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const slug = searchParams.get('slug');

    if (!category || !slug || !isMediaCategory(category)) {
      return NextResponse.json({ error: 'Invalid category or slug' }, { status: 400 });
    }

    let item: MediaItem | null = null;

    if (isNumeric(slug)) {
      const numericId = Number(slug);
      item = await fetchById(category, numericId);
      if (!item) {
        item = await fetchByExternalId(category, numericId);
      }
    } else {
      item = await fetchBySlug(category, slug);
      if (!item) {
        item = await fetchByExternalId(category, slug);
      }
    }

    if (!item) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Media item fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withApiRoute(GETHandler);
