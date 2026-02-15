import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/observability/withApiRoute';
import { igdbImage } from '@/lib/igdb/igdbClient';
import { fetchIgdbGameDetails, mapIgdbToPayload } from '@/lib/services/igdbService';
import { getIgdbCategoryLabel, isAllowedIgdbGameCandidate } from '@/lib/igdb/categories';

async function GETHandler(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id') ?? 0);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const game = await fetchIgdbGameDetails(id, { mainGameOnly: false });
  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }
  if (
    !isAllowedIgdbGameCandidate({
      category: game.category,
      name: game.name,
      slug: game.slug ?? null,
    })
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Unsupported IGDB category',
        category: getIgdbCategoryLabel(game.category),
      },
      { status: 422 },
    );
  }

  const payload = mapIgdbToPayload(game);

  return NextResponse.json({
    id: payload.igdb_id,
    igdb_category: payload.igdb_category,
    name: payload.title,
    slug: payload.igdb_slug,
    summary: payload.summary,
    storyline: payload.storyline,
    first_release_date: payload.first_release_date
      ? `${payload.first_release_date}T00:00:00.000Z`
      : null,
    year: payload.season_year,
    platforms: payload.platforms,
    genres: payload.genres,
    themes: payload.igdb_themes,
    game_modes: payload.igdb_game_modes,
    player_perspectives: payload.igdb_player_perspectives,
    developers: payload.developer ? [payload.developer] : [],
    publishers: payload.publisher ? [payload.publisher] : [],
    cover_image_id: payload.cover_image_id,
    cover_big: payload.cover_url_big,
    cover_1080p: igdbImage(payload.cover_image_id, 't_1080p'),
    artworks_1080p: payload.igdb_artwork_image_ids
      .map(imageId => igdbImage(imageId, 't_1080p'))
      .filter(Boolean),
    screenshots_1080p: payload.igdb_screenshot_image_ids
      .map(imageId => igdbImage(imageId, 't_1080p'))
      .filter(Boolean),
    aggregated_rating: payload.aggregated_rating,
    aggregated_rating_count: payload.aggregated_rating_count,
    rating: payload.rating,
    rating_count: payload.rating_count,
    official_website: payload.official_website,
    igdb_updated_at: payload.igdb_updated_at,
  });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = withApiRoute(GETHandler);
