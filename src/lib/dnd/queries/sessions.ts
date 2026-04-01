import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CampaignSession,
  CampaignSessionPublic,
  CreateSessionInput,
} from '@/lib/dnd/types';

const DM_SESSION_FIELDS =
  'id,campaign_id,title,session_date,status,agenda,recap,dm_notes,recap_published,created_by,created_at,updated_at';
const PLAYER_SESSION_FIELDS =
  'id,campaign_id,title,session_date,status,agenda,recap,recap_published,created_by,created_at,updated_at';

export async function listSessions(
  supabase: SupabaseClient,
  campaignId: string,
  isDm: boolean,
): Promise<CampaignSession[] | CampaignSessionPublic[]> {
  const fields = isDm ? DM_SESSION_FIELDS : PLAYER_SESSION_FIELDS;

  let query = supabase.from('campaign_sessions').select(fields).eq('campaign_id', campaignId);
  query = query.is('deleted_at', null);

  if (!isDm) {
    query = query.eq('recap_published', true);
  }

  const { data, error } = await query
    .order('session_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list sessions: ${error.message}`);
  }

  return (data ?? []) as unknown as CampaignSession[] | CampaignSessionPublic[];
}

export async function getSession(
  supabase: SupabaseClient,
  campaignId: string,
  sessionId: string,
  isDm: boolean,
): Promise<CampaignSession | CampaignSessionPublic | null> {
  const fields = isDm ? DM_SESSION_FIELDS : PLAYER_SESSION_FIELDS;

  let query = supabase
    .from('campaign_sessions')
    .select(fields)
    .eq('campaign_id', campaignId)
    .eq('id', sessionId)
    .is('deleted_at', null);

  if (!isDm) {
    query = query.eq('recap_published', true);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch session: ${error.message}`);
  }

  return (data as CampaignSession | CampaignSessionPublic | null) ?? null;
}

export async function createSession(
  supabase: SupabaseClient,
  campaignId: string,
  input: CreateSessionInput,
  createdBy: string,
): Promise<CampaignSession> {
  const { data, error } = await supabase
    .from('campaign_sessions')
    .insert({
      campaign_id: campaignId,
      title: input.title,
      session_date: input.session_date,
      status: input.status,
      agenda: input.agenda,
      recap: input.recap,
      dm_notes: input.dm_notes,
      created_by: createdBy,
    })
    .select(DM_SESSION_FIELDS)
    .single();

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }

  return data as CampaignSession;
}

export async function updateSession(
  supabase: SupabaseClient,
  campaignId: string,
  sessionId: string,
  input: Partial<CreateSessionInput>,
): Promise<CampaignSession> {
  const { data, error } = await supabase
    .from('campaign_sessions')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('campaign_id', campaignId)
    .eq('id', sessionId)
    .is('deleted_at', null)
    .select(DM_SESSION_FIELDS)
    .single();

  if (error) {
    throw new Error(`Failed to update session: ${error.message}`);
  }

  return data as CampaignSession;
}

export async function deleteSession(
  supabase: SupabaseClient,
  campaignId: string,
  sessionId: string,
): Promise<void> {
  const { error } = await supabase
    .from('campaign_sessions')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('campaign_id', campaignId)
    .eq('id', sessionId)
    .is('deleted_at', null);

  if (error) {
    throw new Error(`Failed to delete session: ${error.message}`);
  }
}

export async function toggleRecapPublished(
  supabase: SupabaseClient,
  campaignId: string,
  sessionId: string,
  published: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('campaign_sessions')
    .update({
      recap_published: published,
      updated_at: new Date().toISOString(),
    })
    .eq('campaign_id', campaignId)
    .eq('id', sessionId)
    .is('deleted_at', null);

  if (error) {
    throw new Error(`Failed to toggle recap published state: ${error.message}`);
  }
}

export async function listSessionAttendance(
  supabase: SupabaseClient,
  campaignId: string,
  sessionId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from('campaign_session_attendance')
    .select('user_id, campaign_sessions!inner(campaign_id)')
    .eq('session_id', sessionId)
    .eq('campaign_sessions.campaign_id', campaignId);

  if (error) {
    throw new Error(`Failed to list session attendance: ${error.message}`);
  }

  return (data ?? []).map(row => row.user_id as string);
}

export async function replaceSessionAttendance(
  supabase: SupabaseClient,
  campaignId: string,
  sessionId: string,
  userIds: string[],
): Promise<void> {
  const uniqueUserIds = [...new Set(userIds)];

  const { data: session, error: sessionError } = await supabase
    .from('campaign_sessions')
    .select('id')
    .eq('campaign_id', campaignId)
    .eq('id', sessionId)
    .is('deleted_at', null)
    .maybeSingle<{ id: string }>();

  if (sessionError) {
    throw new Error(`Failed to verify session: ${sessionError.message}`);
  }

  if (!session) {
    throw new Error('Session not found');
  }

  if (uniqueUserIds.length > 0) {
    const { data: members, error: membersError } = await supabase
      .from('campaign_members')
      .select('user_id')
      .eq('campaign_id', campaignId)
      .in('user_id', uniqueUserIds);

    if (membersError) {
      throw new Error(`Failed to validate attendance members: ${membersError.message}`);
    }

    const memberSet = new Set((members ?? []).map(member => member.user_id as string));
    const invalidIds = uniqueUserIds.filter(userId => !memberSet.has(userId));

    if (invalidIds.length > 0) {
      throw new Error('Invalid attendance user ids: all users must be campaign members');
    }
  }

  const { error: deleteError } = await supabase
    .from('campaign_session_attendance')
    .delete()
    .eq('session_id', sessionId);

  if (deleteError) {
    throw new Error(`Failed to clear session attendance: ${deleteError.message}`);
  }

  if (uniqueUserIds.length === 0) {
    return;
  }

  const rows = uniqueUserIds.map(userId => ({
    session_id: sessionId,
    user_id: userId,
  }));

  const { error: insertError } = await supabase.from('campaign_session_attendance').insert(rows);

  if (insertError) {
    throw new Error(`Failed to update session attendance: ${insertError.message}`);
  }
}
