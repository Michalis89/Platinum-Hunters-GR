import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getCampaignRole, requireCampaignDm, requireCampaignMember } from '@/lib/dnd/access';
import { deleteSession, getSession, updateSession } from '@/lib/dnd/queries/sessions';

const paramsSchema = z.object({
  id: z.string().uuid(),
  sid: z.string().uuid(),
});

const updateSessionSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    session_date: z.string().date().optional().nullable(),
    status: z.enum(['planned', 'played', 'cancelled']).optional(),
    agenda: z.string().max(5000).optional().nullable(),
    recap: z.string().max(10000).optional().nullable(),
    dm_notes: z.string().max(10000).optional().nullable(),
  })
  .refine(
    data =>
      data.title !== undefined ||
      data.session_date !== undefined ||
      data.status !== undefined ||
      data.agenda !== undefined ||
      data.recap !== undefined ||
      data.dm_notes !== undefined,
    { message: 'At least one field must be provided' },
  );

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; sid: string }> },
) {
  const resolvedParams = await params;
  const parsedParams = paramsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid campaign or session id' }, { status: 400 });
  }

  const { id: campaignId, sid: sessionId } = parsedParams.data;
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
    const isDm = role === 'dm' || role === 'co_dm';
    const item = await getSession(supabase, campaignId, sessionId, isDm);

    if (!item) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ data: item });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch session';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; sid: string }> },
) {
  const resolvedParams = await params;
  const parsedParams = paramsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid campaign or session id' }, { status: 400 });
  }

  const { id: campaignId, sid: sessionId } = parsedParams.data;
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

  const parsedBody = updateSessionSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Invalid session payload' }, { status: 400 });
  }

  try {
    await requireCampaignDm(supabase, campaignId, session.user.id);
    const updated = await updateSession(supabase, campaignId, sessionId, parsedBody.data);
    return NextResponse.json({ data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update session';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message.includes('no rows') || message.includes('0 rows')) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; sid: string }> },
) {
  const resolvedParams = await params;
  const parsedParams = paramsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid campaign or session id' }, { status: 400 });
  }

  const { id: campaignId, sid: sessionId } = parsedParams.data;
  const supabase = await createRouteHandlerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await requireCampaignDm(supabase, campaignId, session.user.id);
    await deleteSession(supabase, campaignId, sessionId);
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete session';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
