import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getCampaignRole, requireCampaignMember } from '@/lib/dnd/access';
import { getSheetById, updateDmNotes } from '@/lib/dnd/queries/characterSheet';

const paramsSchema = z.object({
  id: z.string().uuid(),
  sheetId: z.string().uuid(),
});

const bodySchema = z.object({
  dm_notes: z.string().max(10000).nullable(),
});

// PATCH: DM updates private notes on a character sheet
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; sheetId: string }> },
) {
  const resolvedParams = await params;
  const parsedParams = paramsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }

  const { id: campaignId, sheetId } = parsedParams.data;

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

  const parsedBody = bodySchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  try {
    await requireCampaignMember(supabase, campaignId, session.user.id);
    const role = await getCampaignRole(supabase, campaignId, session.user.id);
    const isDm = role === 'dm' || role === 'co_dm';

    if (!isDm) {
      return NextResponse.json({ error: 'Forbidden: DM access required' }, { status: 403 });
    }

    const sheet = await getSheetById(supabase, sheetId);
    if (!sheet || sheet.campaign_id !== campaignId) {
      return NextResponse.json({ error: 'Sheet not found' }, { status: 404 });
    }

    await updateDmNotes(supabase, sheetId, parsedBody.data.dm_notes);
    return NextResponse.json({ data: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update DM notes';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
