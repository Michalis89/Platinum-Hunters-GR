/**
 * User Game Item API Route
 * PATCH /api/backlog/[id] - Update game data (status, hours, notes, etc)
 * DELETE /api/backlog/[id] - Remove from library
 * PH-31: User Games Library System
 */

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import type { UserGameWithGame, UserGameUpdate, UserGameRow } from '@/types/database';

/**
 * PATCH - Update priority and/or notes for backlog item
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params; // 🔴 εδώ κάνουμε await γιατί το type είναι Promise<{ id: string }>

    // const backlogId = Number.parseInt(params.id);
    const backlogId = Number.parseInt(id, 10);

    if (Number.isNaN(backlogId)) {
      return NextResponse.json({ error: 'Μη έγκυρο ID' }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const {
      status,
      priority,
      notes,
      actual_hours_casual,
      actual_hours_platinum,
      personal_rating,
      would_recommend,
    } = body;

    // Validate at least one field is provided
    if (
      status === undefined &&
      priority === undefined &&
      notes === undefined &&
      actual_hours_casual === undefined &&
      actual_hours_platinum === undefined &&
      personal_rating === undefined &&
      would_recommend === undefined
    ) {
      return NextResponse.json(
        { error: 'Πρέπει να παρέχεται τουλάχιστον ένα πεδίο για ενημέρωση' },
        { status: 400 },
      );
    }

    // Check if item exists and belongs to user
    const { data: existingItem, error: checkError } = await supabase
      .from('user_games')
      .select('id, user_id, status')
      .eq('id', backlogId)
      .single();

    if (checkError || !existingItem) {
      return NextResponse.json({ error: 'Το στοιχείο δεν βρέθηκε' }, { status: 404 });
    }

    const typedExistingItem = existingItem as Pick<UserGameRow, 'id' | 'user_id' | 'status'>;

    if (typedExistingItem.user_id !== userId) {
      return NextResponse.json(
        { error: 'Δεν έχεις δικαίωμα να τροποποιήσεις αυτό το στοιχείο' },
        { status: 403 },
      );
    }

    // Build update object with all supported fields
    const updateData: UserGameUpdate & {
      started_at?: string;
      completed_at?: string;
      platinumed_at?: string;
      dropped_at?: string;
    } = {};

    if (status !== undefined) {
      updateData.status = status;

      // Update corresponding timestamp when status changes
      const now = new Date().toISOString();

      if (status === 'playing' && typedExistingItem.status !== 'playing') {
        updateData.started_at = now;
      } else if (status === 'completed' && typedExistingItem.status !== 'completed') {
        updateData.completed_at = now;
      } else if (status === 'platinumed' && typedExistingItem.status !== 'platinumed') {
        updateData.platinumed_at = now;
      } else if (status === 'dropped' && typedExistingItem.status !== 'dropped') {
        updateData.dropped_at = now;
      }
    }

    if (priority !== undefined) updateData.priority = priority;
    if (notes !== undefined) updateData.notes = notes;
    if (actual_hours_casual !== undefined) updateData.actual_hours_casual = actual_hours_casual;
    if (actual_hours_platinum !== undefined)
      updateData.actual_hours_platinum = actual_hours_platinum;
    if (personal_rating !== undefined) updateData.personal_rating = personal_rating;
    if (would_recommend !== undefined) updateData.would_recommend = would_recommend;

    // Update the item
    const { data: updatedItem, error: updateError } = await supabase
      .from('user_games')
      .update(updateData as never)
      .eq('id', backlogId)
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

    if (updateError) {
      console.error('User game update error:', updateError);
      return NextResponse.json({ error: 'Σφάλμα ενημέρωσης παιχνιδιού' }, { status: 500 });
    }

    // Transform data
    const typedUpdatedItem = updatedItem as UserGameWithGame;
    const transformedItem = {
      id: typedUpdatedItem.id,
      user_id: typedUpdatedItem.user_id,
      game_id: typedUpdatedItem.game_id,
      status: typedUpdatedItem.status,
      priority: typedUpdatedItem.priority,
      actual_hours_casual: typedUpdatedItem.actual_hours_casual,
      actual_hours_platinum: typedUpdatedItem.actual_hours_platinum,
      notes: typedUpdatedItem.notes,
      personal_rating: typedUpdatedItem.personal_rating,
      would_recommend: typedUpdatedItem.would_recommend,
      added_at: typedUpdatedItem.added_at,
      started_at: typedUpdatedItem.started_at,
      completed_at: typedUpdatedItem.completed_at,
      platinumed_at: typedUpdatedItem.platinumed_at,
      dropped_at: typedUpdatedItem.dropped_at,
      game: Array.isArray(typedUpdatedItem.games) ? typedUpdatedItem.games[0] : typedUpdatedItem.games,
    };

    return NextResponse.json(transformedItem);
  } catch (error) {
    console.error('Backlog update error:', error);
    return NextResponse.json({ error: 'Σφάλμα ενημέρωσης backlog' }, { status: 500 });
  }
}

/**
 * DELETE - Remove game from backlog
 */
// export async function DELETE(request: Request, { params }: { params: { id: string } }) {
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    // const userId = session.user.id;
    // const backlogId = Number.parseInt(params.id);
    const userId = session.user.id;

    const { id } = await params; // 🔴
    const backlogId = Number.parseInt(id, 10);

    if (Number.isNaN(backlogId)) {
      return NextResponse.json({ error: 'Μη έγκυρο ID' }, { status: 400 });
    }

    // Check if item exists and belongs to user
    const { data: existingItem, error: checkError } = await supabase
      .from('user_games')
      .select('id, user_id')
      .eq('id', backlogId)
      .single();

    if (checkError || !existingItem) {
      return NextResponse.json({ error: 'Το στοιχείο δεν βρέθηκε' }, { status: 404 });
    }

    const typedExistingItem = existingItem as Pick<UserGameRow, 'id' | 'user_id'>;

    if (typedExistingItem.user_id !== userId) {
      return NextResponse.json(
        { error: 'Δεν έχεις δικαίωμα να διαγράψεις αυτό το στοιχείο' },
        { status: 403 },
      );
    }

    // Delete the item
    const { error: deleteError } = await supabase.from('user_games').delete().eq('id', backlogId);

    if (deleteError) {
      console.error('User game delete error:', deleteError);
      return NextResponse.json({ error: 'Σφάλμα διαγραφής παιχνιδιού' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Το παιχνίδι αφαιρέθηκε από τη συλλογή σου' });
  } catch (error) {
    console.error('Backlog delete error:', error);
    return NextResponse.json({ error: 'Σφάλμα διαγραφής από backlog' }, { status: 500 });
  }
}
