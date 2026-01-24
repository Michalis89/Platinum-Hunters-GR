import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import type { Database } from '@/lib/supabase/database.types';
import { insertActivity } from '@/lib/services/activityService';
import { getUserGamesWithDetails } from '@/lib/supabase/queries';
import { API_ERRORS } from '@/lib/api/errors';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { fail, ok, okWithPagination } from '@/lib/api/response';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

type UserGameRow = Database['public']['Tables']['user_games']['Row'];
type GameRow = Database['public']['Tables']['games']['Row'];
type UserGameWithGame = UserGameRow & { games: GameRow | GameRow[] | null };

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const limitParam = Number.parseInt(searchParams.get('limit') || '', 10);
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;
    const offset = (Math.max(page, 1) - 1) * limit;

    const supabase = await createRouteHandlerClient();

    const session = await requireAuth(supabase);

    const userId = session.user.id;

    const {
      data: userGames,
      error: gamesError,
      count: totalCount,
    } = await getUserGamesWithDetails(supabase, { userId, limit, offset });

    if (gamesError) {
      console.error('User games fetch error:', gamesError);
      return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    }

    const transformedGames = (userGames ?? []).map((item: UserGameWithGame) => ({
      id: item.id,
      user_id: item.user_id,
      game_id: item.game_id,
      status: item.status,
      priority: item.priority,
      actual_hours_casual: item.actual_hours_casual,
      actual_hours_platinum: item.actual_hours_platinum,
      notes: item.notes,
      personal_rating: item.personal_rating,
      personal_difficulty: item.personal_difficulty,
      would_recommend: item.would_recommend,
      is_favorite: item.is_favorite,
      added_at: item.added_at,
      started_at: item.started_at,
      completed_at: item.completed_at,
      platinumed_at: item.platinumed_at,
      dropped_at: item.dropped_at,
      game: Array.isArray(item.games) ? item.games[0] : item.games,
    }));

    return okWithPagination(transformedGames, {
      page: Math.max(page, 1),
      limit,
      total: totalCount ?? transformedGames.length,
    });
  } catch (error) {
    console.error('Backlog error:', error);
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createRouteHandlerClient();

    // Get current session
    const session = await requireAuth(supabase);

    const userId = session.user.id;

    // Parse request body
    const body = await request.json();
    const {
      game_id,
      priority = 0,
      notes = null,
      status = 'to_play',
      personal_rating = null,
      personal_difficulty = null,
      would_recommend = null,
      is_favorite = false,
    } = body;

    // Validate game_id
    if (!game_id || typeof game_id !== 'number') {
      return fail({ error: 'Μη έγκυρο game_id' }, 400);
    }

    // Check if game exists
    const { data: gameExists, error: gameCheckError } = await supabase
      .from('games')
      .select('id, title, slug')
      .eq('id', game_id)
      .single();

    if (gameCheckError || !gameExists) {
      return fail({ error: 'Το παιχνίδι δεν βρέθηκε' }, 404);
    }

    // Insert into user_games
    const insertData: Database['public']['Tables']['user_games']['Insert'] = {
      user_id: userId,
      game_id,
      status,
      priority,
      notes,
      personal_rating,
      personal_difficulty,
      would_recommend,
      is_favorite,
    };

    const { data: newItem, error: insertError } = await supabase
      .from('user_games')
      .insert(insertData)
      .select(
        `
        id,
        user_id,
        game_id,
        status,
        priority,
        actual_hours_casual,
        actual_hours_platinum,
        notes,
        personal_rating,
        personal_difficulty,
        would_recommend,
        is_favorite,
        added_at,
        started_at,
        completed_at,
        platinumed_at,
        dropped_at,
        games (
          id,
          title,
          slug,
          description,
          cover_image,
          background_image,
          trophy_platinum,
          trophy_gold,
          trophy_silver,
          trophy_bronze,
          trophy_total,
          release_date,
          release_year,
          metacritic_score,
          rating,
          total_guides,
          average_difficulty,
          average_hours,
          created_at,
          updated_at
        )
      `,
      )
      .single();

    if (insertError) {
      // Check for duplicate (UNIQUE constraint violation)
      if (insertError.code === '23505') {
        return fail({ error: 'Το παιχνίδι υπάρχει ήδη στη συλλογή σου', code: 'CONFLICT' }, 409);
      }
      console.error('User games insert error:', insertError);
      return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    }

    if (!newItem) {
      return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    }
    const typedNewItem = newItem;
    const transformedItem = {
      id: typedNewItem.id,
      user_id: typedNewItem.user_id,
      game_id: typedNewItem.game_id,
      status: typedNewItem.status,
      priority: typedNewItem.priority,
      actual_hours_casual: typedNewItem.actual_hours_casual,
      actual_hours_platinum: typedNewItem.actual_hours_platinum,
      notes: typedNewItem.notes,
      personal_rating: typedNewItem.personal_rating,
      personal_difficulty: typedNewItem.personal_difficulty,
      would_recommend: typedNewItem.would_recommend,
      is_favorite: typedNewItem.is_favorite,
      added_at: typedNewItem.added_at,
      started_at: typedNewItem.started_at,
      completed_at: typedNewItem.completed_at,
      platinumed_at: typedNewItem.platinumed_at,
      dropped_at: typedNewItem.dropped_at,
      game: Array.isArray(typedNewItem.games) ? typedNewItem.games[0] : typedNewItem.games,
    };

    const { data: profileData } = await supabase
      .from('users')
      .select('username, display_name, avatar_url')
      .eq('id', userId)
      .maybeSingle();

    await insertActivity(
      supabase,
      userId,
      'backlog_added',
      {
        gameId: transformedItem.game?.id,
        gameTitle: transformedItem.game?.title,
        gameSlug: transformedItem.game?.slug,
        status: transformedItem.status,
        username: (profileData as { username?: string } | null)?.username,
        display_name: (profileData as { display_name?: string } | null)?.display_name,
        avatar_url: (profileData as { avatar_url?: string } | null)?.avatar_url,
      },
      { logContext: '⚠️ Activity insert' },
    );

    return ok(transformedItem, { status: 201 });
  } catch (error) {
    console.error('Backlog add error:', error);
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}
