import type { SupabaseClient } from '@supabase/supabase-js';
import type { CampaignQuest, CampaignQuestPublic, CreateQuestInput } from '@/lib/dnd/types';

const DM_QUEST_FIELDS =
  'id,campaign_id,title,status,summary,public_notes,secret_notes,published,created_by,created_at,updated_at';
const PLAYER_QUEST_FIELDS =
  'id,campaign_id,title,status,summary,public_notes,published,created_by,created_at,updated_at';

type QuestInput = CreateQuestInput & {
  published?: boolean;
};

export async function listQuests(
  supabase: SupabaseClient,
  campaignId: string,
  isDm: boolean,
): Promise<CampaignQuest[] | CampaignQuestPublic[]> {
  const fields = isDm ? DM_QUEST_FIELDS : PLAYER_QUEST_FIELDS;

  let query = supabase.from('campaign_quests').select(fields).eq('campaign_id', campaignId);
  query = query.is('deleted_at', null);

  if (!isDm) {
    query = query.eq('published', true);
  }

  const { data, error } = await query.order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list quests: ${error.message}`);
  }

  return (data ?? []) as unknown as CampaignQuest[] | CampaignQuestPublic[];
}

export async function getQuest(
  supabase: SupabaseClient,
  campaignId: string,
  questId: string,
  isDm: boolean,
): Promise<CampaignQuest | CampaignQuestPublic | null> {
  const fields = isDm ? DM_QUEST_FIELDS : PLAYER_QUEST_FIELDS;

  let query = supabase
    .from('campaign_quests')
    .select(fields)
    .eq('campaign_id', campaignId)
    .eq('id', questId)
    .is('deleted_at', null);

  if (!isDm) {
    query = query.eq('published', true);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch quest: ${error.message}`);
  }

  return (data as unknown as CampaignQuest | CampaignQuestPublic | null) ?? null;
}

export async function createQuest(
  supabase: SupabaseClient,
  campaignId: string,
  input: QuestInput,
  createdBy: string,
): Promise<CampaignQuest> {
  const { data, error } = await supabase
    .from('campaign_quests')
    .insert({
      campaign_id: campaignId,
      title: input.title,
      status: input.status,
      summary: input.summary,
      public_notes: input.public_notes,
      secret_notes: input.secret_notes,
      published: input.published ?? false,
      created_by: createdBy,
    })
    .select(DM_QUEST_FIELDS)
    .single();

  if (error) {
    throw new Error(`Failed to create quest: ${error.message}`);
  }

  return data as unknown as CampaignQuest;
}

export async function updateQuest(
  supabase: SupabaseClient,
  campaignId: string,
  questId: string,
  input: Partial<QuestInput>,
): Promise<CampaignQuest> {
  const { data, error } = await supabase
    .from('campaign_quests')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('campaign_id', campaignId)
    .eq('id', questId)
    .is('deleted_at', null)
    .select(DM_QUEST_FIELDS)
    .single();

  if (error) {
    throw new Error(`Failed to update quest: ${error.message}`);
  }

  return data as unknown as CampaignQuest;
}

export async function deleteQuest(
  supabase: SupabaseClient,
  campaignId: string,
  questId: string,
): Promise<void> {
  const { error } = await supabase
    .from('campaign_quests')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('campaign_id', campaignId)
    .eq('id', questId)
    .is('deleted_at', null);

  if (error) {
    throw new Error(`Failed to delete quest: ${error.message}`);
  }
}
