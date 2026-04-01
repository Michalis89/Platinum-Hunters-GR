import type { SupabaseClient } from '@supabase/supabase-js';
import type { CharacterSheet, WeaponEntry } from '@/lib/dnd/types';

const SHEET_FIELDS =
  'id,campaign_id,user_id,character_name,race,class,subclass,level,background,alignment,str,dex,con,int_stat,wis,cha,hp_max,hp_current,hp_temp,ac,speed,initiative_bonus,proficiency_bonus,saving_throw_profs,features,equipment,spells,notes,visible_to_dm,dm_notes,skills_profs,skills_expertise,inspiration,death_save_successes,death_save_failures,hit_dice_type,hit_dice_spent,passive_perception,weapons_data,languages,personality_traits,ideals,bonds,flaws,appearance,backstory,spellcasting_ability,spell_save_dc,spell_attack_bonus,spell_slots_max,spell_slots_used,spells_cantrips,spells_1,spells_2,spells_3,spells_4,spells_5,spells_6,spells_7,spells_8,spells_9,extra_resource_name,extra_resource_max,extra_resource_used,created_at,updated_at';

export type CharacterSheetInput = {
  character_name: string;
  race?: string | null;
  class?: string | null;
  subclass?: string | null;
  level: number;
  background?: string | null;
  alignment?: string | null;
  str?: number | null;
  dex?: number | null;
  con?: number | null;
  int_stat?: number | null;
  wis?: number | null;
  cha?: number | null;
  hp_max?: number | null;
  hp_current?: number | null;
  hp_temp: number;
  ac?: number | null;
  speed: number;
  initiative_bonus: number;
  proficiency_bonus: number;
  saving_throw_profs: string;
  features?: string | null;
  equipment?: string | null;
  spells?: string | null;
  notes?: string | null;
  visible_to_dm: boolean;
  // v3 fields
  skills_profs?: string;
  skills_expertise?: string;
  inspiration?: boolean;
  death_save_successes?: number;
  death_save_failures?: number;
  hit_dice_type?: string;
  hit_dice_spent?: number;
  passive_perception?: number | null;
  weapons_data?: WeaponEntry[];
  languages?: string | null;
  personality_traits?: string | null;
  ideals?: string | null;
  bonds?: string | null;
  flaws?: string | null;
  appearance?: string | null;
  backstory?: string | null;
  spellcasting_ability?: string | null;
  spell_save_dc?: number | null;
  spell_attack_bonus?: number | null;
  spell_slots_max?: Record<string, number>;
  spell_slots_used?: Record<string, number>;
  spells_cantrips?: string | null;
  spells_1?: string | null;
  spells_2?: string | null;
  spells_3?: string | null;
  spells_4?: string | null;
  spells_5?: string | null;
  spells_6?: string | null;
  spells_7?: string | null;
  spells_8?: string | null;
  spells_9?: string | null;
  extra_resource_name?: string | null;
  extra_resource_max?: number | null;
  extra_resource_used?: number;
};

export async function getMySheets(
  supabase: SupabaseClient,
  campaignId: string,
  userId: string,
): Promise<CharacterSheet[]> {
  const { data, error } = await supabase
    .from('character_sheets')
    .select(SHEET_FIELDS)
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch character sheets: ${error.message}`);
  }

  return (data ?? []) as unknown as CharacterSheet[];
}

export async function getSheetById(
  supabase: SupabaseClient,
  sheetId: string,
): Promise<CharacterSheet | null> {
  const { data, error } = await supabase
    .from('character_sheets')
    .select(SHEET_FIELDS)
    .eq('id', sheetId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch character sheet: ${error.message}`);
  }

  return (data as unknown as CharacterSheet | null) ?? null;
}

export async function getAllSheets(
  supabase: SupabaseClient,
  campaignId: string,
): Promise<CharacterSheet[]> {
  const { data, error } = await supabase
    .from('character_sheets')
    .select(SHEET_FIELDS)
    .eq('campaign_id', campaignId)
    .eq('visible_to_dm', true)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch character sheets: ${error.message}`);
  }

  return (data ?? []) as unknown as CharacterSheet[];
}

export async function createSheet(
  supabase: SupabaseClient,
  campaignId: string,
  userId: string,
  data: CharacterSheetInput,
): Promise<CharacterSheet> {
  const { data: created, error } = await supabase
    .from('character_sheets')
    .insert({
      campaign_id: campaignId,
      user_id: userId,
      ...data,
      updated_at: new Date().toISOString(),
    })
    .select(SHEET_FIELDS)
    .single();

  if (error) {
    throw new Error(`Failed to create character sheet: ${error.message}`);
  }

  return created as unknown as CharacterSheet;
}

export async function updateSheet(
  supabase: SupabaseClient,
  sheetId: string,
  userId: string,
  data: CharacterSheetInput,
): Promise<CharacterSheet> {
  const { data: saved, error } = await supabase
    .from('character_sheets')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sheetId)
    .eq('user_id', userId)
    .select(SHEET_FIELDS)
    .single();

  if (error) {
    throw new Error(`Failed to update character sheet: ${error.message}`);
  }

  return saved as unknown as CharacterSheet;
}

export async function deleteSheet(
  supabase: SupabaseClient,
  sheetId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('character_sheets')
    .delete()
    .eq('id', sheetId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete character sheet: ${error.message}`);
  }
}

export async function updateDmNotes(
  supabase: SupabaseClient,
  sheetId: string,
  dmNotes: string | null,
): Promise<void> {
  const { error } = await supabase
    .from('character_sheets')
    .update({ dm_notes: dmNotes })
    .eq('id', sheetId);

  if (error) {
    throw new Error(`Failed to update DM notes: ${error.message}`);
  }
}

export type CharacterSheetWithCampaign = CharacterSheet & {
  campaign_name: string;
};

/** All sheets for a user across all their campaigns */
export async function getAllMySheetsAcrossCampaigns(
  supabase: SupabaseClient,
  userId: string,
): Promise<CharacterSheetWithCampaign[]> {
  const { data, error } = await supabase
    .from('character_sheets')
    .select(SHEET_FIELDS)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch character sheets: ${error.message}`);
  }

  const sheets = (data ?? []) as unknown as CharacterSheet[];
  if (sheets.length === 0) return [];

  const campaignIds = [...new Set(sheets.map(s => s.campaign_id))];
  const { data: campaigns, error: campaignError } = await supabase
    .from('campaigns')
    .select('id,name')
    .in('id', campaignIds);

  if (campaignError) {
    throw new Error(`Failed to fetch campaign names: ${campaignError.message}`);
  }

  const nameMap = new Map((campaigns ?? []).map((c: { id: string; name: string }) => [c.id, c.name]));

  return sheets.map(sheet => ({
    ...sheet,
    campaign_name: nameMap.get(sheet.campaign_id) ?? 'Unknown Campaign',
  }));
}

/** @deprecated use getMySheets + createSheet/updateSheet instead */
export async function getMySheet(
  supabase: SupabaseClient,
  campaignId: string,
  userId: string,
): Promise<CharacterSheet | null> {
  const sheets = await getMySheets(supabase, campaignId, userId);
  return sheets[0] ?? null;
}

/** @deprecated use createSheet/updateSheet instead */
export async function upsertSheet(
  supabase: SupabaseClient,
  campaignId: string,
  userId: string,
  data: CharacterSheetInput,
): Promise<CharacterSheet> {
  const sheets = await getMySheets(supabase, campaignId, userId);
  if (sheets[0]) {
    return updateSheet(supabase, sheets[0].id, userId, data);
  }

  return createSheet(supabase, campaignId, userId, data);
}
