import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getCampaignRole, requireCampaignDm, requireCampaignMember } from '@/lib/dnd/access';
import { createSession, listSessions } from '@/lib/dnd/queries/sessions';
import type { CreateSessionInput } from '@/lib/dnd/types';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const createSessionSchema = z.object({
  title: z.string().min(1).max(200),
  session_date: z.string().date().optional().nullable(),
  status: z.enum(['planned', 'played', 'cancelled']).default('planned'),
  agenda: z.string().max(5000).optional().nullable(),
  recap: z.string().max(10000).optional().nullable(),
  dm_notes: z.string().max(10000).optional().nullable(),
});

export async function GET(
  _request: Request,
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

  try {
    await requireCampaignMember(supabase, campaignId, session.user.id);
    const role = await getCampaignRole(supabase, campaignId, session.user.id);
    const sessions = await listSessions(supabase, campaignId, role === 'dm' || role === 'co_dm');
    return NextResponse.json({ data: sessions });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list sessions';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
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

  const parsedBody = createSessionSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Invalid session payload' }, { status: 400 });
  }

  try {
    await requireCampaignDm(supabase, campaignId, session.user.id);
    const payload: CreateSessionInput = {
      title: parsedBody.data.title,
      session_date: parsedBody.data.session_date ?? null,
      status: parsedBody.data.status,
      agenda: parsedBody.data.agenda ?? null,
      recap: parsedBody.data.recap ?? null,
      dm_notes: parsedBody.data.dm_notes ?? null,
    };
    const created = await createSession(supabase, campaignId, payload, session.user.id);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create session';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
