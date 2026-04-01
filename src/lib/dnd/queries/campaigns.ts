import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Campaign,
  CampaignMember,
  CampaignMemberRole,
  CampaignWithRole,
  CreateCampaignInput,
} from '@/lib/dnd/types';

type CampaignMemberWithCampaign = {
  role: CampaignMemberRole;
  campaigns: (Campaign & { deleted_at?: string | null }) | null;
};

function generateInviteToken(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

export async function listCampaignsForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<CampaignWithRole[]> {
  const { data, error } = await supabase
    .from('campaign_members')
    .select('role, campaigns(*)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list campaigns for user: ${error.message}`);
  }

  const rows = (data ?? []) as unknown as CampaignMemberWithCampaign[];

  return rows
    .filter(row => row.campaigns !== null && !row.campaigns.deleted_at)
    .map(row => ({
      ...(row.campaigns as Campaign),
      member_role: row.role === 'co_dm' ? 'dm' : row.role,
    }));
}

export async function getCampaign(
  supabase: SupabaseClient,
  campaignId: string,
  includeDeleted = false,
): Promise<Campaign | null> {
  let query = supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId);

  if (!includeDeleted) {
    query = query.is('deleted_at', null);
  }

  const { data, error } = await query.maybeSingle<Campaign>();

  if (error) {
    throw new Error(`Failed to fetch campaign: ${error.message}`);
  }

  return data;
}

export async function createCampaign(
  supabase: SupabaseClient,
  input: CreateCampaignInput,
  dmId: string,
): Promise<Campaign> {
  const token = generateInviteToken();

  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      dm_id: dmId,
      name: input.name,
      system: input.system,
      description: input.description,
      invite_token: token,
    })
    .select('*')
    .single<Campaign>();

  if (error) {
    throw new Error(`Failed to create campaign: ${error.message}`);
  }

  const { error: memberError } = await supabase.from('campaign_members').insert({
    campaign_id: data.id,
    user_id: dmId,
    role: 'dm',
  });

  if (memberError) {
    throw new Error(`Failed to add DM as campaign member: ${memberError.message}`);
  }

  return data;
}

export async function updateCampaign(
  supabase: SupabaseClient,
  campaignId: string,
  input: Partial<CreateCampaignInput>,
): Promise<Campaign> {
  const payload = {
    ...input,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('campaigns')
    .update(payload)
    .eq('id', campaignId)
    .is('deleted_at', null)
    .select('*')
    .single<Campaign>();

  if (error) {
    throw new Error(`Failed to update campaign: ${error.message}`);
  }

  return data;
}

export async function deleteCampaign(supabase: SupabaseClient, campaignId: string): Promise<void> {
  const { error } = await supabase
    .from('campaigns')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', campaignId)
    .is('deleted_at', null);

  if (error) {
    throw new Error(`Failed to delete campaign: ${error.message}`);
  }
}

export async function restoreCampaign(supabase: SupabaseClient, campaignId: string): Promise<void> {
  const { error } = await supabase
    .from('campaigns')
    .update({
      deleted_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', campaignId);

  if (error) {
    throw new Error(`Failed to restore campaign: ${error.message}`);
  }
}

export async function regenerateInviteToken(
  supabase: SupabaseClient,
  campaignId: string,
): Promise<string> {
  const newToken = generateInviteToken();

  const { data, error } = await supabase
    .from('campaigns')
    .update({
      invite_token: newToken,
      updated_at: new Date().toISOString(),
    })
    .eq('id', campaignId)
    .select('invite_token')
    .single<{ invite_token: string }>();

  if (error) {
    throw new Error(`Failed to regenerate invite token: ${error.message}`);
  }

  return data.invite_token;
}

export async function joinCampaignByToken(
  supabase: SupabaseClient,
  token: string,
  userId: string,
): Promise<Campaign> {
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('invite_token', token)
    .is('deleted_at', null)
    .maybeSingle<Campaign>();

  if (campaignError) {
    throw new Error(`Failed to join campaign by token: ${campaignError.message}`);
  }

  if (!campaign) {
    throw new Error('Campaign not found for this invite token');
  }

  const { data: existing, error: existingError } = await supabase
    .from('campaign_members')
    .select('user_id')
    .eq('campaign_id', campaign.id)
    .eq('user_id', userId)
    .maybeSingle<{ user_id: string }>();

  if (existingError) {
    throw new Error(`Failed to check existing membership: ${existingError.message}`);
  }

  if (!existing) {
    const { error: memberError } = await supabase.from('campaign_members').insert({
      campaign_id: campaign.id,
      user_id: userId,
      role: 'player',
    });

    if (memberError) {
      throw new Error(`Failed to join campaign membership: ${memberError.message}`);
    }
  }

  return campaign;
}

export async function listCampaignMembers(
  supabase: SupabaseClient,
  campaignId: string,
): Promise<CampaignMember[]> {
  const { data, error } = await supabase
    .from('campaign_members')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('joined_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to list campaign members: ${error.message}`);
  }

  return (data ?? []) as CampaignMember[];
}

export async function removeCampaignMember(
  supabase: SupabaseClient,
  campaignId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('campaign_members')
    .delete()
    .eq('campaign_id', campaignId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to remove campaign member: ${error.message}`);
  }
}
