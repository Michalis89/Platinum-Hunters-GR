import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getCampaignRole, requireCampaignMember } from '@/lib/dnd/access';
import { getSheetById, updateSheet, deleteSheet } from '@/lib/dnd/queries/characterSheet';
import { characterSheetSchema } from '../route';

const paramsSchema = z.object({
  id: z.string().uuid(),
  sheetId: z.string().uuid(),
});

// GET: fetch a specific sheet (player: own; DM: any visible)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; sheetId: string }> },
) {
  const resolvedParams = await params;
  const parsedParams = paramsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }

  const { id: campaignId, sheetId } = parsedParams.data;

  const supabase = await createRouteHandlerClient();
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

    const sheet = await getSheetById(supabase, sheetId);
    if (!sheet || sheet.campaign_id !== campaignId) {
      return NextResponse.json({ error: 'Sheet not found' }, { status: 404 });
    }

    // Players can only access their own sheets; DMs can access visible sheets
    if (!isDm && sheet.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (isDm && !sheet.visible_to_dm && sheet.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Sheet is not shared with DM' }, { status: 403 });
    }

    return NextResponse.json({ data: sheet });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch sheet';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT: update a specific sheet (player: own only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; sheetId: string }> },
) {
  const resolvedParams = await params;
  const parsedParams = paramsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }

  const { id: campaignId, sheetId } = parsedParams.data;

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

    // All members can edit their own sheets — ownership checked below

    // Verify sheet belongs to this player and campaign
    const existing = await getSheetById(supabase, sheetId);
    if (!existing || existing.campaign_id !== campaignId || existing.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Sheet not found' }, { status: 404 });
    }

    const d = parsedBody.data;
    const saved = await updateSheet(supabase, sheetId, session.user.id, {
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

    return NextResponse.json({ data: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save character sheet';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: delete a specific sheet (player: own only)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; sheetId: string }> },
) {
  const resolvedParams = await params;
  const parsedParams = paramsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }

  const { id: campaignId, sheetId } = parsedParams.data;

  const supabase = await createRouteHandlerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await requireCampaignMember(supabase, campaignId, session.user.id);
    const role = await getCampaignRole(supabase, campaignId, session.user.id);

    // All members can delete their own sheets — ownership checked below

    const existing = await getSheetById(supabase, sheetId);
    if (!existing || existing.campaign_id !== campaignId || existing.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Sheet not found' }, { status: 404 });
    }

    await deleteSheet(supabase, sheetId, session.user.id);
    return NextResponse.json({ data: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete character sheet';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
