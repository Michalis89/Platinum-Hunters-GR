import type { SupabaseClient } from '@supabase/supabase-js';
import type { CampaignNpc, CampaignNpcPublic, CreateNpcInput } from '@/lib/dnd/types';

const DM_NPC_FIELDS =
  'id,campaign_id,name,role,status,description,tags,public_notes,secret_notes,published,created_by,created_at,updated_at';
const PLAYER_NPC_FIELDS =
  'id,campaign_id,name,role,status,description,tags,public_notes,published,created_by,created_at,updated_at';

type NpcInput = CreateNpcInput & {
  published?: boolean;
};

export async function listNpcs(
  supabase: SupabaseClient,
  campaignId: string,
  isDm: boolean,
): Promise<CampaignNpc[] | CampaignNpcPublic[]> {
  const fields = isDm ? DM_NPC_FIELDS : PLAYER_NPC_FIELDS;

  let query = supabase.from('campaign_npcs').select(fields).eq('campaign_id', campaignId);
  query = query.is('deleted_at', null);

  if (!isDm) {
    query = query.eq('published', true);
  }

  const { data, error } = await query.order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list NPCs: ${error.message}`);
  }

  return (data ?? []) as unknown as CampaignNpc[] | CampaignNpcPublic[];
}

export async function getNpc(
  supabase: SupabaseClient,
  campaignId: string,
  npcId: string,
  isDm: boolean,
): Promise<CampaignNpc | CampaignNpcPublic | null> {
  const fields = isDm ? DM_NPC_FIELDS : PLAYER_NPC_FIELDS;

  let query = supabase
    .from('campaign_npcs')
    .select(fields)
    .eq('campaign_id', campaignId)
    .eq('id', npcId)
    .is('deleted_at', null);

  if (!isDm) {
    query = query.eq('published', true);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch NPC: ${error.message}`);
  }

  return (data as unknown as CampaignNpc | CampaignNpcPublic | null) ?? null;
}

export async function createNpc(
  supabase: SupabaseClient,
  campaignId: string,
  input: NpcInput,
  createdBy: string,
): Promise<CampaignNpc> {
  const { data, error } = await supabase
    .from('campaign_npcs')
    .insert({
      campaign_id: campaignId,
      name: input.name,
      role: input.role,
      status: input.status,
      description: input.description,
      tags: input.tags,
      public_notes: input.public_notes,
      secret_notes: input.secret_notes,
      published: input.published ?? false,
      created_by: createdBy,
    })
    .select(DM_NPC_FIELDS)
    .single();

  if (error) {
    throw new Error(`Failed to create NPC: ${error.message}`);
  }

  return data as unknown as CampaignNpc;
}

export async function updateNpc(
  supabase: SupabaseClient,
  campaignId: string,
  npcId: string,
  input: Partial<NpcInput>,
): Promise<CampaignNpc> {
  const { data, error } = await supabase
    .from('campaign_npcs')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('campaign_id', campaignId)
    .eq('id', npcId)
    .is('deleted_at', null)
    .select(DM_NPC_FIELDS)
    .single();

  if (error) {
    throw new Error(`Failed to update NPC: ${error.message}`);
  }

  return data as unknown as CampaignNpc;
}

export async function deleteNpc(
  supabase: SupabaseClient,
  campaignId: string,
  npcId: string,
): Promise<void> {
  const { error } = await supabase
    .from('campaign_npcs')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('campaign_id', campaignId)
    .eq('id', npcId)
    .is('deleted_at', null);

  if (error) {
    throw new Error(`Failed to delete NPC: ${error.message}`);
  }
}
