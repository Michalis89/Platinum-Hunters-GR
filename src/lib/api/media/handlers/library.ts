import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import type { Database } from '@/lib/supabase/database.types';
import { insertActivity } from '@/lib/services/activityService';
import { getUserBasicInfo } from '@/lib/services/userService';
import {
  AUTH_ERROR,
  UNSUPPORTED_CATEGORY,
  MISSING_MEDIA_ID,
  NO_UPDATES_PROVIDED,
  UNTITLED_FALLBACK,
  INTERNAL_SERVER_ERROR,
} from '@/lib/constants/messages';
import type { MediaCategoryConfig } from '../config';
import type { UpdateLibraryRequestBody, LibraryRow, UserProfile } from '../types';
import { mapLibraryEntry } from '../utils/entry-mapper';
import { resolveTitle } from '../utils/title-resolver';

/**
 * Generic handler for GET /api/{category}/library
 * Fetches user's library entries for the category
 *
 * @param req - Next.js Request object
 * @param config - Category configuration
 * @returns Response with library items array
 */
export async function handleLibraryGet(
  req: Request,
  config: MediaCategoryConfig,
): Promise<Response> {
  try {
    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || config.defaultCategory;

    // Validate category is in subcategories
    if (!config.subcategories.includes(category)) {
      return NextResponse.json({ error: UNSUPPORTED_CATEGORY }, { status: 400 });
    }

    // Auth check
    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);

    // Fetch library entries
    const { data, error } = await supabase
      .from('user_media_entries')
      .select(config.librarySelectFields)
      .eq('user_id', session.user.id)
      .eq('media_items.category', category)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Map entries to client format
    const items = Array.isArray(data)
      ? data
          .map(row => mapLibraryEntry(row as unknown as LibraryRow, config))
          .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
      : [];

    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: AUTH_ERROR }, { status: 401 });
    }
    console.error(`${config.logPrefix} library fetch error:`, error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}

/**
 * Generic handler for PATCH /api/{category}/library
 * Updates a user's library entry
 *
 * @param req - Next.js Request object
 * @param config - Category configuration
 * @returns Response with updated entry
 */
export async function handleLibraryPatch(
  req: Request,
  config: MediaCategoryConfig,
): Promise<Response> {
  try {
    // Auth check
    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);

    // Parse request body
    const body = (await req.json()) as UpdateLibraryRequestBody;

    if (!body.mediaId) {
      return NextResponse.json({ error: MISSING_MEDIA_ID }, { status: 400 });
    }

    // Build update data
    const updateData: Database['public']['Tables']['user_media_entries']['Update'] = {};
    if (body.status !== undefined) {
      updateData.status = body.status;
    }
    if (body.is_favorite !== undefined) {
      updateData.is_favorite = body.is_favorite;
    }
    if (body.selected_platform !== undefined) {
      updateData.selected_platform = body.selected_platform;
    }
    if (body.priority !== undefined) {
      updateData.priority = body.priority;
    }
    if (body.score !== undefined) {
      updateData.score = body.score;
    }
    if (body.progress !== undefined) {
      updateData.progress = body.progress;
    }
    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: NO_UPDATES_PROVIDED }, { status: 400 });
    }

    const updatedAt = new Date().toISOString();
    updateData.updated_at = updatedAt;

    // Fetch existing entry for activity comparison
    const { data: existingEntry } = await supabase
      .from('user_media_entries')
      .select('status,is_favorite')
      .eq('user_id', session.user.id)
      .eq('media_id', body.mediaId)
      .maybeSingle();

    // Upsert entry
    const { data, error } = await supabase
      .from('user_media_entries')
      .upsert(
        {
          user_id: session.user.id,
          media_id: body.mediaId,
          status: body.status ?? (existingEntry?.status as string) ?? 'planned',
          is_favorite: updateData.is_favorite,
          selected_platform: updateData.selected_platform,
          priority: updateData.priority,
          score: updateData.score,
          progress: updateData.progress,
          notes: updateData.notes,
          updated_at: updatedAt,
        },
        { onConflict: 'user_id,media_id' },
      )
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    // Fetch user profile and media info for activity logging
    const profileData = await getUserBasicInfo(supabase, session.user.id);

    const { data: mediaRow } = await supabase
      .from('media_items')
      .select(config.titlePriority.join(',') + ',category')
      .eq('id', body.mediaId)
      .maybeSingle();

    const mediaTitle = mediaRow
      ? resolveTitle(mediaRow as unknown as Record<string, unknown>, config.titlePriority)
      : UNTITLED_FALLBACK;
    const mediaCategory =
      ((mediaRow as unknown as Record<string, unknown>)?.category as string) ??
      config.defaultCategory;

    const activityPayload = {
      category: mediaCategory,
      title: mediaTitle,
      mediaId: body.mediaId,
      username: (profileData as UserProfile)?.username,
      display_name: (profileData as UserProfile)?.display_name,
      avatar_url: (profileData as UserProfile)?.avatar_url,
    };

    // Log status change activity
    if (
      body.status !== undefined &&
      body.status !== (existingEntry?.status as string | undefined)
    ) {
      await insertActivity(supabase, session.user.id, 'media_status', {
        ...activityPayload,
        status: body.status,
      });
    }

    // Log favorite change activity
    if (
      body.is_favorite !== undefined &&
      body.is_favorite !== (existingEntry?.is_favorite as boolean | undefined)
    ) {
      await insertActivity(supabase, session.user.id, 'media_favorite', {
        ...activityPayload,
        favoriteAction: body.is_favorite ? 'added' : 'removed',
      });
    }

    return NextResponse.json({ entry: data });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: AUTH_ERROR }, { status: 401 });
    }
    console.error(`${config.logPrefix} library update error:`, error);
    return NextResponse.json({ error: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
}

/**
 * Generic handler for DELETE /api/{category}/library
 * Removes a user's library entry
 *
 * @param req - Next.js Request object
 * @param config - Category configuration
 * @returns Response with success status
 */
export async function handleLibraryDelete(
  req: Request,
  config: MediaCategoryConfig,
): Promise<Response> {
  try {
    // Auth check
    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);

    // Parse request body
    const body = (await req.json()) as { mediaId?: number };
    if (!body.mediaId) {
      return NextResponse.json({ error: MISSING_MEDIA_ID }, { status: 400 });
    }

    // Delete entry
    const { error } = await supabase
      .from('user_media_entries')
      .delete()
      .eq('user_id', session.user.id)
      .eq('media_id', body.mediaId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: AUTH_ERROR }, { status: 401 });
    }
    console.error(`${config.logPrefix} library delete error:`, error);
    return NextResponse.json({ error: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
}
