/**
 * User Games API Route
 * GET /api/backlog - Fetch user's game library with details
 * POST /api/backlog - Add game to library
 * PH-31: User Games Library System (formerly Backlog)
 */

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

/**
 * GET - Fetch user's backlog with game details
 */
export async function GET() {
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

    // Fetch user games with game details (JOIN)
    const { data: userGames, error: gamesError } = await supabase
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
        would_recommend,
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
      .eq('user_id', userId)
      .order('priority', { ascending: false })
      .order('added_at', { ascending: false });

    if (gamesError) {
      console.error('User games fetch error:', gamesError);
      return NextResponse.json({ error: 'Σφάλμα φόρτωσης παιχνιδιών' }, { status: 500 });
    }

    // Transform data to flatten game object
    const transformedGames = userGames.map(item => ({
      id: item.id,
      user_id: item.user_id,
      game_id: item.game_id,
      status: item.status,
      priority: item.priority,
      actual_hours_casual: item.actual_hours_casual,
      actual_hours_platinum: item.actual_hours_platinum,
      notes: item.notes,
      personal_rating: item.personal_rating,
      would_recommend: item.would_recommend,
      added_at: item.added_at,
      started_at: item.started_at,
      completed_at: item.completed_at,
      platinumed_at: item.platinumed_at,
      dropped_at: item.dropped_at,
      game: Array.isArray(item.games) ? item.games[0] : item.games,
    }));

    return NextResponse.json(transformedGames);
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
    const { game_id, priority = 0, notes = null, status = 'to_play' } = body;

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
    const { data: newItem, error: insertError } = await supabase
      .from('user_games')
      .insert({
        user_id: userId,
        game_id,
        status,
        priority,
        notes,
      })
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
        would_recommend,
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
    const transformedItem = {
      id: newItem.id,
      user_id: newItem.user_id,
      game_id: newItem.game_id,
      status: newItem.status,
      priority: newItem.priority,
      actual_hours_casual: newItem.actual_hours_casual,
      actual_hours_platinum: newItem.actual_hours_platinum,
      notes: newItem.notes,
      personal_rating: newItem.personal_rating,
      would_recommend: newItem.would_recommend,
      added_at: newItem.added_at,
      started_at: newItem.started_at,
      completed_at: newItem.completed_at,
      platinumed_at: newItem.platinumed_at,
      dropped_at: newItem.dropped_at,
      game: Array.isArray(newItem.games) ? newItem.games[0] : newItem.games,
    };

    return NextResponse.json(transformedItem, { status: 201 });
  } catch (error) {
    console.error('Backlog add error:', error);
    return NextResponse.json({ error: 'Σφάλμα προσθήκης στο backlog' }, { status: 500 });
  }
}
