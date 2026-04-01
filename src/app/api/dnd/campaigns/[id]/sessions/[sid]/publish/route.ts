import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { requireCampaignDm } from '@/lib/dnd/access';
import { toggleRecapPublished } from '@/lib/dnd/queries/sessions';

const paramsSchema = z.object({
  id: z.string().uuid(),
  sid: z.string().uuid(),
});

const publishSchema = z.object({
  published: z.boolean(),
});

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

  const parsedBody = publishSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Invalid publish payload' }, { status: 400 });
  }

  try {
    await requireCampaignDm(supabase, campaignId, session.user.id);
    await toggleRecapPublished(supabase, campaignId, sessionId, parsedBody.data.published);
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update published state';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
