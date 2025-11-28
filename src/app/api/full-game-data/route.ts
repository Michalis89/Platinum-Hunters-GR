import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function GET() {
  try {
    const [{ data: gamesData, error: gamesError }, { data: guidesData, error: guidesError }] =
      await Promise.all([
        supabase.from('full_game_data').select('*'),
        supabase
          .from('guides')
          .select('game_id, estimated_playthroughs')
          .eq('status', 'published'),
      ]);

    if (gamesError) throw new Error(gamesError.message);
    if (guidesError) throw new Error(guidesError.message);

    const playthroughStats = new Map<number, { total: number; count: number; max: number }>();

    (guidesData ?? []).forEach(guide => {
      const rawRuns = guide.estimated_playthroughs;
      if (rawRuns === null || rawRuns === undefined) return;

      const runs = Number(rawRuns);
      if (!Number.isFinite(runs)) return;

      const existing = playthroughStats.get(guide.game_id) ?? { total: 0, count: 0, max: 0 };
      playthroughStats.set(guide.game_id, {
        total: existing.total + runs,
        count: existing.count + 1,
        max: Math.max(existing.max, runs),
      });
    });

    const dataWithRuns =
      gamesData?.map(game => {
        const stats = playthroughStats.get(game.id);
        const average_playthroughs =
          stats && stats.count > 0 ? Number((stats.total / stats.count).toFixed(2)) : null;
        const max_playthroughs = stats && stats.count > 0 ? stats.max : null;

        return {
          ...game,
          average_playthroughs,
          max_playthroughs,
        };
      }) ?? [];

    return NextResponse.json(dataWithRuns);
  } catch (err) {
    console.error('❌ Σφάλμα κατά τη φόρτωση των παιχνιδιών:', err);
    return NextResponse.json({ error: 'Αποτυχία φόρτωσης των παιχνιδιών' }, { status: 500 });
  }
}
