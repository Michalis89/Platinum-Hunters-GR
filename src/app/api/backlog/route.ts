/**
 * User Games API Route
 * GET /api/backlog - Fetch user's game library with details
 * POST /api/backlog - Add game to library
 * PH-31: User Games Library System (formerly Backlog)
 */

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import type { UserGameWithGame, UserGameInsert } from '@/types/database';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

/**
 * GET - Fetch user's backlog with game details
 */
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

    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Μη εξουσιοδοτημένη πρόσβαση' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch user games with game details (JOIN)
    const { data: userGames, error: gamesError, count: totalCount } = await supabase
      .from('user_games')
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
        { count: 'exact' },
      )
      .eq('user_id', userId)
      .order('priority', { ascending: false })
      .order('added_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (gamesError) {
      console.error('User games fetch error:', gamesError);
      return NextResponse.json({ error: 'Σφάλμα φόρτωσης παιχνιδιών' }, { status: 500 });
    }

    // Transform data to flatten game object
    const transformedGames = (userGames as UserGameWithGame[]).map(item => ({
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

    return NextResponse.json({
      data: transformedGames,
      pagination: {
        page: Math.max(page, 1),
        limit,
        total: totalCount ?? transformedGames.length,
      },
    });
  } catch (error) {
    console.error('Backlog error:', error);
    return NextResponse.json({ error: 'Σφάλμα φόρτωσης backlog' }, { status: 500 });
  }
}

/**
 * POST - Add game to backlog
 */
export async function POST(request: Request) {
  try {
    const supabase = await createRouteHandlerClient();

    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Μη εξουσιοδοτημένη πρόσβαση' }, { status: 401 });
    }

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
      return NextResponse.json({ error: 'Μη έγκυρο game_id' }, { status: 400 });
    }

    // Check if game exists
    const { data: gameExists, error: gameCheckError } = await supabase
      .from('games')
      .select('id')
      .eq('id', game_id)
      .single();

    if (gameCheckError || !gameExists) {
      return NextResponse.json({ error: 'Το παιχνίδι δεν βρέθηκε' }, { status: 404 });
    }

    // Insert into user_games
    const insertData: UserGameInsert = {
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
      .insert(insertData as never)
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
        return NextResponse.json(
          { error: 'Το παιχνίδι υπάρχει ήδη στη συλλογή σου' },
          { status: 409 },
        );
      }
      console.error('User games insert error:', insertError);
      return NextResponse.json({ error: 'Σφάλμα προσθήκης παιχνιδιού' }, { status: 500 });
    }

    // Transform data
    const typedNewItem = newItem as UserGameWithGame;
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

    return NextResponse.json(transformedItem, { status: 201 });
  } catch (error) {
    console.error('Backlog add error:', error);
    return NextResponse.json({ error: 'Σφάλμα προσθήκης στο backlog' }, { status: 500 });
  }
}
