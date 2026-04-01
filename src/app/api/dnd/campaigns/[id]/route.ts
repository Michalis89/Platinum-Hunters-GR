import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { requireCampaignDm, requireCampaignMember } from '@/lib/dnd/access';
import { deleteCampaign, getCampaign, updateCampaign } from '@/lib/dnd/queries/campaigns';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const updateCampaignSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    system: z.string().max(50).nullable().optional(),
    description: z.string().max(500).nullable().optional(),
  })
  .refine(
    data => data.name !== undefined || data.system !== undefined || data.description !== undefined,
    { message: 'At least one field must be provided' },
  );

function parseCampaignId(params: { id: string }): string | null {
  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) {
    return null;
  }

  return parsed.data.id;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const campaignId = parseCampaignId(resolvedParams);
  if (!campaignId) {
    return NextResponse.json({ error: 'Invalid campaign id' }, { status: 400 });
  }

  const supabase = await createRouteHandlerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await requireCampaignMember(supabase, campaignId, session.user.id);
    const campaign = await getCampaign(supabase, campaignId);

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ data: campaign });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch campaign';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolvedParams = await params;
  const campaignId = parseCampaignId(resolvedParams);
  if (!campaignId) {
    return NextResponse.json({ error: 'Invalid campaign id' }, { status: 400 });
  }

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

  const parsed = updateCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid campaign payload' }, { status: 400 });
  }

  try {
    await requireCampaignDm(supabase, campaignId, session.user.id);
    const campaign = await updateCampaign(supabase, campaignId, parsed.data);
    return NextResponse.json({ data: campaign });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update campaign';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolvedParams = await params;
  const campaignId = parseCampaignId(resolvedParams);
  if (!campaignId) {
    return NextResponse.json({ error: 'Invalid campaign id' }, { status: 400 });
  }

  const supabase = await createRouteHandlerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await requireCampaignDm(supabase, campaignId, session.user.id);
    await deleteCampaign(supabase, campaignId);
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete campaign';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
