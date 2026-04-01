import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getCampaignRole, requireCampaignMember } from '@/lib/dnd/access';
import { getAllSheets, createSheet, getMySheets } from '@/lib/dnd/queries/characterSheet';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const weaponEntrySchema = z.object({
  name: z.string().max(100).default(''),
  attack_bonus: z.string().max(20).default(''),
  damage: z.string().max(30).default(''),
  damage_type: z.string().max(30).default(''),
  range: z.string().max(30).default(''),
  notes: z.string().max(200).default(''),
});

export const characterSheetSchema = z.object({
  character_name: z.string().min(1).max(100),
  race: z.string().max(50).optional().nullable(),
  class: z.string().max(50).optional().nullable(),
  subclass: z.string().max(50).optional().nullable(),
  level: z.number().int().min(1).max(20).default(1),
  background: z.string().max(50).optional().nullable(),
  alignment: z.string().max(30).optional().nullable(),
  str: z.number().int().min(1).max(30).optional().nullable(),
  dex: z.number().int().min(1).max(30).optional().nullable(),
  con: z.number().int().min(1).max(30).optional().nullable(),
  int_stat: z.number().int().min(1).max(30).optional().nullable(),
  wis: z.number().int().min(1).max(30).optional().nullable(),
  cha: z.number().int().min(1).max(30).optional().nullable(),
  hp_max: z.number().int().optional().nullable(),
  hp_current: z.number().int().optional().nullable(),
  hp_temp: z.number().int().default(0),
  ac: z.number().int().optional().nullable(),
  speed: z.number().int().default(30),
  initiative_bonus: z.number().int().default(0),
  proficiency_bonus: z.number().int().default(2),
  saving_throw_profs: z.string().max(200).default(''),
  features: z.string().max(10000).optional().nullable(),
  equipment: z.string().max(10000).optional().nullable(),
  spells: z.string().max(10000).optional().nullable(),
  notes: z.string().max(10000).optional().nullable(),
  visible_to_dm: z.boolean().default(true),
  // v3 fields
  skills_profs: z.string().max(300).default(''),
  skills_expertise: z.string().max(300).default(''),
  inspiration: z.boolean().default(false),
  death_save_successes: z.number().int().min(0).max(3).default(0),
  death_save_failures: z.number().int().min(0).max(3).default(0),
  hit_dice_type: z.string().max(5).default('d8'),
  hit_dice_spent: z.number().int().min(0).default(0),
  passive_perception: z.number().int().optional().nullable(),
  weapons_data: z.array(weaponEntrySchema).default([]),
  languages: z.string().max(500).optional().nullable(),
  personality_traits: z.string().max(2000).optional().nullable(),
  ideals: z.string().max(2000).optional().nullable(),
  bonds: z.string().max(2000).optional().nullable(),
  flaws: z.string().max(2000).optional().nullable(),
  appearance: z.string().max(2000).optional().nullable(),
  backstory: z.string().max(10000).optional().nullable(),
  spellcasting_ability: z.string().max(10).optional().nullable(),
  spell_save_dc: z.number().int().optional().nullable(),
  spell_attack_bonus: z.number().int().optional().nullable(),
  spell_slots_max: z.record(z.string(), z.number().int().min(0)).default({}),
  spell_slots_used: z.record(z.string(), z.number().int().min(0)).default({}),
  spells_cantrips: z.string().max(5000).optional().nullable(),
  spells_1: z.string().max(5000).optional().nullable(),
  spells_2: z.string().max(5000).optional().nullable(),
  spells_3: z.string().max(5000).optional().nullable(),
  spells_4: z.string().max(5000).optional().nullable(),
  spells_5: z.string().max(5000).optional().nullable(),
  spells_6: z.string().max(5000).optional().nullable(),
  spells_7: z.string().max(5000).optional().nullable(),
  spells_8: z.string().max(5000).optional().nullable(),
  spells_9: z.string().max(5000).optional().nullable(),
  extra_resource_name: z.string().max(50).optional().nullable(),
  extra_resource_max: z.number().int().optional().nullable(),
  extra_resource_used: z.number().int().min(0).default(0),
});

