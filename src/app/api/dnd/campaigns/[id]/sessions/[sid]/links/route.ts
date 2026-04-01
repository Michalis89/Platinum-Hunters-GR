import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getCampaignRole, requireCampaignDm, requireCampaignMember } from '@/lib/dnd/access';
import { getSession } from '@/lib/dnd/queries/sessions';

const paramsSchema = z.object({
  id: z.string().uuid(),
  sid: z.string().uuid(),
});

const linkSchema = z.object({
  entity_type: z.enum(['npc', 'location', 'quest']),
  entity_id: z.string().uuid(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; sid: string }> },
) {
  const resolvedParams = await params;
  const parsedParams = paramsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid campaign or session id' }, { status: 400 });
  }

  const { id: campaignId, sid: sessionId } = parsedParams.data;
  const supabase = await createRouteHandlerClient();
  const db = supabase as unknown as SupabaseClient;
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

    const accessibleSession = await getSession(supabase, campaignId, sessionId, isDm);
    if (!accessibleSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const { data, error } = await db
      .from('campaign_entity_links')
      .select('id,campaign_id,session_id,entity_type,entity_id,created_at')
      .eq('campaign_id', campaignId)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to list entity links: ${error.message}`);
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list entity links';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
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
  const db = supabase as unknown as SupabaseClient;
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

  const parsedBody = linkSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Invalid entity link payload' }, { status: 400 });
  }

  try {
    await requireCampaignDm(supabase, campaignId, session.user.id);

    const { data, error } = await db
      .from('campaign_entity_links')
      .insert({
        campaign_id: campaignId,
        session_id: sessionId,
        entity_type: parsedBody.data.entity_type,
        entity_id: parsedBody.data.entity_id,
      })
      .select('id,campaign_id,session_id,entity_type,entity_id,created_at')
      .single();

    if (error) {
      throw new Error(`Failed to add entity link: ${error.message}`);
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add entity link';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message.includes('duplicate key')) {
      return NextResponse.json({ error: 'Entity link already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
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
  const db = supabase as unknown as SupabaseClient;
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

  const parsedBody = linkSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Invalid entity link payload' }, { status: 400 });
  }

  try {
    await requireCampaignDm(supabase, campaignId, session.user.id);

    const { error } = await db
      .from('campaign_entity_links')
      .delete()
      .eq('campaign_id', campaignId)
      .eq('session_id', sessionId)
      .eq('entity_type', parsedBody.data.entity_type)
      .eq('entity_id', parsedBody.data.entity_id);

    if (error) {
      throw new Error(`Failed to remove entity link: ${error.message}`);
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove entity link';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
