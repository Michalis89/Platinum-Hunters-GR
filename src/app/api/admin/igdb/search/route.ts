import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/observability/withApiRoute';
import { igdbImage, igdbPost, unixToDate } from '@/lib/igdb/igdbClient';
import {
  getIgdbCategoryLabel,
  igdbAllowedCategoriesWhereClause,
  isAllowedIgdbGameCandidate,
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
  const strictBody = `
fields id,name,category,slug,first_release_date,cover.image_id,summary;
search "${escaped}";
where category = ${igdbAllowedCategoriesWhereClause()};
limit 20;
`;
  const fallbackBody = `
fields id,name,category,slug,first_release_date,cover.image_id,summary;
search "${escaped}";
limit 40;
`;

  const strictResponse = (await igdbPost('/games', strictBody)) as IgdbSearchGame[];
  const strictRows = Array.isArray(strictResponse) ? strictResponse : [];
  const fallbackResponse =
    strictRows.length === 0 ? ((await igdbPost('/games', fallbackBody)) as IgdbSearchGame[]) : [];
  const mergedRows = strictRows.length > 0 ? strictRows : Array.isArray(fallbackResponse) ? fallbackResponse : [];

  const normalized = mergedRows
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
    .filter(game =>
      isAllowedIgdbCategory(game.category) ||
      isAllowedIgdbGameCandidate({
        category: game.category,
        name: game.name,
        slug: game.slug ?? null,
      }),
    )
    .slice(0, 20);

  return NextResponse.json({ results: normalized });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = withApiRoute(GETHandler);