// GET: player → list own sheets; DM with ?all=true → all visible sheets
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolvedParams = await params;
  const parsedParams = paramsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid campaign id' }, { status: 400 });
  }

  const campaignId = parsedParams.data.id;
  const searchParams = new URL(request.url).searchParams;
  const all = searchParams.get('all') === 'true';

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

    if (all) {
      if (!isDm) {
        return NextResponse.json({ error: 'Forbidden: DM access required' }, { status: 403 });
      }

      const sheets = await getAllSheets(supabase, campaignId);
      const userIds = [...new Set(sheets.map(sheet => sheet.user_id))];

      const nameMap = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: users, error: usersError } = await db
          .from('users')
          .select('id,display_name,username')
          .in('id', userIds);

        if (usersError) {
          throw new Error(`Failed to fetch player names: ${usersError.message}`);
        }

        (users ?? []).forEach(user => {
          const label = user.display_name?.trim() || user.username || user.id;
          nameMap.set(user.id, label);
        });
      }

      // Exclude the requesting user's own sheets (they appear in CharacterSheetManager)
      const otherSheets = sheets.filter(sheet => sheet.user_id !== session.user.id);

      return NextResponse.json({
        data: otherSheets.map(sheet => ({
          ...sheet,
          player_name: nameMap.get(sheet.user_id) ?? sheet.user_id,
        })),
      });
    }

    // Player or DM: list their own sheets
    const sheets = await getMySheets(supabase, campaignId, session.user.id);
    return NextResponse.json({ data: sheets });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch character sheets';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: create a new character sheet for the current player
export async function POST(
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

  const parsedBody = characterSheetSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Invalid character sheet payload' }, { status: 400 });
  }

  try {
    await requireCampaignMember(supabase, campaignId, session.user.id);
    const role = await getCampaignRole(supabase, campaignId, session.user.id);

    // All campaign members (player, co_dm, dm) can create their own sheets

    const d = parsedBody.data;
    const created = await createSheet(supabase, campaignId, session.user.id, {
      character_name: d.character_name,
      race: d.race ?? null,
      class: d.class ?? null,
      subclass: d.subclass ?? null,
      level: d.level,
      background: d.background ?? null,
      alignment: d.alignment ?? null,
      str: d.str ?? null,
      dex: d.dex ?? null,
      con: d.con ?? null,
      int_stat: d.int_stat ?? null,
      wis: d.wis ?? null,
      cha: d.cha ?? null,
      hp_max: d.hp_max ?? null,
      hp_current: d.hp_current ?? null,
      hp_temp: d.hp_temp,
      ac: d.ac ?? null,
      speed: d.speed,
      initiative_bonus: d.initiative_bonus,
      proficiency_bonus: d.proficiency_bonus,
      saving_throw_profs: d.saving_throw_profs,
      features: d.features ?? null,
      equipment: d.equipment ?? null,
      spells: d.spells ?? null,
      notes: d.notes ?? null,
      visible_to_dm: d.visible_to_dm,
      skills_profs: d.skills_profs,
      skills_expertise: d.skills_expertise,
      inspiration: d.inspiration,
      death_save_successes: d.death_save_successes,
      death_save_failures: d.death_save_failures,
      hit_dice_type: d.hit_dice_type,
      hit_dice_spent: d.hit_dice_spent,
      passive_perception: d.passive_perception ?? null,
      weapons_data: d.weapons_data,
      languages: d.languages ?? null,
      personality_traits: d.personality_traits ?? null,
      ideals: d.ideals ?? null,
      bonds: d.bonds ?? null,
      flaws: d.flaws ?? null,
      appearance: d.appearance ?? null,
      backstory: d.backstory ?? null,
      spellcasting_ability: d.spellcasting_ability ?? null,
      spell_save_dc: d.spell_save_dc ?? null,
      spell_attack_bonus: d.spell_attack_bonus ?? null,
      spell_slots_max: d.spell_slots_max,
      spell_slots_used: d.spell_slots_used,
      spells_cantrips: d.spells_cantrips ?? null,
      spells_1: d.spells_1 ?? null,
      spells_2: d.spells_2 ?? null,
      spells_3: d.spells_3 ?? null,
      spells_4: d.spells_4 ?? null,
      spells_5: d.spells_5 ?? null,
      spells_6: d.spells_6 ?? null,
      spells_7: d.spells_7 ?? null,
      spells_8: d.spells_8 ?? null,
      spells_9: d.spells_9 ?? null,
      extra_resource_name: d.extra_resource_name ?? null,
      extra_resource_max: d.extra_resource_max ?? null,
      extra_resource_used: d.extra_resource_used,
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create character sheet';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
