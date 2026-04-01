import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getCampaignRole, requireCampaignDm, requireCampaignMember } from '@/lib/dnd/access';
import { deleteQuest, getQuest, updateQuest } from '@/lib/dnd/queries/quests';

const paramsSchema = z.object({
  id: z.string().uuid(),
  qid: z.string().uuid(),
});

const updateQuestSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    status: z.enum(['active', 'completed', 'failed', 'on_hold']).optional(),
    summary: z.string().max(5000).optional().nullable(),
    public_notes: z.string().max(5000).optional().nullable(),
    secret_notes: z.string().max(5000).optional().nullable(),
    published: z.boolean().optional(),
  })
  .refine(
    data =>
      data.title !== undefined ||
      data.status !== undefined ||
      data.summary !== undefined ||
      data.public_notes !== undefined ||
      data.secret_notes !== undefined ||
      data.published !== undefined,
    { message: 'At least one field must be provided' },
  );

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; qid: string }> },
) {
  const resolvedParams = await params;
  const parsedParams = paramsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid campaign or quest id' }, { status: 400 });
  }

  const { id: campaignId, qid: questId } = parsedParams.data;
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
    const item = await getQuest(supabase, campaignId, questId, role === 'dm' || role === 'co_dm');

    if (!item) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }

    return NextResponse.json({ data: item });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch quest';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; qid: string }> },
) {
  const resolvedParams = await params;
  const parsedParams = paramsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid campaign or quest id' }, { status: 400 });
  }

  const { id: campaignId, qid: questId } = parsedParams.data;
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

  const parsedBody = updateQuestSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Invalid quest payload' }, { status: 400 });
  }

  try {
    await requireCampaignDm(supabase, campaignId, session.user.id);
    const updated = await updateQuest(supabase, campaignId, questId, parsedBody.data);
    return NextResponse.json({ data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update quest';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message.includes('no rows') || message.includes('0 rows')) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; qid: string }> },
) {
  const resolvedParams = await params;
  const parsedParams = paramsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid campaign or quest id' }, { status: 400 });
  }

  const { id: campaignId, qid: questId } = parsedParams.data;
  const supabase = await createRouteHandlerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await requireCampaignDm(supabase, campaignId, session.user.id);
    await deleteQuest(supabase, campaignId, questId);
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete quest';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
