import { NextResponse } from 'next/server';
import { getIgdbAccessToken, getIgdbClientId } from '@/lib/igdb/token';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id') ?? 0);
  if (!id) {
    return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 });
  }

  const token = await getIgdbAccessToken();
  const clientId = getIgdbClientId();

  const body = `
fields
  id,
  name,
  slug,
  summary,
  storyline,
  first_release_date,
  release_dates.date,
  release_dates.platform.name,
  platforms.name,
  genres.name,
  themes.name,
  game_modes.name,
  player_perspectives.name,
  involved_companies.company.name,
  involved_companies.developer,
  involved_companies.publisher,
  cover.url,
  cover.image_id,
  artworks.url,
  artworks.image_id,
  screenshots.url,
  screenshots.image_id,
  websites.url,
  aggregated_rating,
  aggregated_rating_count,
  rating,
  rating_count;
where id = ${id};
`;

  const res = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID': clientId,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'text/plain',
      Accept: 'application/json',
    },
    body,
  });

  const text = await res.text();
  if (!res.ok) {
    return NextResponse.json({ ok: false, status: res.status, body: text }, { status: 500 });
  }

  const json = JSON.parse(text);
  return NextResponse.json({ ok: true, id, result: json?.[0] ?? null });
}
