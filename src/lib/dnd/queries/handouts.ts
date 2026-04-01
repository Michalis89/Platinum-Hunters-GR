import type { SupabaseClient } from '@supabase/supabase-js';
import type { CampaignHandout, CreateHandoutInput } from '@/lib/dnd/types';

const HANDOUT_FIELDS = 'id,campaign_id,title,content,published,created_by,created_at,updated_at';

type HandoutInput = CreateHandoutInput;

export async function listHandouts(
  supabase: SupabaseClient,
  campaignId: string,
  isDm: boolean,
): Promise<CampaignHandout[]> {
  let query = supabase.from('campaign_handouts').select(HANDOUT_FIELDS).eq('campaign_id', campaignId);
  query = query.is('deleted_at', null);

  if (!isDm) {
    query = query.eq('published', true);
  }

  const { data, error } = await query.order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list handouts: ${error.message}`);
  }

  return (data ?? []) as unknown as CampaignHandout[];
}

export async function getHandout(
  supabase: SupabaseClient,
  campaignId: string,
  handoutId: string,
  isDm: boolean,
): Promise<CampaignHandout | null> {
  let query = supabase
    .from('campaign_handouts')
    .select(HANDOUT_FIELDS)
    .eq('campaign_id', campaignId)
    .eq('id', handoutId)
    .is('deleted_at', null);

  if (!isDm) {
    query = query.eq('published', true);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch handout: ${error.message}`);
  }

  return (data as unknown as CampaignHandout | null) ?? null;
}

export async function createHandout(
  supabase: SupabaseClient,
  campaignId: string,
  input: HandoutInput,
  createdBy: string,
): Promise<CampaignHandout> {
  const { data, error } = await supabase
    .from('campaign_handouts')
    .insert({
      campaign_id: campaignId,
      title: input.title,
      content: input.content,
      published: input.published,
      created_by: createdBy,
    })
    .select(HANDOUT_FIELDS)
    .single();

  if (error) {
    throw new Error(`Failed to create handout: ${error.message}`);
  }

  return data as unknown as CampaignHandout;
}

export async function updateHandout(
  supabase: SupabaseClient,
  campaignId: string,
  handoutId: string,
  input: Partial<HandoutInput>,
): Promise<CampaignHandout> {
  const { data, error } = await supabase
    .from('campaign_handouts')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('campaign_id', campaignId)
    .eq('id', handoutId)
    .is('deleted_at', null)
    .select(HANDOUT_FIELDS)
    .single();

  if (error) {
    throw new Error(`Failed to update handout: ${error.message}`);
  }

  return data as unknown as CampaignHandout;
}

export async function deleteHandout(
  supabase: SupabaseClient,
  campaignId: string,
  handoutId: string,
): Promise<void> {
  const { error } = await supabase
    .from('campaign_handouts')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('campaign_id', campaignId)
    .eq('id', handoutId)
    .is('deleted_at', null);

  if (error) {
    throw new Error(`Failed to delete handout: ${error.message}`);
  }
}
