/* eslint-disable @typescript-eslint/no-explicit-any */
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

  return accessToken;
}

export interface PsnGameResult {
  id: string;
  name: string;
  platform: 'PS3' | 'PS4' | 'PS5';
}

export type PsnTrophy = {
  trophyId: number;
  trophyType: string;
  trophyName: string;
  trophyDetail: string;
  trophyIconUrl?: string | null;
};

export async function searchPsnGame(title: string): Promise<PsnGameResult | null> {
  const token = await getAccessToken();

  const searchTypes: Array<Parameters<typeof makeUniversalSearch>[2]> = ['SocialAllAccounts'];

  let game: any = null;
  for (const type of searchTypes) {
    const result = await makeUniversalSearch({ accessToken: token }, title, type);
    game = result.domainResponses.find(r => r.domain === 'Games')?.results?.[0] as any;
    if (game?.id) break;
  }

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
): Promise<PsnTrophy[]> {
  const token = await getAccessToken();

  const response = await getTitleTrophies(
    { accessToken: token },
    npCommunicationId,
    'all',
    platform === 'PS3' || platform === 'PS4' ? { npServiceName: 'trophy' } : undefined,
  );

  if (!response || !Array.isArray((response as any).trophies)) {
    throw new Error('PSN did not return a trophies array');
  }

  return response.trophies.map((t: any) => ({
    trophyId: t.trophyId,
    trophyType: t.trophyType.toLowerCase(),
    trophyName: t.trophyName,
    trophyDetail: t.trophyDetail,
    trophyIconUrl: t.trophyIconUrl,
  }));
}
