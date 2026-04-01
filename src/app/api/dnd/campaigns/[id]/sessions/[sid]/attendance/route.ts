import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { requireCampaignDm, requireCampaignMember } from '@/lib/dnd/access';
import { listSessionAttendance, replaceSessionAttendance } from '@/lib/dnd/queries/sessions';

const paramsSchema = z.object({
  id: z.string().uuid(),
  sid: z.string().uuid(),
});

const attendanceSchema = z.object({
  user_ids: z.array(z.string().uuid()),
});

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
    const attendance = await listSessionAttendance(supabase, campaignId, sessionId);
    return NextResponse.json({ data: { user_ids: attendance } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list session attendance';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
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

  const parsedBody = attendanceSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Invalid attendance payload' }, { status: 400 });
  }

  try {
    await requireCampaignDm(supabase, campaignId, session.user.id);
    await replaceSessionAttendance(supabase, campaignId, sessionId, parsedBody.data.user_ids);
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update session attendance';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message.includes('Session not found')) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message.includes('Invalid attendance user ids')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
