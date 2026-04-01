import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireCampaignDm } from '@/lib/dnd/access';
import { getTrashItems, permanentlyDeleteItem } from '@/lib/dnd/queries/trash';
import type { TrashEntityType } from '@/lib/dnd/types';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const deleteForeverSchema = z.object({
  entity_type: z.enum(['session', 'npc', 'location', 'quest', 'handout', 'asset']),
  entity_id: z.string().uuid(),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const parsedParams = paramsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid campaign id' }, { status: 400 });
  }

  const campaignId = parsedParams.data.id;
  const supabase = await createRouteHandlerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await requireCampaignDm(supabase, campaignId, session.user.id);
    const data = await getTrashItems(supabase, campaignId);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load trash';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolvedParams = await params;
  const parsedParams = paramsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid campaign id' }, { status: 400 });
  }

  const campaignId = parsedParams.data.id;
  const supabase = await createRouteHandlerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsedBody = deleteForeverSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Invalid delete payload' }, { status: 400 });
  }

  try {
    await requireCampaignDm(supabase, campaignId, session.user.id);

    const { entity_type, entity_id } = parsedBody.data as {
      entity_type: TrashEntityType;
      entity_id: string;
    };

    const deleted = await permanentlyDeleteItem(supabase, campaignId, entity_type, entity_id);
    if (entity_type === 'asset' && deleted.storagePath) {
      const admin = createSupabaseAdminClient() as unknown as SupabaseClient;
      const { error: storageError } = await admin.storage
        .from('campaign-assets')
        .remove([deleted.storagePath]);

      if (storageError) {
        return NextResponse.json(
          { error: `Failed to delete storage file: ${storageError.message}` },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to permanently delete item';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
