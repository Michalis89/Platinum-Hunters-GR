import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const joinSchema = z.object({
  token: z.string().min(1),
});

type CampaignByToken = {
  id: string;
  dm_id: string;
  name: string;
  system: string | null;
  description: string | null;
  invite_token: string;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolvedParams = await params;
  const parsedParams = paramsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
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

  const parsedBody = joinSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Invalid join payload' }, { status: 400 });
  }

  try {
    const admin = createSupabaseAdminClient() as unknown as SupabaseClient;
    const { data: campaign, error: campaignError } = await admin
      .from('campaigns')
      .select('*')
      .eq('invite_token', parsedBody.data.token)
      .is('deleted_at', null)
      .maybeSingle<CampaignByToken>();

    if (campaignError) {
      throw new Error(`Failed to resolve invite token: ${campaignError.message}`);
    }

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found for this invite token' }, { status: 404 });
    }

    if (campaign.id !== parsedParams.data.id) {
      return NextResponse.json({ error: 'Token does not belong to this campaign' }, { status: 400 });
    }

    const { data: existingMembership, error: membershipLookupError } = await admin
      .from('campaign_members')
      .select('user_id')
      .eq('campaign_id', campaign.id)
      .eq('user_id', session.user.id)
      .maybeSingle<{ user_id: string }>();

    if (membershipLookupError) {
      throw new Error(`Failed to verify membership: ${membershipLookupError.message}`);
    }

    if (!existingMembership) {
      const { error: memberError } = await admin.from('campaign_members').insert({
        campaign_id: campaign.id,
        user_id: session.user.id,
        role: 'player',
      });

      if (memberError) {
        throw new Error(`Failed to join campaign membership: ${memberError.message}`);
      }
    }

    return NextResponse.json({ data: campaign });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to join campaign';
    if (message.includes('not found')) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
