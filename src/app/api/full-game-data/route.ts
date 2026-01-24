import { NextResponse } from 'next/server';
import supabase from '@/lib/db';
import type { Database } from '@/lib/supabase/database.types';

const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 500;
type FullGameDataRow = Database['public']['Views']['full_game_data']['Row'];
type GuideRow = Database['public']['Tables']['guides']['Row'];

type FilterQuery<T> = {
  ilike: (column: string, value: string) => T;
  contains: (column: string, value: string | readonly string[] | Record<string, unknown>) => T;
  or: (filters: string) => T;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const limitParam = Number.parseInt(searchParams.get('limit') || '', 10);
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;
    const offset = (Math.max(page, 1) - 1) * limit;

    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const platform = searchParams.get('platform') || '';
    const genre = searchParams.get('genre') || '';
    const developer = searchParams.get('developer') || '';
    const minYear = searchParams.get('minYear');
    const maxYear = searchParams.get('maxYear');

    const applyFilters = <T>(query: T & FilterQuery<T>) => {
      if (search) query.ilike('title', `%${search}%`);
      if (developer) query.ilike('developer', `%${developer}%`);
      if (minYear || maxYear) {
        const yearBounds = [
          minYear ? `release_year.gte.${minYear}` : null,
          maxYear ? `release_year.lte.${maxYear}` : null,
        ]
          .filter(Boolean)
          .join(',');

        // Keep games that have null release_year when year filters are applied
        // so records without a year (like new imports) are not hidden.
        const yearFilter = [yearBounds ? `and(${yearBounds})` : null, 'release_year.is.null']
          .filter(Boolean)
          .join(',');

        if (yearFilter) query.or(yearFilter);
      }
      if (platform) query.contains('platforms', [platform]);
      if (genre) query.contains('genres', [genre]);
      return query;
    };

    const pagedQuery = applyFilters(
      supabase
        .from('full_game_data')
        .select('*', { count: 'exact' })
        .order('title', { ascending: true }),
    );

    const [
      { data: gamesData, error: gamesError, count: totalCount },
      { data: guidesData, error: guidesError },
      { data: metaData, error: metaError },
      { data: hoursData, error: hoursError },
      { data: minYearData, error: minYearError },
      { data: maxYearData, error: maxYearError },
    ] = await Promise.all([
      pagedQuery.range(offset, offset + limit - 1),
      supabase.from('guides').select('game_id, estimated_playthroughs').eq('status', 'published'),
      applyFilters(supabase.from('full_game_data').select('developer,genres')),
      applyFilters(
        supabase
          .from('full_game_data')
          .select('average_hours')
          .not('average_hours', 'is', null)
          .order('average_hours', { ascending: false })
          .limit(1),
      ),
      applyFilters(
        supabase
          .from('full_game_data')
          .select('release_year')
          .not('release_year', 'is', null)
          .order('release_year', { ascending: true })
          .limit(1),
      ),
      applyFilters(
        supabase
          .from('full_game_data')
          .select('release_year')
          .not('release_year', 'is', null)
          .order('release_year', { ascending: false })
          .limit(1),
      ),
    ]);

    if (gamesError) throw new Error(gamesError.message);
    if (guidesError) throw new Error(guidesError.message);
    if (metaError) throw new Error(metaError.message);
    if (hoursError) throw new Error(hoursError.message);
    if (minYearError) throw new Error(minYearError.message);
    if (maxYearError) throw new Error(maxYearError.message);

    const metaRows = (metaData ?? []) as Array<{
      developer?: string | null;
      genres?: string[] | null;
    }>;
    const developersCount = new Set(
      metaRows.map(item => item.developer).filter((dev): dev is string => Boolean(dev)),
    ).size;
    const genresCount = new Set(
      metaRows.flatMap(item => item.genres || []).filter((genre): genre is string => Boolean(genre)),
    ).size;

    const playthroughStats = new Map<number, { total: number; count: number; max: number }>();

    (guidesData ?? []).forEach((guide: Pick<GuideRow, 'game_id' | 'estimated_playthroughs'>) => {
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
      ((gamesData ?? []) as FullGameDataRow[]).map(game => {
        if (game.id === null || game.id === undefined) {
          return game;
        }

        const gameId = game.id;
        const stats = playthroughStats.get(gameId);
        const average_playthroughs =
          stats && stats.count > 0 ? Number((stats.total / stats.count).toFixed(2)) : null;
        const max_playthroughs = stats && stats.count > 0 ? stats.max : null;

        return {
          ...game,
          average_playthroughs,
          max_playthroughs,
        };
      });

    return NextResponse.json({
      data: dataWithRuns,
      pagination: {
        page: Math.max(page, 1),
        limit,
        total: totalCount ?? gamesData?.length ?? 0,
        meta: {
          developersCount,
          genresCount,
          maxHours: (() => {
            const rows = (hoursData ?? []) as Array<{ average_hours?: number | null }>;
            return rows.length > 0 && typeof rows[0].average_hours === 'number'
              ? rows[0].average_hours
              : null;
          })(),
          minYearMeta: (() => {
            const rows = (minYearData ?? []) as Array<{ release_year?: number | null }>;
            return rows.length > 0 && typeof rows[0].release_year === 'number'
              ? rows[0].release_year
              : null;
          })(),
          maxYearMeta: (() => {
            const rows = (maxYearData ?? []) as Array<{ release_year?: number | null }>;
            return rows.length > 0 && typeof rows[0].release_year === 'number'
              ? rows[0].release_year
              : null;
          })(),
        },
      },
    });
  } catch (err) {
    console.error('❌ Σφάλμα κατά τη φόρτωση των παιχνιδιών:', err);
    return NextResponse.json({ error: 'Αποτυχία φόρτωσης των παιχνιδιών' }, { status: 500 });
  }
}
