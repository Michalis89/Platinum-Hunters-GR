import { NextRequest } from 'next/server';
import { exchangeNpssoForAccessCode, exchangeCodeForAccessToken, getTitleTrophies } from 'psn-api';
import { API_ERRORS } from '@/lib/api/errors';
import { fail, ok } from '@/lib/api/response';

/**
 * PSN NPSSO token for authentication.
 * Server-only - do NOT use NEXT_PUBLIC_ prefix to avoid client bundle exposure.
 */
const NPSSO = process.env.PSN_NPSSO_TOKEN;

export async function GET(req: NextRequest) {
  if (!NPSSO) {
    console.error('PSN_NPSSO_TOKEN is not configured');
    return fail({ error: 'PSN integration not configured' }, 503);
  }

  const npCommunicationId = req.nextUrl.searchParams.get('npCommunicationId');

  if (!npCommunicationId) {
    return fail({ error: 'Λείπει το npCommunicationId' }, 400);
  }

  try {
    const accessCode = await exchangeNpssoForAccessCode(NPSSO);
    const authorization = await exchangeCodeForAccessToken(accessCode);

    const trophiesResponse = await getTitleTrophies(authorization, npCommunicationId, 'all', {
      npServiceName: 'trophy',
    });

    return ok(trophiesResponse.trophies);
  } catch (error) {
    console.error('Server error:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}
