import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/observability/withApiRoute';
import { igdbImage, igdbPost, unixToDate } from '@/lib/igdb/igdbClient';
import {
  getIgdbCategoryLabel,
  igdbAllowedCategoriesWhereClause,
  isAllowedIgdbCategory,
} from '@/lib/igdb/categories';

type IgdbSearchGame = {
  id: number;
  name: string;
  category?: number | null;
  slug?: string | null;
  first_release_date?: number | null;
  summary?: string | null;
  cover?: { image_id?: string | null } | null;
};

async function GETHandler(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') ?? '').trim();

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const escaped = q.replace(/"/g, '\\"');
  const body = `
fields id,name,category,slug,first_release_date,cover.image_id,summary;
search "${escaped}";
where category = ${igdbAllowedCategoriesWhereClause()};
limit 20;
`;

  const response = (await igdbPost('/games', body)) as IgdbSearchGame[];
  const normalized = (Array.isArray(response) ? response : [])
    .map(game => {
      const name = typeof game.name === 'string' ? game.name.trim() : '';
      if (!name) {
        return null;
      }
      const date = unixToDate(game.first_release_date ?? null);
      const imageId = game.cover?.image_id ?? null;

      return {
        id: game.id,
        name,
        category: typeof game.category === 'number' ? game.category : null,
        categoryLabel: getIgdbCategoryLabel(game.category),
        slug: game.slug ?? null,
        firstReleaseDate: date ? date.toISOString() : null,
        year: date ? date.getUTCFullYear() : null,
        coverImageId: imageId,
        coverUrlThumb: igdbImage(imageId, 't_cover_small'),
        coverUrlBig: igdbImage(imageId, 't_cover_big'),
        summary: game.summary ?? null,
      };
    })
    .filter((game): game is NonNullable<typeof game> => Boolean(game))
    .filter(game => isAllowedIgdbCategory(game.category));

  return NextResponse.json({ results: normalized });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = withApiRoute(GETHandler);
