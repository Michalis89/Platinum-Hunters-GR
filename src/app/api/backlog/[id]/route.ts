/**
 * User Game Item API Route
 * PATCH /api/backlog/[id] - Update game data (status, hours, notes, etc)
 * DELETE /api/backlog/[id] - Remove from library
 * PH-31: User Games Library System
 */

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

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
    // @ts-expect-error - Supabase typed as never here, safe runtime
    if (existingItem.user_id !== userId) {
      return NextResponse.json(
        { error: 'Δεν έχεις δικαίωμα να τροποποιήσεις αυτό το στοιχείο' },
        { status: 403 },
      );
    }

    // Build update object with all supported fields
    const updateData: {
      status?: string;
      priority?: number;
      notes?: string | null;
      actual_hours_casual?: number | null;
      actual_hours_platinum?: number | null;
      personal_rating?: number | null;
      would_recommend?: boolean | null;
      started_at?: string;
      completed_at?: string;
      platinumed_at?: string;
      dropped_at?: string;
    } = {};

    if (status !== undefined) {
      updateData.status = status;

      // Update corresponding timestamp when status changes
      const now = new Date().toISOString();
      // @ts-expect-error - Supabase typed as never here, safe runtime

      if (status === 'playing' && existingItem.status !== 'playing') {
        updateData.started_at = now;
        // @ts-expect-error - Supabase typed as never here, safe runtime
      } else if (status === 'completed' && existingItem.status !== 'completed') {
        updateData.completed_at = now;
        // @ts-expect-error - Supabase typed as never here, safe runtime
      } else if (status === 'platinumed' && existingItem.status !== 'platinumed') {
        updateData.platinumed_at = now;
        // @ts-expect-error - Supabase typed as never here, safe runtime
      } else if (status === 'dropped' && existingItem.status !== 'dropped') {
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
      // @ts-expect-error - Supabase typed as never here, safe runtime
      .update(updateData)
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
    const transformedItem = {
      // @ts-expect-error - Supabase typed as never here, safe runtime
      id: updatedItem.id,
      // @ts-expect-error - Supabase typed as never here, safe runtime

      user_id: updatedItem.user_id,
      // @ts-expect-error - Supabase typed as never here, safe runtime

      game_id: updatedItem.game_id,
      // @ts-expect-error - Supabase typed as never here, safe runtime

      status: updatedItem.status,
      // @ts-expect-error - Supabase typed as never here, safe runtime

      priority: updatedItem.priority,
      // @ts-expect-error - Supabase typed as never here, safe runtime

      actual_hours_casual: updatedItem.actual_hours_casual,
      // @ts-expect-error - Supabase typed as never here, safe runtime

      actual_hours_platinum: updatedItem.actual_hours_platinum,
      // @ts-expect-error - Supabase typed as never here, safe runtime

      notes: updatedItem.notes,
      // @ts-expect-error - Supabase typed as never here, safe runtime

      personal_rating: updatedItem.personal_rating,
      // @ts-expect-error - Supabase typed as never here, safe runtime

      would_recommend: updatedItem.would_recommend,
      // @ts-expect-error - Supabase typed as never here, safe runtime

      added_at: updatedItem.added_at,
      // @ts-expect-error - Supabase typed as never here, safe runtime

      started_at: updatedItem.started_at,
      // @ts-expect-error - Supabase typed as never here, safe runtime

      completed_at: updatedItem.completed_at,
      // @ts-expect-error - Supabase typed as never here, safe runtime

      platinumed_at: updatedItem.platinumed_at,
      // @ts-expect-error - Supabase typed as never here, safe runtime

      dropped_at: updatedItem.dropped_at,
      // @ts-expect-error - Supabase typed as never here, safe runtime

      game: Array.isArray(updatedItem.games) ? updatedItem.games[0] : updatedItem.games,
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
    // @ts-expect-error - Supabase typed as never here, safe runtime
    if (existingItem.user_id !== userId) {
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
