import { withApiRoute } from '@/lib/observability/withApiRoute';

﻿import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { isMediaCategory, type MediaStatus } from '@/app/components/backlog/types';
import type { MediaEntryState } from '@/lib/media/types';

async function GETHandler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const mediaIdRaw = searchParams.get('mediaId');

    if (!category || !mediaIdRaw || !isMediaCategory(category)) {
      return NextResponse.json({ error: 'Invalid category or mediaId' }, { status: 400 });
    }

    const mediaId = Number(mediaIdRaw);
    if (!Number.isFinite(mediaId)) {
      return NextResponse.json({ error: 'Invalid mediaId' }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);

    const { data, error } = await supabase
      .from('user_media_entries')
      .select(
        'id,media_id,status,is_favorite,score,progress,notes,created_at,updated_at,media_items!inner(category)',
      )
      .eq('user_id', session.user.id)
      .eq('media_id', mediaId)
      .eq('media_items.category', category)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json({ entry: null });
    }

    const status = (data.status as MediaStatus) ?? 'planned';
    const entry: MediaEntryState = {
      entryId: data.id,
      mediaId: data.media_id,
      status,
      favorite: data.is_favorite ?? false,
      rating: data.score ?? null,
      progress: data.progress ?? null,
      notes: data.notes ?? null,
      startedAt: data.created_at ?? null,
      completedAt: data.updated_at ?? null,
    };

    return NextResponse.json({ entry });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Media entry fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withApiRoute(GETHandler);
