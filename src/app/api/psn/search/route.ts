/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { makeUniversalSearch } from 'psn-api';
import { getAccessToken, searchPsnGame } from '@/lib/psnClient';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title')?.trim();
  const debug = searchParams.get('debug');

  if (!title) {
    return NextResponse.json({ error: 'Απαιτείται τίτλος παιχνιδιού (title)' }, { status: 400 });
  }

  try {
    if (debug === '1' || debug === 'true') {
      const accessToken = await getAccessToken();
      const attempts = ['GameContent', 'SocialAllAccounts', 'SocialFriends'];
      const results: Array<{ domain: string; games: any[] }> = [];

      for (const type of attempts) {
        try {
          const raw = await makeUniversalSearch({ accessToken }, title, type as any);
          const games =
            raw.domainResponses
              ?.find((r: any) => r.domain === 'Games')
              ?.results?.slice(0, 10)
              ?.map((g: any) => ({
                id: g.id,
                name: g.name,
                platform: g.platform,
              })) ?? [];
          results.push({
            domain: type,
            games,
          });
          if (games.length > 0) break;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          results.push({ domain: `${type} (error)`, games: [] });
        }
      }

      return NextResponse.json({
        note: 'debug=true προσπαθεί με πολλούς search types',
        attempts: results,
      });
    }

    const result = await searchPsnGame(title);

    if (!result) {
      return NextResponse.json(
        {
          error: 'Δεν βρέθηκε PSN τίτλος για αυτό το query',
          suggestions: [
            'Δοκίμασε πιο απλό τίτλο (π.χ. μόνο το βασικό όνομα)',
            'Δοκίμασε αγγλικά χωρίς ειδικούς χαρακτήρες',
          ],
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      npCommunicationId: result.id,
      name: result.name,
      platform: result.platform,
    });
  } catch (error) {
    console.error('❌ PSN search error:', error);
    return NextResponse.json(
      {
        error: 'Αποτυχία αναζήτησης PSN τίτλου',
        hint: 'Επιβεβαίωσε ότι το PSN_NPSSO_TOKEN στο .env.local είναι σωστό (cookie npsso) και έχεις κάνει restart το dev server.',
      },
      { status: 500 },
    );
  }
}
