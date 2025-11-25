import { NextRequest, NextResponse } from 'next/server';
import { exchangeNpssoForAccessCode, exchangeCodeForAccessToken, getTitleTrophies } from 'psn-api';

const NPSSO = process.env.NEXT_PUBLIC_PSN_NPSSO_TOKEN!;

export async function GET(req: NextRequest) {
  const npCommunicationId = req.nextUrl.searchParams.get('npCommunicationId');

  if (!npCommunicationId) {
    return NextResponse.json({ error: 'Missing npCommunicationId' }, { status: 400 });
  }

  try {
    const accessCode = await exchangeNpssoForAccessCode(NPSSO);
    const authorization = await exchangeCodeForAccessToken(accessCode);

    const trophiesResponse = await getTitleTrophies(authorization, npCommunicationId, 'all', {
      npServiceName: 'trophy',
    });

    return NextResponse.json(trophiesResponse.trophies);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Failed to fetch trophies' }, { status: 500 });
  }
}
