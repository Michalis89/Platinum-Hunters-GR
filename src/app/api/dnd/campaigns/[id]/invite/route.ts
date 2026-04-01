import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { requireCampaignDm } from '@/lib/dnd/access';
import { regenerateInviteToken } from '@/lib/dnd/queries/campaigns';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolvedParams = await params;
  const parsed = paramsSchema.safeParse(resolvedParams);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid campaign id' }, { status: 400 });
  }

  const campaignId = parsed.data.id;
  const supabase = await createRouteHandlerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await requireCampaignDm(supabase, campaignId, session.user.id);
    const token = await regenerateInviteToken(supabase, campaignId);

    const origin = new URL(request.url).origin;
    const inviteUrl = `${origin}/dnd/join/${token}`;

    return NextResponse.json({ data: { token, invite_url: inviteUrl } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to regenerate invite token';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
