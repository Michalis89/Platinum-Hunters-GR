import supabase from '@/lib/db';
import { fetchTrophiesFromPsn } from '@/lib/psnClient';
import { fail, ok } from '@/lib/api/response';

type TrophyRecord = {
  id?: number;
  name: string;
  description: string | null;
  type: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  icon_url: string | null;
  is_hidden: boolean | null;

  rarity_percentage: number | null;
  psn_trophy_id: string | null;
};

type TrophyType = TrophyRecord['type'];
type PsnPlatform = 'PS5' | 'PS4' | 'PS3';

const TROPHY_TYPE_MAP: Record<string, TrophyRecord['type']> = {
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
};

const CACHE_TTL_HOURS = 24;

const isTrophyType = (value: string): value is TrophyType =>
  value === 'Platinum' || value === 'Gold' || value === 'Silver' || value === 'Bronze';

const isPsnPlatform = (value: string): value is PsnPlatform =>
  value.startsWith('PS5') || value.startsWith('PS4') || value.startsWith('PS3');

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gameId = Number(id);

  if (!Number.isFinite(gameId)) {
    return fail({ error: 'Μη έγκυρο game id' }, 400);
  }

  try {
    const [{ data: game, error: gameError }, { data: platformsData }] = await Promise.all([
      supabase.from('games').select('id, psn_trophy_id').eq('id', gameId).single(),
      supabase.from('full_game_data').select('platforms').eq('id', gameId).maybeSingle(),
    ]);

    if (gameError) {
      console.error('❌ Σφάλμα ανάκτησης game:', gameError);
      return fail({ error: 'Αποτυχία εύρεσης παιχνιδιού' }, 404);
    }

    if (!game?.psn_trophy_id) {
      return fail({ error: 'Δεν υπάρχει PSN trophy id για αυτό το παιχνίδι' }, 404);
    }

    const { data: cachedTrophies, error: cacheError } = await supabase
      .from('trophies')
      .select('*')
      .eq('game_id', gameId)
      .order('id', { ascending: true });

    if (cacheError) {
      console.error('❌ Σφάλμα ανάκτησης cached trophies:', cacheError);
    }

    const cacheIsFresh =
      cachedTrophies &&
      cachedTrophies.length > 0 &&
      cachedTrophies[0].created_at &&
      new Date(cachedTrophies[0].created_at).getTime() >
        Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000;

    if (cachedTrophies && cachedTrophies.length > 0 && cacheIsFresh) {
      return ok({
        source: 'cache',
        trophies: cachedTrophies.map(t => ({
          id: t.id,
          name: t.name,
          description: t.description,
          type: t.type,
          icon_url: t.icon_url,
          is_hidden: t.is_hidden ?? null,
          rarity_percentage: t.rarity_percentage ?? null,
          psn_trophy_id: t.psn_trophy_id ?? null,
        })),
        counts: summarizeTrophies(
          cachedTrophies.map(t => ({
            name: t.name,
            description: t.description,
            type: isTrophyType(t.type) ? t.type : 'Bronze',
            icon_url: t.icon_url,
            is_hidden: t.is_hidden ?? null,
            rarity_percentage: t.rarity_percentage ?? null,
            psn_trophy_id: t.psn_trophy_id ?? null,
          })),
        ),
      });
    }

    const platform =
      (platformsData?.platforms?.find(
        (p: string): p is PsnPlatform => isPsnPlatform(p) && p.startsWith('PS5'),
      ) ??
        platformsData?.platforms?.find(
          (p: string): p is PsnPlatform => isPsnPlatform(p) && p.startsWith('PS4'),
        ) ??
        platformsData?.platforms?.find(
          (p: string): p is PsnPlatform => isPsnPlatform(p) && p.startsWith('PS3'),
        ) ??
        'PS5') as PsnPlatform;

    let psnTrophies;
    try {
      psnTrophies = await fetchTrophiesFromPsn(game.psn_trophy_id, platform);
    } catch (psnError) {
      console.error('❌ PSN fetch error (returning empty list for now):', psnError);
      // Temporary fallback: return empty list with 200 to avoid breaking UI
      return ok({
        source: 'psn_error_fallback',
        trophies: [],
        counts: summarizeTrophies([]),
      });
    }

    const prepared: TrophyRecord[] = psnTrophies.map(psn => ({
      name: psn.trophyName || 'Άγνωστο τρόπαιο',
      description: psn.trophyDetail || null,
      type: TROPHY_TYPE_MAP[psn.trophyType.toLowerCase()] ?? 'Bronze',
      icon_url: psn.trophyIconUrl || null,
      is_hidden: null,
      rarity_percentage: null,
      psn_trophy_id: psn.trophyId ? String(psn.trophyId) : null,
    }));

    // Replace any stale data with the fresh snapshot
    const { error: deleteError } = await supabase.from('trophies').delete().eq('game_id', gameId);
    if (deleteError) {
      console.warn('⚠️ Δεν ήταν δυνατή η διαγραφή παλιών trophies:', deleteError);
    }

    const { error: insertError } = await supabase
      .from('trophies')
      .insert(prepared.map(t => ({ ...t, game_id: gameId })));

    if (insertError) {
      console.warn('⚠️ Δεν ήταν δυνατή η αποθήκευση trophies στη βάση:', insertError);
    }

    return ok({
      source: insertError ? 'psn_live_no_cache' : 'psn_live',
      trophies: prepared,
      counts: summarizeTrophies(prepared),
    });
  } catch (err) {
    console.error('❌ Σφάλμα ανάκτησης trophies:', err);
    return fail({ error: 'Αποτυχία ανάκτησης trophies' }, 500);
  }
}

function summarizeTrophies(trophies: Pick<TrophyRecord, 'type'>[]) {
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0, total: 0 };
  trophies.forEach(t => {
    if (t.type === 'Platinum') counts.platinum += 1;
    else if (t.type === 'Gold') counts.gold += 1;
    else if (t.type === 'Silver') counts.silver += 1;
    else if (t.type === 'Bronze') counts.bronze += 1;
    counts.total += 1;
  });
  return counts;
}
