import { Trophy } from '@/app/components/ui/TrophySidebar';
import {
  exchangeNpssoForAccessCode,
  exchangeAccessCodeForAuthTokens,
  makeUniversalSearch,
  getTitleTrophies,
} from 'psn-api';

const npsso = process.env.PSN_NPSSO_TOKEN;

export async function getAccessToken(): Promise<string> {
  if (!npsso) {
    throw new Error('PSN_NPSSO_TOKEN is not defined in the environment variables.');
  }
  const accessCode = await exchangeNpssoForAccessCode(npsso);
  const { accessToken } = await exchangeAccessCodeForAuthTokens(accessCode);
  console.log('Access Token:', accessToken);

  return accessToken;
}

export interface PsnGameResult {
  id: string;
  name: string;
  platform: 'PS3' | 'PS4' | 'PS5';
}

export async function searchPsnGame(title: string): Promise<PsnGameResult | null> {
  const token = await getAccessToken();

  const result = await makeUniversalSearch({ accessToken: token }, title, 'SocialAllAccounts');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const game = result.domainResponses.find(r => r.domain === 'Games')?.results?.[0] as any;

  if (!game?.id) return null;

  return {
    id: game.id,
    name: game.name,
    platform: game?.platform || 'PS4', // fallback
  };
}

export async function fetchTrophiesFromPsn(
  npCommunicationId: string,
  platform: 'PS3' | 'PS4' | 'PS5',
): Promise<Trophy[]> {
  const token = await getAccessToken();

  const response = await getTitleTrophies(
    { accessToken: token },
    npCommunicationId,
    'all',
    platform === 'PS3' || platform === 'PS4' ? { npServiceName: 'trophy' } : undefined,
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return response.trophies.map((t: any) => ({
    trophyId: t.trophyId,
    trophyType: t.trophyType.toLowerCase(),
    trophyName: t.trophyName,
    trophyDetail: t.trophyDetail,
    trophyIconUrl: t.trophyIconUrl,
  }));
}
