import type { SupabaseClient } from '@supabase/supabase-js';
import type { CampaignMemberRole } from '@/lib/dnd/types';

export async function getCampaignRole(
  supabase: SupabaseClient,
  campaignId: string,
  userId: string,
): Promise<CampaignMemberRole | null> {
  const { data, error } = await supabase
    .from('campaign_members')
    .select('role')
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)
    .maybeSingle<{ role: CampaignMemberRole }>();

  if (error) {
    throw new Error(`Failed to fetch campaign role: ${error.message}`);
  }

  return data?.role ?? null;
}

export async function requireCampaignDm(
  supabase: SupabaseClient,
  campaignId: string,
  userId: string,
): Promise<void> {
  const role = await getCampaignRole(supabase, campaignId, userId);

  if (role !== 'dm' && role !== 'co_dm') {
    throw new Error('Forbidden: DM access required');
  }
}

export async function requireCampaignMember(
  supabase: SupabaseClient,
  campaignId: string,
  userId: string,
): Promise<void> {
  const role = await getCampaignRole(supabase, campaignId, userId);

  if (!role) {
    throw new Error('Forbidden: Campaign membership required');
  }
}
