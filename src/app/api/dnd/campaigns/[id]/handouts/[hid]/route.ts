import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getCampaignRole, requireCampaignDm, requireCampaignMember } from '@/lib/dnd/access';
import { deleteHandout, getHandout, updateHandout } from '@/lib/dnd/queries/handouts';

const paramsSchema = z.object({
  id: z.string().uuid(),
  hid: z.string().uuid(),
});

const handoutSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().max(20000).optional().nullable(),
  published: z.boolean().default(false),
});

const updateHandoutSchema = handoutSchema.partial().refine(
  data => data.title !== undefined || data.content !== undefined || data.published !== undefined,
  { message: 'At least one field must be provided' },
);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; hid: string }> },
) {
  const resolvedParams = await params;
  const parsedParams = paramsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid campaign or handout id' }, { status: 400 });
  }

  const { id: campaignId, hid: handoutId } = parsedParams.data;
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
    const item = await getHandout(supabase, campaignId, handoutId, role === 'dm' || role === 'co_dm');

    if (!item) {
      return NextResponse.json({ error: 'Handout not found' }, { status: 404 });
    }

    return NextResponse.json({ data: item });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch handout';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; hid: string }> },
) {
  const resolvedParams = await params;
  const parsedParams = paramsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid campaign or handout id' }, { status: 400 });
  }

  const { id: campaignId, hid: handoutId } = parsedParams.data;
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

  const parsedBody = updateHandoutSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Invalid handout payload' }, { status: 400 });
  }

  try {
    await requireCampaignDm(supabase, campaignId, session.user.id);
    const updated = await updateHandout(supabase, campaignId, handoutId, {
      ...(parsedBody.data.title !== undefined ? { title: parsedBody.data.title } : {}),
      ...(parsedBody.data.content !== undefined ? { content: parsedBody.data.content ?? null } : {}),
      ...(parsedBody.data.published !== undefined ? { published: parsedBody.data.published } : {}),
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update handout';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message.includes('no rows') || message.includes('0 rows')) {
      return NextResponse.json({ error: 'Handout not found' }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; hid: string }> },
) {
  const resolvedParams = await params;
  const parsedParams = paramsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid campaign or handout id' }, { status: 400 });
  }

  const { id: campaignId, hid: handoutId } = parsedParams.data;
  const supabase = await createRouteHandlerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await requireCampaignDm(supabase, campaignId, session.user.id);
    await deleteHandout(supabase, campaignId, handoutId);
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete handout';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
