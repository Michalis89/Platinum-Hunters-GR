import type { SupabaseClient } from '@supabase/supabase-js';
import type { CampaignAsset } from '@/lib/dnd/types';

const ASSET_FIELDS = 'id,campaign_id,path,type,title,tags,published,created_by,created_at';

type AssetInput = {
  path: string;
  type?: 'image' | 'pdf' | 'other';
  title?: string | null;
  tags: string[];
  published: boolean;
};

export async function listAssets(
  supabase: SupabaseClient,
  campaignId: string,
  isDm: boolean,
): Promise<CampaignAsset[]> {
  let query = supabase.from('campaign_assets').select(ASSET_FIELDS).eq('campaign_id', campaignId);
  query = query.is('deleted_at', null);

  if (!isDm) {
    query = query.eq('published', true);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list assets: ${error.message}`);
  }

  return (data ?? []) as unknown as CampaignAsset[];
}

export async function getAsset(
  supabase: SupabaseClient,
  campaignId: string,
  assetId: string,
  isDm: boolean,
): Promise<CampaignAsset | null> {
  let query = supabase
    .from('campaign_assets')
    .select(ASSET_FIELDS)
    .eq('campaign_id', campaignId)
    .eq('id', assetId)
    .is('deleted_at', null);

  if (!isDm) {
    query = query.eq('published', true);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch asset: ${error.message}`);
  }

  return (data as unknown as CampaignAsset | null) ?? null;
}

export async function createAsset(
  supabase: SupabaseClient,
  campaignId: string,
  input: AssetInput,
  createdBy: string,
): Promise<CampaignAsset> {
  const { data, error } = await supabase
    .from('campaign_assets')
    .insert({
      campaign_id: campaignId,
      path: input.path,
      type: input.type ?? 'other',
      title: input.title ?? null,
      tags: input.tags,
      published: input.published,
      created_by: createdBy,
    })
    .select(ASSET_FIELDS)
    .single();

  if (error) {
    throw new Error(`Failed to create asset: ${error.message}`);
  }

  return data as unknown as CampaignAsset;
}

export async function updateAsset(
  supabase: SupabaseClient,
  campaignId: string,
  assetId: string,
  input: Partial<Pick<AssetInput, 'title' | 'tags' | 'published'>>,
): Promise<CampaignAsset> {
  const { data, error } = await supabase
    .from('campaign_assets')
    .update(input)
    .eq('campaign_id', campaignId)
    .eq('id', assetId)
    .is('deleted_at', null)
    .select(ASSET_FIELDS)
    .single();

  if (error) {
    throw new Error(`Failed to update asset: ${error.message}`);
  }

  return data as unknown as CampaignAsset;
}

export async function deleteAsset(
  supabase: SupabaseClient,
  campaignId: string,
  assetId: string,
): Promise<CampaignAsset | null> {
  const { data, error } = await supabase
    .from('campaign_assets')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('campaign_id', campaignId)
    .eq('id', assetId)
    .is('deleted_at', null)
    .select(ASSET_FIELDS)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to delete asset: ${error.message}`);
  }

  return (data as unknown as CampaignAsset | null) ?? null;
}
