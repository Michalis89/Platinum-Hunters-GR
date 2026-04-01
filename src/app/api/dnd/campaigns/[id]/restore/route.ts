import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { restoreCampaign } from '@/lib/dnd/queries/campaigns';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const RESTORE_WINDOW_DAYS = 30;

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const db = supabase as unknown as SupabaseClient;
    const { data: campaign, error } = await db
      .from('campaigns')
      .select('id,dm_id,deleted_at')
      .eq('id', campaignId)
      .maybeSingle<{ id: string; dm_id: string; deleted_at: string | null }>();

    if (error) {
      throw new Error(`Failed to fetch campaign: ${error.message}`);
    }

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.dm_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden: DM access required' }, { status: 403 });
    }

    if (!campaign.deleted_at) {
      return NextResponse.json({ error: 'Campaign is not deleted' }, { status: 400 });
    }

    const deletedAtMs = Date.parse(campaign.deleted_at);
    if (!Number.isFinite(deletedAtMs)) {
      return NextResponse.json({ error: 'Invalid campaign delete timestamp' }, { status: 400 });
    }

    const maxRestoreAgeMs = RESTORE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    if (Date.now() - deletedAtMs > maxRestoreAgeMs) {
      return NextResponse.json({ error: 'Campaign restore window has expired' }, { status: 410 });
    }

    await restoreCampaign(supabase, campaignId);
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to restore campaign';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
