import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getCampaignRole, requireCampaignDm, requireCampaignMember } from '@/lib/dnd/access';
import { deleteNpc, getNpc, updateNpc } from '@/lib/dnd/queries/npcs';

const paramsSchema = z.object({
  id: z.string().uuid(),
  nid: z.string().uuid(),
});

const updateNpcSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    role: z.string().max(50).optional().nullable(),
    status: z.enum(['alive', 'dead', 'unknown']).optional(),
    description: z.string().max(5000).optional().nullable(),
    tags: z.array(z.string()).optional(),
    public_notes: z.string().max(5000).optional().nullable(),
    secret_notes: z.string().max(5000).optional().nullable(),
    published: z.boolean().optional(),
  })
  .refine(
    data =>
      data.name !== undefined ||
      data.role !== undefined ||
      data.status !== undefined ||
      data.description !== undefined ||
      data.tags !== undefined ||
      data.public_notes !== undefined ||
      data.secret_notes !== undefined ||
      data.published !== undefined,
    { message: 'At least one field must be provided' },
  );

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; nid: string }> },
) {
  const resolvedParams = await params;
  const parsedParams = paramsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid campaign or NPC id' }, { status: 400 });
  }

  const { id: campaignId, nid: npcId } = parsedParams.data;
  const supabase = await createRouteHandlerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await requireCampaignMember(supabase, campaignId, session.user.id);
    const role = await getCampaignRole(supabase, campaignId, session.user.id);
    const item = await getNpc(supabase, campaignId, npcId, role === 'dm' || role === 'co_dm');

    if (!item) {
      return NextResponse.json({ error: 'NPC not found' }, { status: 404 });
    }

    return NextResponse.json({ data: item });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch NPC';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; nid: string }> },
) {
  const resolvedParams = await params;
  const parsedParams = paramsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid campaign or NPC id' }, { status: 400 });
  }

  const { id: campaignId, nid: npcId } = parsedParams.data;
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

  const parsedBody = updateNpcSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Invalid NPC payload' }, { status: 400 });
  }

  try {
    await requireCampaignDm(supabase, campaignId, session.user.id);
    const updated = await updateNpc(supabase, campaignId, npcId, parsedBody.data);
    return NextResponse.json({ data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update NPC';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message.includes('no rows') || message.includes('0 rows')) {
      return NextResponse.json({ error: 'NPC not found' }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; nid: string }> },
) {
  const resolvedParams = await params;
  const parsedParams = paramsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid campaign or NPC id' }, { status: 400 });
  }

  const { id: campaignId, nid: npcId } = parsedParams.data;
  const supabase = await createRouteHandlerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await requireCampaignDm(supabase, campaignId, session.user.id);
    await deleteNpc(supabase, campaignId, npcId);
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete NPC';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
