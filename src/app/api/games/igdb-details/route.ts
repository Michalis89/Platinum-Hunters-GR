import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/observability/withApiRoute';
import { fetchIgdbGameDetails, mapIgdbToPayload } from '@/lib/services/igdbService';
import { getIgdbCategoryLabel, isAllowedIgdbGameCandidate } from '@/lib/igdb/categories';

async function GETHandler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const igdbIdRaw = searchParams.get('igdbId');

    if (!igdbIdRaw) {
      return NextResponse.json({ error: 'Missing igdbId parameter' }, { status: 400 });
    }

    const igdbId = Number(igdbIdRaw);
    if (!Number.isFinite(igdbId) || igdbId <= 0) {
      return NextResponse.json({ error: 'Invalid igdbId' }, { status: 400 });
    }

    const details = await fetchIgdbGameDetails(igdbId, { mainGameOnly: false });
    if (!details) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    if (
      !isAllowedIgdbGameCandidate({
        category: details.category,
        name: details.name,
        slug: details.slug ?? null,
      })
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Unsupported IGDB category',
          category: getIgdbCategoryLabel(details.category),
        },
        { status: 422 },
      );
    }

    const payload = mapIgdbToPayload(details);

    return NextResponse.json({
      description: payload.description,
      platforms: payload.platforms,
      payload,
    });
  } catch (error) {
    console.error('IGDB details fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withApiRoute(GETHandler);
