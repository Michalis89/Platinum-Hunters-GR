import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/observability/withApiRoute';
import { fetchRawgGameDetails, mapRawgToPayload } from '@/lib/services/rawgService';

async function GETHandler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawgIdRaw = searchParams.get('rawgId');

    if (!rawgIdRaw) {
      return NextResponse.json({ error: 'Missing rawgId parameter' }, { status: 400 });
    }

    const rawgId = Number(rawgIdRaw);
    if (!Number.isFinite(rawgId) || rawgId <= 0) {
      return NextResponse.json({ error: 'Invalid rawgId' }, { status: 400 });
    }

    const details = await fetchRawgGameDetails(rawgId);
    if (!details) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const payload = mapRawgToPayload(details);

    return NextResponse.json({
      description: payload.description,
      platforms: payload.platforms,
      payload,
    });
  } catch (error) {
    console.error('RAWG details fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withApiRoute(GETHandler);
