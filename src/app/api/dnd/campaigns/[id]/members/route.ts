import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireCampaignDm } from '@/lib/dnd/access';
import { listCampaignMembers, removeCampaignMember } from '@/lib/dnd/queries/campaigns';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const removeMemberSchema = z.object({
  user_id: z.string().uuid(),
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
    await requireCampaignDm(supabase, campaignId, session.user.id);
    const members = await listCampaignMembers(supabase, campaignId);

    const userIds = [...new Set(members.map(member => member.user_id))];
    const admin = createSupabaseAdminClient() as unknown as SupabaseClient;
    const { data: users, error: usersError } = await admin
      .from('users')
      .select('id,username,display_name,avatar_url')
      .in('id', userIds);

    if (usersError) {
      throw new Error(`Failed to load member profiles: ${usersError.message}`);
    }

    const userMap = new Map(
      (users ?? []).map(user => [
        user.id,
        {
          username: user.username,
          display_name: user.display_name,
          avatar_url: user.avatar_url,
        },
      ]),
    );

    return NextResponse.json({
      data: members.map(member => ({
        ...member,
        user: userMap.get(member.user_id) ?? null,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list campaign members';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
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

  const parsedBody = removeMemberSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Invalid remove-member payload' }, { status: 400 });
  }

  if (parsedBody.data.user_id === session.user.id) {
    return NextResponse.json({ error: 'Cannot remove yourself from campaign' }, { status: 400 });
  }

  try {
    await requireCampaignDm(supabase, campaignId, session.user.id);
    await removeCampaignMember(supabase, campaignId, parsedBody.data.user_id);
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove campaign member';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
