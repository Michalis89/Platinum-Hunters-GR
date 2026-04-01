import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getCampaignRole, requireCampaignDm, requireCampaignMember } from '@/lib/dnd/access';
import { createQuest, listQuests } from '@/lib/dnd/queries/quests';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const createQuestSchema = z.object({
  title: z.string().min(1).max(200),
  status: z.enum(['active', 'completed', 'failed', 'on_hold']).default('active'),
  summary: z.string().max(5000).optional().nullable(),
  public_notes: z.string().max(5000).optional().nullable(),
  secret_notes: z.string().max(5000).optional().nullable(),
  published: z.boolean().default(false),
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
    const isDm = role === 'dm' || role === 'co_dm';
    const items = await listQuests(supabase, campaignId, isDm);
    return NextResponse.json({ data: items });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list quests';
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

  const parsedBody = createQuestSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Invalid quest payload' }, { status: 400 });
  }

  try {
    await requireCampaignDm(supabase, campaignId, session.user.id);
    const created = await createQuest(
      supabase,
      campaignId,
      {
        title: parsedBody.data.title,
        status: parsedBody.data.status,
        summary: parsedBody.data.summary ?? null,
        public_notes: parsedBody.data.public_notes ?? null,
        secret_notes: parsedBody.data.secret_notes ?? null,
        published: parsedBody.data.published,
      },
      session.user.id,
    );
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create quest';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
