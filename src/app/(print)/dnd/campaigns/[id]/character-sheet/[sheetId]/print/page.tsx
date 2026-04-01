import { notFound, redirect } from 'next/navigation';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getUserSettings } from '@/lib/settings';
import { getCampaignRole, requireCampaignMember } from '@/lib/dnd/access';
import { getSheetById } from '@/lib/dnd/queries/characterSheet';
import type { CharacterSheet, WeaponEntry } from '@/lib/dnd/types';
import { PrintButton } from './PrintButton';

type PageProps = {
  params: Promise<{ id: string; sheetId: string }>;
};

function mod(stat: number | null): number {
  if (stat === null) return 0;
  return Math.floor((stat - 10) / 2);
}

function fmod(stat: number | null): string {
  const m = mod(stat);
  return m >= 0 ? `+${m}` : `${m}`;
}

function fval(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

function hasProf(profs: string | null | undefined, key: string): boolean {
  return (profs ?? '').split(',').filter(Boolean).includes(key);
}

function statFor(sheet: CharacterSheet, ab: string): number | null {
  switch (ab) {
    case 'str': return sheet.str;
    case 'dex': return sheet.dex;
    case 'con': return sheet.con;
    case 'int': return sheet.int_stat;
    case 'wis': return sheet.wis;
    case 'cha': return sheet.cha;
    default: return null;
  }
}

const SAVES: Array<{ key: string; label: string; stat: keyof CharacterSheet }> = [
  { key: 'str', label: 'Strength', stat: 'str' },
  { key: 'dex', label: 'Dexterity', stat: 'dex' },
  { key: 'con', label: 'Constitution', stat: 'con' },
  { key: 'int', label: 'Intelligence', stat: 'int_stat' },
  { key: 'wis', label: 'Wisdom', stat: 'wis' },
  { key: 'cha', label: 'Charisma', stat: 'cha' },
];

const SKILLS: Array<{ key: string; label: string; ab: string }> = [
  { key: 'acrobatics', label: 'Acrobatics', ab: 'dex' },
  { key: 'animal_handling', label: 'Animal Handling', ab: 'wis' },
  { key: 'arcana', label: 'Arcana', ab: 'int' },
  { key: 'athletics', label: 'Athletics', ab: 'str' },
  { key: 'deception', label: 'Deception', ab: 'cha' },
  { key: 'history', label: 'History', ab: 'int' },
  { key: 'insight', label: 'Insight', ab: 'wis' },
  { key: 'intimidation', label: 'Intimidation', ab: 'cha' },
  { key: 'investigation', label: 'Investigation', ab: 'int' },
  { key: 'medicine', label: 'Medicine', ab: 'wis' },
  { key: 'nature', label: 'Nature', ab: 'int' },
  { key: 'perception', label: 'Perception', ab: 'wis' },
  { key: 'performance', label: 'Performance', ab: 'cha' },
  { key: 'persuasion', label: 'Persuasion', ab: 'cha' },
  { key: 'religion', label: 'Religion', ab: 'int' },
  { key: 'sleight_of_hand', label: 'Sleight of Hand', ab: 'dex' },
  { key: 'stealth', label: 'Stealth', ab: 'dex' },
  { key: 'survival', label: 'Survival', ab: 'wis' },
];

const css = `
@page { margin: 0.8cm 1cm; size: letter portrait; }
html, body { background: #fff !important; color: #1a1a2e !important; font-family: 'Gill Sans', Optima, Candara, Calibri, sans-serif !important; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Gill Sans', Optima, Candara, Calibri, sans-serif; font-size: 10px; color: #1a1a2e; background: #fff; }

/* ── Print button ── */
.no-print { position: fixed; top: 10px; right: 10px; z-index: 100; }
@media print { .no-print { display: none !important; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }

/* ── Page break ── */
.page-break { page-break-before: always; break-before: page; padding-top: 6px; }

/* ── Header ── */
.hdr { border-bottom: 3px solid #8B0000; padding-bottom: 6px; margin-bottom: 8px; }
.char-name { font-size: 24px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; line-height: 1; margin-bottom: 4px; }
.hdr-meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px 12px; }
.hdr-cell { }
.hdr-val { font-size: 9.5px; font-weight: 600; border-bottom: 1px solid #ccc; padding-bottom: 1px; min-height: 12px; }
.hdr-lbl { font-size: 6.5px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin-top: 1px; }

/* ── 3-column body ── */
.body { display: grid; grid-template-columns: 27% 41% 32%; gap: 8px; }

/* ── Section title ── */
.stitle { font-size: 7px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: #fff; background: #1a1a2e; padding: 2px 8px; border-radius: 2px; margin: 7px 0 3px; text-align: center; }

/* ── Ability scores ── */
.abilities { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; margin-bottom: 4px; }
.ab { text-align: center; border: 2px solid #8B0000; border-radius: 7px; padding: 4px 2px 3px; background: #fff; }
.ab-name { font-size: 7px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #8B0000; }
.ab-mod { font-size: 20px; font-weight: 700; line-height: 1.1; }
.ab-score { font-size: 9px; color: #555; border-top: 1px solid #e5e7eb; margin-top: 2px; padding-top: 1px; }

/* ── Prof rows (saves / skills) ── */
.prow { display: flex; align-items: center; gap: 3px; font-size: 8px; padding: 1.5px 2px; }
.prow:nth-child(even) { background: #f3f4f6; }
.dot { width: 8px; height: 8px; border-radius: 50%; border: 1.5px solid #374151; flex-shrink: 0; background: #fff; }
.dot.p { background: #1a1a2e; border-color: #1a1a2e; }
.dot.e { background: #8B0000; border-color: #8B0000; }
.pval { font-weight: 700; width: 18px; text-align: right; flex-shrink: 0; }
.pname { flex: 1; padding-left: 3px; white-space: nowrap; overflow: hidden; }
.pab { color: #9ca3af; font-size: 7px; }

/* ── Passive perception box ── */
.passive { display: flex; align-items: center; gap: 7px; border: 2px solid #1a1a2e; border-radius: 4px; padding: 4px 8px; margin-top: 6px; }
.passive-num { font-size: 22px; font-weight: 700; }
.passive-lbl { font-size: 7.5px; text-transform: uppercase; font-weight: 700; line-height: 1.3; letter-spacing: 0.04em; }

/* ── Insp + Prof bar ── */
.top-bar { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 5px; }
.top-cell { border: 1.5px solid #d1d5db; border-radius: 4px; padding: 4px 6px; text-align: center; }
.top-val { font-size: 15px; font-weight: 700; line-height: 1.1; }
.top-lbl { font-size: 6.5px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; font-weight: 700; }

/* ── Combat top row ── */
.combat-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5px; margin-bottom: 6px; }
.cbox { border: 1.5px solid #d1d5db; border-radius: 5px; text-align: center; padding: 5px 4px; }
.cbox-lbl { font-size: 6px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; font-weight: 700; }
.cbox-val { font-size: 17px; font-weight: 700; line-height: 1.15; }
.cbox-sm { font-size: 12px; }

/* ── HP boxes ── */
.hp-wrap { border: 1.5px solid #d1d5db; border-radius: 5px; padding: 5px 8px; margin-bottom: 5px; }
.hp-max { font-size: 7.5px; color: #6b7280; margin-bottom: 3px; }
.hp-val { font-size: 22px; font-weight: 700; border-bottom: 1.5px solid #1a1a2e; min-height: 26px; padding-bottom: 1px; }
.hp-lbl { font-size: 6.5px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; font-weight: 700; text-align: center; margin-top: 2px; }

/* ── Hit Dice + Death Saves ── */
.hd-ds { display: grid; grid-template-columns: 1fr 1.4fr; gap: 5px; margin-bottom: 6px; }
.mini-box { border: 1.5px solid #d1d5db; border-radius: 5px; padding: 5px 6px; }
.mini-lbl { font-size: 7px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.06em; color: #1a1a2e; margin-bottom: 3px; }
.hd-val { font-size: 13px; font-weight: 700; }
.ds-row { display: flex; align-items: center; gap: 3px; font-size: 7.5px; margin-bottom: 2px; }
.ds-row span { flex-shrink: 0; }
.ds-lbl { color: #6b7280; width: 50px; }
.dc { width: 9px; height: 9px; border-radius: 50%; border: 1px solid #374151; flex-shrink: 0; background: #fff; }
.dc.s { background: #16a34a; border-color: #16a34a; }
.dc.f { background: #dc2626; border-color: #dc2626; }

/* ── Weapons ── */
.wtbl { width: 100%; border-collapse: collapse; font-size: 8px; margin-bottom: 6px; }
.wtbl th { font-size: 6.5px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; font-weight: 700; border-bottom: 1.5px solid #1a1a2e; padding: 2px 3px; text-align: left; }
.wtbl td { padding: 2.5px 3px; border-bottom: 1px solid #f3f4f6; }
.wtbl tr.blank td { height: 16px; border-bottom: 1px solid #e5e7eb; }

/* ── Text areas ── */
.tbox { border: 1.5px solid #d1d5db; border-radius: 4px; padding: 6px 7px; font-size: 8.5px; line-height: 1.55; white-space: pre-wrap; word-break: break-word; color: #1a1a2e; }
.tbox.tall { min-height: 90px; }
.tbox.xtall { min-height: 140px; }

/* ── Right column extras ── */
.res-box { display: flex; align-items: center; gap: 7px; border: 1.5px solid #8B0000; border-radius: 4px; padding: 4px 8px; margin-top: 6px; }
.res-num { font-size: 18px; font-weight: 700; color: #8B0000; }
.res-lbl { font-size: 7.5px; font-weight: 700; line-height: 1.3; }

/* ── Page 2: Backstory ── */
.trait-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
.trait-box { border: 1.5px solid #d1d5db; border-radius: 5px; padding: 7px 8px; }
.trait-title { font-size: 7px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #8B0000; margin-bottom: 4px; }
.trait-body { font-size: 8.5px; line-height: 1.5; white-space: pre-wrap; min-height: 40px; }

/* ── Page 3: Spells ── */
.spell-top { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 8px; }
.spell-slots-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.slot-lvl { text-align: center; min-width: 36px; }
.slot-ord { font-size: 7px; font-weight: 800; text-transform: uppercase; color: #6b7280; margin-bottom: 3px; }
.slot-circles { display: flex; justify-content: center; flex-wrap: wrap; gap: 2px; margin-bottom: 2px; }
.sc { width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid #1a1a2e; }
.sc.used { background: #1a1a2e; }
.slot-count { font-size: 7px; color: #6b7280; }
`;

export default async function CharacterSheetPrintPage({ params }: PageProps) {
  const { id: campaignId, sheetId } = await params;

  const supabase = await createRouteHandlerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect('/auth/login');

  const settings = await getUserSettings(session.user.id, { supabase });
  if (!settings.dnd_enabled) redirect('/settings');

  try {
    await requireCampaignMember(supabase, campaignId, session.user.id);
  } catch {
    notFound();
  }

  const role = await getCampaignRole(supabase, campaignId, session.user.id);
  const isDm = role === 'dm' || role === 'co_dm';

  const sheet = await getSheetById(supabase, sheetId);
  if (!sheet || sheet.campaign_id !== campaignId) notFound();
  if (!isDm && sheet.user_id !== session.user.id) notFound();

  // ── Derived values ──────────────────────────────────────────
  const prof = sheet.proficiency_bonus;
  const weapons: WeaponEntry[] = Array.isArray(sheet.weapons_data) ? (sheet.weapons_data as WeaponEntry[]) : [];
  const slotMax = (sheet.spell_slots_max as Record<string, number>) ?? {};
  const slotUsed = (sheet.spell_slots_used as Record<string, number>) ?? {};

  const passivePerception =
    10 +
    mod(sheet.wis) +
    (hasProf(sheet.skills_profs, 'perception') ? prof : 0) +
    (hasProf(sheet.skills_expertise, 'perception') ? prof : 0);

  const spellAbilMod = mod(statFor(sheet, sheet.spellcasting_ability ?? ''));
  const autoSpellDc = 8 + prof + spellAbilMod;
  const autoSpellAtk = prof + spellAbilMod;
  const spellDc = sheet.spell_save_dc ?? (sheet.spellcasting_ability ? autoSpellDc : null);
  const spellAtk = sheet.spell_attack_bonus ?? (sheet.spellcasting_ability ? autoSpellAtk : null);

  const hasSpells = !!(
    sheet.spellcasting_ability ||
    sheet.spells_cantrips?.trim() ||
    sheet.spells_1?.trim() ||
    sheet.spells_2?.trim() ||
    sheet.spells_3?.trim() ||
    sheet.spells_4?.trim() ||
    sheet.spells_5?.trim() ||
    sheet.spells_6?.trim() ||
    sheet.spells_7?.trim() ||
    sheet.spells_8?.trim() ||
    sheet.spells_9?.trim()
  );

  const hasBackstory = !!(
    sheet.personality_traits ||
    sheet.ideals ||
    sheet.bonds ||
    sheet.flaws ||
    sheet.appearance ||
    sheet.backstory ||
    sheet.notes
  );

  const ordinals = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th'];

  // ── Render ──────────────────────────────────────────────────
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {/* Print button */}
      <div className="no-print">
        <PrintButton />
      </div>

        {/* ══════════════════ PAGE 1 ══════════════════ */}

        {/* Header */}
        <div className="hdr">
          <div className="char-name">{sheet.character_name}</div>
          <div className="hdr-meta">
            {[
              { lbl: 'Class & Level', val: `${sheet.class ?? 'Adventurer'} ${sheet.level}${sheet.subclass ? ` (${sheet.subclass})` : ''}` },
              { lbl: 'Background', val: sheet.background ?? '—' },
              { lbl: 'Player Name', val: '' },
              { lbl: 'Race', val: sheet.race ?? '—' },
              { lbl: 'Alignment', val: sheet.alignment ?? '—' },
              { lbl: 'Experience Points', val: '—' },
            ].map(item => (
              <div key={item.lbl} className="hdr-cell">
                <div className="hdr-val">{item.val}</div>
                <div className="hdr-lbl">{item.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 3-column body */}
        <div className="body">

          {/* ── LEFT: Abilities + Saves + Skills ── */}
          <div>
            <div className="stitle">Ability Scores</div>
            <div className="abilities">
              {([
                { lbl: 'STR', stat: sheet.str },
                { lbl: 'DEX', stat: sheet.dex },
                { lbl: 'CON', stat: sheet.con },
                { lbl: 'INT', stat: sheet.int_stat },
                { lbl: 'WIS', stat: sheet.wis },
                { lbl: 'CHA', stat: sheet.cha },
              ] as Array<{ lbl: string; stat: number | null }>).map(({ lbl, stat }) => (
                <div key={lbl} className="ab">
                  <div className="ab-name">{lbl}</div>
                  <div className="ab-mod">{fmod(stat)}</div>
                  <div className="ab-score">{stat ?? '—'}</div>
                </div>
              ))}
            </div>

            <div className="stitle">Saving Throws</div>
            {SAVES.map(({ key, label, stat: statKey }) => {
              const s = sheet[statKey] as number | null;
              const p = hasProf(sheet.saving_throw_profs, key);
              const total = mod(s) + (p ? prof : 0);
              return (
                <div key={key} className="prow">
                  <span className={`dot${p ? ' p' : ''}`} />
                  <span className="pval">{fval(total)}</span>
                  <span className="pname">{label}</span>
                </div>
              );
            })}

            <div className="stitle">Skills</div>
            {SKILLS.map(skill => {
              const s = statFor(sheet, skill.ab);
              const p = hasProf(sheet.skills_profs, skill.key);
              const e = hasProf(sheet.skills_expertise, skill.key);
              const total = mod(s) + (e ? prof * 2 : p ? prof : 0);
              return (
                <div key={skill.key} className="prow">
                  <span className={`dot${e ? ' e' : p ? ' p' : ''}`} />
                  <span className="pval">{fval(total)}</span>
                  <span className="pname">
                    {skill.label} <span className="pab">({skill.ab.toUpperCase()})</span>
                  </span>
                </div>
              );
            })}

            <div className="passive">
              <div className="passive-num">{passivePerception}</div>
              <div className="passive-lbl">Passive Wisdom<br />(Perception)</div>
            </div>

            {sheet.languages ? (
              <>
                <div className="stitle">Languages</div>
                <div className="tbox">{sheet.languages}</div>
              </>
            ) : null}
          </div>

          {/* ── MIDDLE: Combat stats, HP, Attacks, Equipment ── */}
          <div>
            <div className="top-bar">
              <div className="top-cell">
                <div className="top-val">{sheet.inspiration ? '★' : '○'}</div>
                <div className="top-lbl">Inspiration</div>
              </div>
              <div className="top-cell">
                <div className="top-val">{fval(prof)}</div>
                <div className="top-lbl">Proficiency Bonus</div>
              </div>
            </div>

            <div className="combat-row">
              <div className="cbox">
                <div className="cbox-lbl">Armor Class</div>
                <div className="cbox-val">{sheet.ac ?? '—'}</div>
              </div>
              <div className="cbox">
                <div className="cbox-lbl">Initiative</div>
                <div className="cbox-val">{fval(sheet.initiative_bonus)}</div>
              </div>
              <div className="cbox">
                <div className="cbox-lbl">Speed</div>
                <div className="cbox-val cbox-sm">{sheet.speed} ft.</div>
              </div>
            </div>

            <div className="hp-wrap">
              <div className="hp-max">Hit Point Maximum: {sheet.hp_max ?? '—'}</div>
              <div className="hp-val">{sheet.hp_current ?? ''}</div>
              <div className="hp-lbl">Current Hit Points</div>
            </div>

            <div className="hp-wrap">
              <div className="hp-val" style={{ fontSize: 16 }}>{sheet.hp_temp > 0 ? sheet.hp_temp : ''}</div>
              <div className="hp-lbl">Temporary Hit Points</div>
            </div>

            <div className="hd-ds">
              <div className="mini-box">
                <div className="mini-lbl">Hit Dice</div>
                <div className="hd-val">
                  {sheet.level - (sheet.hit_dice_spent ?? 0)}/{sheet.level} {sheet.hit_dice_type ?? 'd8'}
                </div>
              </div>
              <div className="mini-box">
                <div className="mini-lbl">Death Saves</div>
                <div className="ds-row">
                  <span className="ds-lbl">Successes</span>
                  {[0,1,2].map(i => (
                    <span key={i} className={`dc${i < (sheet.death_save_successes ?? 0) ? ' s' : ''}`} />
                  ))}
                </div>
                <div className="ds-row">
                  <span className="ds-lbl">Failures</span>
                  {[0,1,2].map(i => (
                    <span key={i} className={`dc${i < (sheet.death_save_failures ?? 0) ? ' f' : ''}`} />
                  ))}
                </div>
              </div>
            </div>

            <div className="stitle">Attacks &amp; Spellcasting</div>
            <table className="wtbl">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Name</th>
                  <th style={{ width: '20%' }}>Atk Bonus</th>
                  <th style={{ width: '40%' }}>Damage / Type</th>
                </tr>
              </thead>
              <tbody>
                {weapons.length > 0 ? weapons.map((w, i) => (
                  <tr key={i}>
                    <td>{w.name}</td>
                    <td>{w.attack_bonus}</td>
                    <td>{w.damage}{w.damage_type ? ` ${w.damage_type}` : ''}</td>
                  </tr>
                )) : (
                  [0,1,2].map(i => <tr key={i} className="blank"><td /><td /><td /></tr>)
                )}
              </tbody>
            </table>

            <div className="stitle">Equipment</div>
            <div className="tbox tall">{sheet.equipment ?? ''}</div>
          </div>

          {/* ── RIGHT: Features, Extra Resource ── */}
          <div>
            {sheet.extra_resource_name ? (
              <div className="res-box">
                <div className="res-num">
                  {sheet.extra_resource_max !== null
                    ? `${(sheet.extra_resource_max ?? 0) - (sheet.extra_resource_used ?? 0)}/${sheet.extra_resource_max}`
                    : sheet.extra_resource_used}
                </div>
                <div className="res-lbl">{sheet.extra_resource_name}</div>
              </div>
            ) : null}

            <div className="stitle">Features &amp; Traits</div>
            <div className="tbox xtall">{sheet.features ?? ''}</div>
          </div>
        </div>

        {/* ══════════════════ PAGE 2: Backstory ══════════════════ */}
        {hasBackstory ? (
          <div className="page-break">
            <div style={{ fontSize: 16, fontWeight: 700, textTransform: 'uppercase', borderBottom: '2px solid #8B0000', paddingBottom: 5, marginBottom: 10 }}>
              {sheet.character_name} — Character Background
            </div>

            {(sheet.personality_traits || sheet.ideals || sheet.bonds || sheet.flaws) ? (
              <div className="trait-grid">
                {sheet.personality_traits ? (
                  <div className="trait-box">
                    <div className="trait-title">Personality Traits</div>
                    <div className="trait-body">{sheet.personality_traits}</div>
                  </div>
                ) : null}
                {sheet.ideals ? (
                  <div className="trait-box">
                    <div className="trait-title">Ideals</div>
                    <div className="trait-body">{sheet.ideals}</div>
                  </div>
                ) : null}
                {sheet.bonds ? (
                  <div className="trait-box">
                    <div className="trait-title">Bonds</div>
                    <div className="trait-body">{sheet.bonds}</div>
                  </div>
                ) : null}
                {sheet.flaws ? (
                  <div className="trait-box">
                    <div className="trait-title">Flaws</div>
                    <div className="trait-body">{sheet.flaws}</div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {sheet.appearance ? (
              <>
                <div className="stitle">Appearance</div>
                <div className="tbox" style={{ marginBottom: 8 }}>{sheet.appearance}</div>
              </>
            ) : null}

            {sheet.backstory ? (
              <>
                <div className="stitle">Backstory</div>
                <div className="tbox xtall" style={{ marginBottom: 8 }}>{sheet.backstory}</div>
              </>
            ) : null}

            {sheet.notes ? (
              <>
                <div className="stitle">Notes</div>
                <div className="tbox" style={{ marginBottom: 8 }}>{sheet.notes}</div>
              </>
            ) : null}
          </div>
        ) : null}

        {/* ══════════════════ PAGE 3: Spells ══════════════════ */}
        {hasSpells ? (
          <div className="page-break">
            <div style={{ fontSize: 16, fontWeight: 700, textTransform: 'uppercase', borderBottom: '2px solid #8B0000', paddingBottom: 5, marginBottom: 10 }}>
              {sheet.character_name} — Spellcasting
            </div>

            {sheet.spellcasting_ability ? (
              <div className="spell-top">
                <div className="cbox">
                  <div className="cbox-lbl">Spellcasting Ability</div>
                  <div className="cbox-val cbox-sm">{sheet.spellcasting_ability.toUpperCase()}</div>
                </div>
                <div className="cbox">
                  <div className="cbox-lbl">Spell Save DC</div>
                  <div className="cbox-val">{spellDc ?? '—'}</div>
                </div>
                <div className="cbox">
                  <div className="cbox-lbl">Spell Attack Bonus</div>
                  <div className="cbox-val">{spellAtk !== null ? fval(spellAtk) : '—'}</div>
                </div>
              </div>
            ) : null}

            {Object.keys(slotMax).some(k => (slotMax[k] ?? 0) > 0) ? (
              <>
                <div className="stitle">Spell Slots</div>
                <div className="spell-slots-grid">
                  {ordinals.map((ord, i) => {
                    const lvl = String(i + 1);
                    const max = slotMax[lvl] ?? 0;
                    const used = slotUsed[lvl] ?? 0;
                    if (max === 0) return null;
                    return (
                      <div key={lvl} className="slot-lvl">
                        <div className="slot-ord">{ord}</div>
                        <div className="slot-circles">
                          {Array.from({ length: max }).map((_, ci) => (
                            <span key={ci} className={`sc${ci < used ? ' used' : ''}`} />
                          ))}
                        </div>
                        <div className="slot-count">{used}/{max}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}

            {([
              { key: 'spells_cantrips', label: 'Cantrips' },
              { key: 'spells_1', label: '1st Level' },
              { key: 'spells_2', label: '2nd Level' },
              { key: 'spells_3', label: '3rd Level' },
              { key: 'spells_4', label: '4th Level' },
              { key: 'spells_5', label: '5th Level' },
              { key: 'spells_6', label: '6th Level' },
              { key: 'spells_7', label: '7th Level' },
              { key: 'spells_8', label: '8th Level' },
              { key: 'spells_9', label: '9th Level' },
            ] as Array<{ key: keyof CharacterSheet; label: string }>).map(({ key, label }) => {
              const content = sheet[key] as string | null;
              if (!content?.trim()) return null;
              return (
                <div key={String(key)} style={{ marginBottom: 8 }}>
                  <div className="stitle">{label}</div>
                  <div className="tbox">{content}</div>
                </div>
              );
            })}
          </div>
        ) : null}
    </>
  );
}
