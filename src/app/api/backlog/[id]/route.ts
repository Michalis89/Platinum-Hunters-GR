/**
 * User Game Item API Route
 * PATCH /api/backlog/[id] - Update game data (status, hours, notes, etc)
 * DELETE /api/backlog/[id] - Remove from library
 * PH-31: User Games Library System
 */

import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import type { UserGameWithGame, UserGameUpdate, UserGameRow, Database } from '@/types/database';
import { insertActivity } from '@/lib/services/activityService';
import { API_ERRORS } from '@/lib/api/errors';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { fail, ok } from '@/lib/api/response';
import { revalidateCache } from '@/lib/cache/tags';

/**
 * PATCH - Update priority and/or notes for backlog item
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createRouteHandlerClient();

    const session = await requireAuth(supabase);

    const userId = session.user.id;
    const { id } = await params;
    const backlogId = Number.parseInt(id, 10);

    if (Number.isNaN(backlogId)) {
      return fail({ error: 'Μη έγκυρο ID' }, 400);
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
      personal_difficulty,
      would_recommend,
      is_favorite,
    } = body;

    // Validate at least one field is provided
    if (
      status === undefined &&
      priority === undefined &&
      notes === undefined &&
      actual_hours_casual === undefined &&
      actual_hours_platinum === undefined &&
      personal_rating === undefined &&
      personal_difficulty === undefined &&
      would_recommend === undefined &&
      is_favorite === undefined
    ) {
      return fail(
        { error: 'Πρέπει να παρέχεται τουλάχιστον ένα πεδίο για ενημέρωση' },
        400,
      );
    }

    // Check if item exists and belongs to user
    const { data: existingItem, error: checkError } = await supabase
      .from('user_games')
      .select('id, user_id, status, is_favorite')
      .eq('id', backlogId)
      .single();

    if (checkError || !existingItem) {
      return fail({ error: 'Το στοιχείο δεν βρέθηκε' }, 404);
    }

    const typedExistingItem = existingItem as Pick<UserGameRow, 'id' | 'user_id' | 'status' | 'is_favorite'>;

    if (typedExistingItem.user_id !== userId) {
      return fail({ error: 'Δεν έχεις δικαίωμα να τροποποιήσεις αυτό το στοιχείο' }, 403);
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
    if (personal_difficulty !== undefined) updateData.personal_difficulty = personal_difficulty;
    if (would_recommend !== undefined) updateData.would_recommend = would_recommend;
    if (is_favorite !== undefined) updateData.is_favorite = is_favorite;

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

    if (updateError) {
      console.error('User game update error:', updateError);
      return fail({ error: 'Σφάλμα ενημέρωσης παιχνιδιού' }, 500);
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
      personal_difficulty: typedUpdatedItem.personal_difficulty,
      would_recommend: typedUpdatedItem.would_recommend,
      is_favorite: typedUpdatedItem.is_favorite,
      added_at: typedUpdatedItem.added_at,
      started_at: typedUpdatedItem.started_at,
      completed_at: typedUpdatedItem.completed_at,
      platinumed_at: typedUpdatedItem.platinumed_at,
      dropped_at: typedUpdatedItem.dropped_at,
      game: Array.isArray(typedUpdatedItem.games) ? typedUpdatedItem.games[0] : typedUpdatedItem.games,
    };

    // Log activity if status changed
    const gameData = transformedItem.game as Database['public']['Tables']['games']['Row'];

    if (
      status !== undefined &&
      status !== typedExistingItem.status
    ) {
      const { data: profileData } = await supabase
        .from('users')
        .select('username, display_name, avatar_url')
        .eq('id', userId)
        .maybeSingle();

      await insertActivity(supabase, userId, 'backlog_status', {
        gameId: gameData?.id,
        gameTitle: gameData?.title,
        gameSlug: gameData?.slug,
        status,
        previousStatus: typedExistingItem.status,
        username: (profileData as { username?: string } | null)?.username,
        display_name: (profileData as { display_name?: string } | null)?.display_name,
        avatar_url: (profileData as { avatar_url?: string } | null)?.avatar_url,
      });
    }

    // Log favorite toggle
    if (is_favorite !== undefined && is_favorite !== typedExistingItem.is_favorite) {
      const { data: profileData } = await supabase
        .from('users')
        .select('username, display_name, avatar_url')
        .eq('id', userId)
        .maybeSingle();

      await insertActivity(supabase, userId, 'backlog_status', {
        gameId: gameData?.id,
        gameTitle: gameData?.title,
        gameSlug: gameData?.slug,
        favoriteAction: is_favorite ? 'added' : 'removed',
        username: (profileData as { username?: string } | null)?.username,
        display_name: (profileData as { display_name?: string } | null)?.display_name,
        avatar_url: (profileData as { avatar_url?: string } | null)?.avatar_url,
      });
    }

    // Revalidate user backlog cache
    revalidateCache.userBacklog(userId);

    return ok(transformedItem);
  } catch (error) {
    console.error('Backlog update error:', error);
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

/**
 * DELETE - Remove game from backlog
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createRouteHandlerClient();

    const session = await requireAuth(supabase);

    const userId = session.user.id;
    const { id } = await params;
    const backlogId = Number.parseInt(id, 10);

    if (Number.isNaN(backlogId)) {
      return fail({ error: 'Μη έγκυρο ID' }, 400);
    }

    // Check if item exists and belongs to user
    const { data: existingItem, error: checkError } = await supabase
      .from('user_games')
      .select('id, user_id')
      .eq('id', backlogId)
      .single();

    if (checkError || !existingItem) {
      return fail({ error: 'Το στοιχείο δεν βρέθηκε' }, 404);
    }

    const typedExistingItem = existingItem as Pick<UserGameRow, 'id' | 'user_id'>;

    if (typedExistingItem.user_id !== userId) {
      return fail({ error: 'Δεν έχεις δικαίωμα να διαγράψεις αυτό το στοιχείο' }, 403);
    }

    // Delete the item
    const { error: deleteError } = await supabase.from('user_games').delete().eq('id', backlogId);

    if (deleteError) {
      console.error('User game delete error:', deleteError);
      return fail({ error: 'Σφάλμα διαγραφής παιχνιδιού' }, 500);
    }

    // Revalidate user backlog cache
    revalidateCache.userBacklog(userId);

    return ok({ message: 'Το παιχνίδι αφαιρέθηκε από τη συλλογή σου' });
  } catch (error) {
    console.error('Backlog delete error:', error);
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}
