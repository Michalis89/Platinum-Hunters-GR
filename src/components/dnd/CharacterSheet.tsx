'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Minus, Plus, Printer, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CharacterSheet as CharacterSheetType, WeaponEntry } from '@/lib/dnd/types';
import { Open5eCombobox } from '@/components/dnd/Open5eCombobox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';

type Props = {
  campaignId: string;
  sheetId: string;
  onDeleted?: () => void;
};

type ResponsePayload = {
  data?: CharacterSheetType | null;
  error?: string;
};

// ─── Skills ──────────────────────────────────────────────────────────────────
type SkillAbility = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
const SKILLS: Array<{ key: string; label: string; ability: SkillAbility }> = [
  { key: 'acrobatics', label: 'Acrobatics', ability: 'dex' },
  { key: 'animal_handling', label: 'Animal Handling', ability: 'wis' },
  { key: 'arcana', label: 'Arcana', ability: 'int' },
  { key: 'athletics', label: 'Athletics', ability: 'str' },
  { key: 'deception', label: 'Deception', ability: 'cha' },
  { key: 'history', label: 'History', ability: 'int' },
  { key: 'insight', label: 'Insight', ability: 'wis' },
  { key: 'intimidation', label: 'Intimidation', ability: 'cha' },
  { key: 'investigation', label: 'Investigation', ability: 'int' },
  { key: 'medicine', label: 'Medicine', ability: 'wis' },
  { key: 'nature', label: 'Nature', ability: 'int' },
  { key: 'perception', label: 'Perception', ability: 'wis' },
  { key: 'performance', label: 'Performance', ability: 'cha' },
  { key: 'persuasion', label: 'Persuasion', ability: 'cha' },
  { key: 'religion', label: 'Religion', ability: 'int' },
  { key: 'sleight_of_hand', label: 'Sleight of Hand', ability: 'dex' },
  { key: 'stealth', label: 'Stealth', ability: 'dex' },
  { key: 'survival', label: 'Survival', ability: 'wis' },
];

// ─── Saving throws ────────────────────────────────────────────────────────────
const SAVE_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
type SaveKey = (typeof SAVE_KEYS)[number];
const SAVE_LABELS: Record<SaveKey, string> = {
  str: 'Strength', dex: 'Dexterity', con: 'Constitution',
  int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma',
};

// ─── Form state ───────────────────────────────────────────────────────────────
type CharacterSheetFormState = {
  character_name: string;
  race: string;
  class: string;
  subclass: string;
  level: number;
  background: string;
  alignment: string;
  languages: string;
  personality_traits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  appearance: string;
  backstory: string;
  str: number | null;
  dex: number | null;
  con: number | null;
  int_stat: number | null;
  wis: number | null;
  cha: number | null;
  saving_throw_profs: string;
  skills_profs: string;
  skills_expertise: string;
  hp_max: number | null;
  hp_current: number | null;
  hp_temp: number;
  ac: number | null;
  speed: number;
  initiative_bonus: number;
  initiative_override: boolean;
  proficiency_bonus: number;
  proficiency_override: boolean;
  inspiration: boolean;
  death_save_successes: number;
  death_save_failures: number;
  hit_dice_type: string;
  hit_dice_spent: number;
  weapons_data: WeaponEntry[];
  extra_resource_name: string;
  extra_resource_max: number | null;
  extra_resource_used: number;
  spellcasting_ability: string;
  spell_save_dc: number | null;
  spell_save_dc_override: boolean;
  spell_attack_bonus: number | null;
  spell_attack_override: boolean;
  spell_slots_max: Record<string, number>;
  spell_slots_used: Record<string, number>;
  spells_cantrips: string;
  spells_1: string;
  spells_2: string;
  spells_3: string;
  spells_4: string;
  spells_5: string;
  spells_6: string;
  spells_7: string;
  spells_8: string;
  spells_9: string;
  features: string;
  equipment: string;
  notes: string;
  visible_to_dm: boolean;
};

const ABILITY_FIELDS: Array<{ key: keyof CharacterSheetFormState; label: string }> = [
  { key: 'str', label: 'STR' },
  { key: 'dex', label: 'DEX' },
  { key: 'con', label: 'CON' },
  { key: 'int_stat', label: 'INT' },
  { key: 'wis', label: 'WIS' },
  { key: 'cha', label: 'CHA' },
];

const HIT_DICE_OPTIONS = ['d4', 'd6', 'd8', 'd10', 'd12'];

const SPELLCASTING_ABILITIES = [
  { value: '', label: '— None —' },
  { value: 'str', label: 'Strength' },
  { value: 'dex', label: 'Dexterity' },
  { value: 'con', label: 'Constitution' },
  { value: 'int', label: 'Intelligence' },
  { value: 'wis', label: 'Wisdom' },
  { value: 'cha', label: 'Charisma' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toInputNumber(value: number | null): string {
  return value === null ? '' : String(value);
}

function parseNullableInt(value: string): number | null {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return null;
  return Math.trunc(parsed);
}

function formatMod(stat: number | null): string {
  const m = modifier(stat);
  return m >= 0 ? `+${m}` : `${m}`;
}

function modifier(stat: number | null): number {
  if (stat === null) return 0;
  return Math.floor((stat - 10) / 2);
}

function autoProficiencyBonus(level: number): number {
  return Math.floor((level - 1) / 4) + 2;
}

function hasProf(profs: string, key: string): boolean {
  return profs.split(',').filter(Boolean).includes(key);
}

function toggleProf(profs: string, key: string): string {
  const parts = profs ? profs.split(',').filter(Boolean) : [];
  if (parts.includes(key)) return parts.filter(k => k !== key).join(',');
  return [...parts, key].join(',');
}

function getStatForAbility(form: CharacterSheetFormState, ability: SkillAbility): number | null {
  if (ability === 'int') return form.int_stat;
  return form[ability] as number | null;
}

function fromSheet(sheet: CharacterSheetType): CharacterSheetFormState {
  const autoProf = autoProficiencyBonus(sheet.level);
  const autoDex = modifier(sheet.dex);
  return {
    character_name: sheet.character_name,
    race: sheet.race ?? '',
    class: sheet.class ?? '',
    subclass: sheet.subclass ?? '',
    level: sheet.level,
    background: sheet.background ?? '',
    alignment: sheet.alignment ?? '',
    languages: sheet.languages ?? '',
    personality_traits: sheet.personality_traits ?? '',
    ideals: sheet.ideals ?? '',
    bonds: sheet.bonds ?? '',
    flaws: sheet.flaws ?? '',
    appearance: sheet.appearance ?? '',
    backstory: sheet.backstory ?? '',
    str: sheet.str,
    dex: sheet.dex,
    con: sheet.con,
    int_stat: sheet.int_stat,
    wis: sheet.wis,
    cha: sheet.cha,
    saving_throw_profs: sheet.saving_throw_profs ?? '',
    skills_profs: sheet.skills_profs ?? '',
    skills_expertise: sheet.skills_expertise ?? '',
    hp_max: sheet.hp_max,
    hp_current: sheet.hp_current,
    hp_temp: sheet.hp_temp,
    ac: sheet.ac,
    speed: sheet.speed,
    initiative_bonus: sheet.initiative_bonus,
    initiative_override: sheet.initiative_bonus !== autoDex,
    proficiency_bonus: sheet.proficiency_bonus,
    proficiency_override: sheet.proficiency_bonus !== autoProf,
    inspiration: sheet.inspiration ?? false,
    death_save_successes: sheet.death_save_successes ?? 0,
    death_save_failures: sheet.death_save_failures ?? 0,
    hit_dice_type: sheet.hit_dice_type ?? 'd8',
    hit_dice_spent: sheet.hit_dice_spent ?? 0,
    weapons_data: Array.isArray(sheet.weapons_data) ? sheet.weapons_data : [],
    extra_resource_name: sheet.extra_resource_name ?? '',
    extra_resource_max: sheet.extra_resource_max ?? null,
    extra_resource_used: sheet.extra_resource_used ?? 0,
    spellcasting_ability: sheet.spellcasting_ability ?? '',
    spell_save_dc: sheet.spell_save_dc ?? null,
    spell_save_dc_override: sheet.spell_save_dc !== null,
    spell_attack_bonus: sheet.spell_attack_bonus ?? null,
    spell_attack_override: sheet.spell_attack_bonus !== null,
    spell_slots_max: (sheet.spell_slots_max as Record<string, number>) ?? {},
    spell_slots_used: (sheet.spell_slots_used as Record<string, number>) ?? {},
    spells_cantrips: sheet.spells_cantrips ?? '',
    spells_1: sheet.spells_1 ?? '',
    spells_2: sheet.spells_2 ?? '',
    spells_3: sheet.spells_3 ?? '',
    spells_4: sheet.spells_4 ?? '',
    spells_5: sheet.spells_5 ?? '',
    spells_6: sheet.spells_6 ?? '',
    spells_7: sheet.spells_7 ?? '',
    spells_8: sheet.spells_8 ?? '',
    spells_9: sheet.spells_9 ?? '',
    features: sheet.features ?? '',
    equipment: sheet.equipment ?? '',
    notes: sheet.notes ?? '',
    visible_to_dm: sheet.visible_to_dm,
  };
}

function newWeapon(): WeaponEntry {
  return { name: '', attack_bonus: '', damage: '', damage_type: '', range: '', notes: '' };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function DeathSaveCircles({
  count,
  max,
  color,
  onToggle,
}: {
  count: number;
  max: number;
  color: string;
  onToggle: (idx: number) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: max }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onToggle(i)}
          className={`h-5 w-5 rounded-full border-2 transition-colors ${
            i < count
              ? `${color} border-transparent`
              : 'border-muted-foreground bg-transparent'
          }`}
        />
      ))}
    </div>
  );
}

function SpellSlotRow({
  level,
  labelStr,
  maxVal,
  usedVal,
  onMaxChange,
  onUsedChange,
}: {
  level: string;
  labelStr: string;
  maxVal: number;
  usedVal: number;
  onMaxChange: (v: number) => void;
  onUsedChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-sm font-medium">{labelStr}</span>
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: maxVal }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onUsedChange(i < usedVal ? i : i + 1)}
            className={`h-5 w-5 rounded-full border-2 transition-colors ${
              i < usedVal
                ? 'border-transparent bg-primary'
                : 'border-muted-foreground bg-transparent'
            }`}
          />
        ))}
      </div>
      <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
        <span>{usedVal}/{maxVal}</span>
        <button
          type="button"
          className="rounded px-1 hover:text-foreground"
          onClick={() => onMaxChange(Math.max(0, maxVal - 1))}
        >
          −
        </button>
        <button
          type="button"
          className="rounded px-1 hover:text-foreground"
          onClick={() => onMaxChange(maxVal + 1)}
        >
          +
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function CharacterSheet({ campaignId, sheetId, onDeleted }: Props) {
  const [form, setForm] = useState<CharacterSheetFormState>({
    character_name: '', race: '', class: '', subclass: '', level: 1,
    background: '', alignment: '', languages: '', personality_traits: '',
    ideals: '', bonds: '', flaws: '', appearance: '', backstory: '',
    str: null, dex: null, con: null, int_stat: null, wis: null, cha: null,
    saving_throw_profs: '', skills_profs: '', skills_expertise: '',
    hp_max: null, hp_current: null, hp_temp: 0, ac: null, speed: 30,
    initiative_bonus: 0, initiative_override: false,
    proficiency_bonus: 2, proficiency_override: false,
    inspiration: false, death_save_successes: 0, death_save_failures: 0,
    hit_dice_type: 'd8', hit_dice_spent: 0, weapons_data: [],
    extra_resource_name: '', extra_resource_max: null, extra_resource_used: 0,
    spellcasting_ability: '', spell_save_dc: null, spell_save_dc_override: false,
    spell_attack_bonus: null, spell_attack_override: false,
    spell_slots_max: {}, spell_slots_used: {},
    spells_cantrips: '', spells_1: '', spells_2: '', spells_3: '',
    spells_4: '', spells_5: '', spells_6: '', spells_7: '', spells_8: '', spells_9: '',
    features: '', equipment: '', notes: '', visible_to_dm: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/dnd/campaigns/${campaignId}/character-sheet/${sheetId}`);
        const payload = (await res.json()) as ResponsePayload;
        if (!res.ok) throw new Error(payload.error ?? 'Failed to load');
        if (payload.data) setForm(fromSheet(payload.data));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load character sheet');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [campaignId, sheetId]);

  // Auto-calculated values
  const autoProf = useMemo(() => autoProficiencyBonus(form.level), [form.level]);
  const autoInit = useMemo(() => modifier(form.dex), [form.dex]);
  const effectiveProf = form.proficiency_override ? form.proficiency_bonus : autoProf;
  const effectiveInit = form.initiative_override ? form.initiative_bonus : autoInit;

  const spellAbilityMod = useMemo(() => {
    if (!form.spellcasting_ability) return 0;
    const stat = getStatForAbility(form, form.spellcasting_ability as SkillAbility);
    return modifier(stat);
  }, [form]);

  const autoSpellDc = 8 + effectiveProf + spellAbilityMod;
  const autoSpellAtk = effectiveProf + spellAbilityMod;
  const effectiveSpellDc = form.spell_save_dc_override ? (form.spell_save_dc ?? autoSpellDc) : autoSpellDc;
  const effectiveSpellAtk = form.spell_attack_override ? (form.spell_attack_bonus ?? autoSpellAtk) : autoSpellAtk;

  const set = <K extends keyof CharacterSheetFormState>(key: K, value: CharacterSheetFormState[K]) => {
    setForm(cur => ({ ...cur, [key]: value }));
  };

  const updateHp = (delta: number) => {
    setForm(cur => {
      const next = (cur.hp_current ?? 0) + delta;
      const bounded = Math.max(0, cur.hp_max === null ? next : Math.min(next, cur.hp_max));
      return { ...cur, hp_current: bounded };
    });
  };

  const updateWeapon = (idx: number, field: keyof WeaponEntry, value: string) => {
    setForm(cur => {
      const updated = cur.weapons_data.map((w, i) => i === idx ? { ...w, [field]: value } : w);
      return { ...cur, weapons_data: updated };
    });
  };

  const addWeapon = () => setForm(cur => ({ ...cur, weapons_data: [...cur.weapons_data, newWeapon()] }));
  const removeWeapon = (idx: number) => setForm(cur => ({
    ...cur, weapons_data: cur.weapons_data.filter((_, i) => i !== idx),
  }));

  const setSlotMax = (level: string, val: number) => {
    setForm(cur => ({
      ...cur,
      spell_slots_max: { ...cur.spell_slots_max, [level]: Math.max(0, val) },
      spell_slots_used: {
        ...cur.spell_slots_used,
        [level]: Math.min(cur.spell_slots_used[level] ?? 0, Math.max(0, val)),
      },
    }));
  };

  const setSlotUsed = (level: string, val: number) => {
    const max = form.spell_slots_max[level] ?? 0;
    setForm(cur => ({ ...cur, spell_slots_used: { ...cur.spell_slots_used, [level]: Math.min(val, max) } }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.character_name.trim()) { toast.error('Character name is required'); return; }

    try {
      setSaving(true);
      const body = {
        character_name: form.character_name.trim(),
        race: form.race.trim() || null,
        class: form.class.trim() || null,
        subclass: form.subclass.trim() || null,
        level: form.level,
        background: form.background.trim() || null,
        alignment: form.alignment.trim() || null,
        languages: form.languages.trim() || null,
        personality_traits: form.personality_traits.trim() || null,
        ideals: form.ideals.trim() || null,
        bonds: form.bonds.trim() || null,
        flaws: form.flaws.trim() || null,
        appearance: form.appearance.trim() || null,
        backstory: form.backstory.trim() || null,
        str: form.str, dex: form.dex, con: form.con, int_stat: form.int_stat,
        wis: form.wis, cha: form.cha,
        saving_throw_profs: form.saving_throw_profs,
        skills_profs: form.skills_profs,
        skills_expertise: form.skills_expertise,
        hp_max: form.hp_max, hp_current: form.hp_current, hp_temp: form.hp_temp,
        ac: form.ac, speed: form.speed,
        initiative_bonus: effectiveInit,
        proficiency_bonus: effectiveProf,
        inspiration: form.inspiration,
        death_save_successes: form.death_save_successes,
        death_save_failures: form.death_save_failures,
        hit_dice_type: form.hit_dice_type,
        hit_dice_spent: form.hit_dice_spent,
        weapons_data: form.weapons_data,
        extra_resource_name: form.extra_resource_name.trim() || null,
        extra_resource_max: form.extra_resource_max,
        extra_resource_used: form.extra_resource_used,
        spellcasting_ability: form.spellcasting_ability || null,
        spell_save_dc: form.spell_save_dc_override ? effectiveSpellDc : null,
        spell_attack_bonus: form.spell_attack_override ? effectiveSpellAtk : null,
        spell_slots_max: form.spell_slots_max,
        spell_slots_used: form.spell_slots_used,
        spells_cantrips: form.spells_cantrips.trim() || null,
        spells_1: form.spells_1.trim() || null,
        spells_2: form.spells_2.trim() || null,
        spells_3: form.spells_3.trim() || null,
        spells_4: form.spells_4.trim() || null,
        spells_5: form.spells_5.trim() || null,
        spells_6: form.spells_6.trim() || null,
        spells_7: form.spells_7.trim() || null,
        spells_8: form.spells_8.trim() || null,
        spells_9: form.spells_9.trim() || null,
        features: form.features.trim() || null,
        equipment: form.equipment.trim() || null,
        notes: form.notes.trim() || null,
        visible_to_dm: form.visible_to_dm,
      };

      const res = await fetch(`/api/dnd/campaigns/${campaignId}/character-sheet/${sheetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const payload = (await res.json()) as ResponsePayload;
      if (!res.ok || !payload.data) throw new Error(payload.error ?? 'Failed to save');

      setForm(fromSheet(payload.data));
      toast.success('Character sheet saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save character sheet');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this character sheet? This cannot be undone.')) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/dnd/campaigns/${campaignId}/character-sheet/${sheetId}`, { method: 'DELETE' });
      if (!res.ok) {
        const p = (await res.json()) as ResponsePayload;
        throw new Error(p.error ?? 'Failed to delete');
      }
      toast.success('Character sheet deleted');
      onDeleted?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete character sheet');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs defaultValue="identity" className="space-y-4">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="h-auto w-max min-w-full justify-start gap-1">
            <TabsTrigger value="identity">Identity</TabsTrigger>
            <TabsTrigger value="abilities">Abilities</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="combat">Combat</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="spells">Spells</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Identity ── */}
        <TabsContent value="identity" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Identity</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Character Name"
                value={form.character_name}
                onChange={e => set('character_name', e.target.value)}
                className="h-12"
                required
              />
              <Input
                label="Level"
                type="number"
                min={1}
                max={20}
                value={String(form.level)}
                onChange={e => set('level', Math.min(20, Math.max(1, Math.trunc(Number(e.target.value || '1')))))}
                className="h-12"
              />
              <Open5eCombobox label="Race" value={form.race} onChange={v => set('race', v)} category="races" />
              <Open5eCombobox label="Class" value={form.class} onChange={v => set('class', v)} category="classes" />
              <Input
                label="Subclass"
                value={form.subclass}
                onChange={e => set('subclass', e.target.value)}
                className="h-12"
              />
              <Input
                label="Background"
                value={form.background}
                onChange={e => set('background', e.target.value)}
                className="h-12"
              />
              <Input
                label="Alignment"
                value={form.alignment}
                onChange={e => set('alignment', e.target.value)}
                className="h-12"
              />
              <Input
                label="Languages"
                value={form.languages}
                onChange={e => set('languages', e.target.value)}
                className="h-12"
                placeholder="Common, Elvish…"
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Personality</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block text-sm">Personality Traits</Label>
                <Textarea
                  rows={3}
                  value={form.personality_traits}
                  onChange={e => set('personality_traits', e.target.value)}
                  maxLength={2000}
                />
              </div>
              <div>
                <Label className="mb-1 block text-sm">Ideals</Label>
                <Textarea
                  rows={3}
                  value={form.ideals}
                  onChange={e => set('ideals', e.target.value)}
                  maxLength={2000}
                />
              </div>
              <div>
                <Label className="mb-1 block text-sm">Bonds</Label>
                <Textarea
                  rows={3}
                  value={form.bonds}
                  onChange={e => set('bonds', e.target.value)}
                  maxLength={2000}
                />
              </div>
              <div>
                <Label className="mb-1 block text-sm">Flaws</Label>
                <Textarea
                  rows={3}
                  value={form.flaws}
                  onChange={e => set('flaws', e.target.value)}
                  maxLength={2000}
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-1 block text-sm">Appearance</Label>
                <Textarea
                  rows={2}
                  value={form.appearance}
                  onChange={e => set('appearance', e.target.value)}
                  maxLength={2000}
                  placeholder="Height, weight, hair, eyes…"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-1 block text-sm">Backstory</Label>
                <Textarea
                  rows={6}
                  value={form.backstory}
                  onChange={e => set('backstory', e.target.value)}
                  maxLength={10000}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Abilities & Saving Throws ── */}
        <TabsContent value="abilities" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Ability Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
                {ABILITY_FIELDS.map(field => {
                  const stat = form[field.key] as number | null;
                  return (
                    <div key={field.label} className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                      <Label className="text-xs font-bold uppercase tracking-wider">{field.label}</Label>
                      <Input
                        type="number"
                        min={1}
                        max={30}
                        value={toInputNumber(stat)}
                        onChange={e => set(field.key, parseNullableInt(e.target.value) as never)}
                        className="mt-2 h-12 text-center text-lg font-bold"
                      />
                      <p className="mt-1.5 text-sm font-semibold text-primary">{formatMod(stat)}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Saving Throws</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SAVE_KEYS.map(key => {
                  const statKey = key === 'int' ? 'int_stat' : (key as keyof CharacterSheetFormState);
                  const stat = form[statKey] as number | null;
                  const mod = modifier(stat);
                  const prof = hasProf(form.saving_throw_profs, key);
                  const total = mod + (prof ? effectiveProf : 0);
                  return (
                    <div key={key} className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
                      <Checkbox
                        id={`save-${key}`}
                        checked={prof}
                        onCheckedChange={() => set('saving_throw_profs', toggleProf(form.saving_throw_profs, key))}
                      />
                      <label htmlFor={`save-${key}`} className="flex-1 cursor-pointer text-sm font-medium">
                        {SAVE_LABELS[key]}
                      </label>
                      <span className="w-8 text-right text-sm font-bold tabular-nums text-primary">
                        {total >= 0 ? `+${total}` : total}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Skills ── */}
        <TabsContent value="skills">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="inline-block h-4 w-4 rounded-sm border border-border" /> Proficient</span>
                <span className="flex items-center gap-1.5"><span className="inline-block h-4 w-4 rounded-sm border border-border" /> Expertise (×2)</span>
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {SKILLS.map(skill => {
                  const stat = getStatForAbility(form, skill.ability);
                  const mod = modifier(stat);
                  const prof = hasProf(form.skills_profs, skill.key);
                  const exp = hasProf(form.skills_expertise, skill.key);
                  const total = mod + (exp ? effectiveProf * 2 : prof ? effectiveProf : 0);
                  return (
                    <div key={skill.key} className="flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-1.5">
                      <Checkbox
                        id={`prof-${skill.key}`}
                        checked={prof}
                        onCheckedChange={() => {
                          const next = toggleProf(form.skills_profs, skill.key);
                          set('skills_profs', next);
                          if (!next.split(',').filter(Boolean).includes(skill.key)) {
                            set('skills_expertise', toggleProf(form.skills_expertise, skill.key).split(',').filter(k => k !== skill.key).join(','));
                          }
                        }}
                      />
                      <Checkbox
                        id={`exp-${skill.key}`}
                        checked={exp}
                        disabled={!prof}
                        onCheckedChange={() => set('skills_expertise', toggleProf(form.skills_expertise, skill.key))}
                      />
                      <label htmlFor={`prof-${skill.key}`} className="flex-1 cursor-pointer text-sm">
                        {skill.label}
                        <span className="ml-1 text-xs text-muted-foreground uppercase">({skill.ability})</span>
                      </label>
                      <span className="w-8 text-right text-sm font-bold tabular-nums text-primary">
                        {total >= 0 ? `+${total}` : total}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Combat ── */}
        <TabsContent value="combat" className="space-y-4">
          {/* HP + Inspiration */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Hit Points</CardTitle>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <Switch
                    checked={form.inspiration}
                    onCheckedChange={v => set('inspiration', v)}
                  />
                  <span className={form.inspiration ? 'text-amber-500' : 'text-muted-foreground'}>
                    Inspired
                  </span>
                </label>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <Input label="HP Current" type="number" value={toInputNumber(form.hp_current)} onChange={e => set('hp_current', parseNullableInt(e.target.value))} className="h-12" />
                <Input label="HP Max" type="number" value={toInputNumber(form.hp_max)} onChange={e => set('hp_max', parseNullableInt(e.target.value))} className="h-12" />
                <Input label="Temp HP" type="number" value={String(form.hp_temp)} onChange={e => set('hp_temp', Math.max(0, Math.trunc(Number(e.target.value || '0'))))} className="h-12" />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => updateHp(-1)} icon={<Minus className="h-4 w-4" />}>Damage</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => updateHp(1)} icon={<Plus className="h-4 w-4" />}>Heal</Button>
              </div>
            </CardContent>
          </Card>

          {/* Death Saves */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Death Saves</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-6">
              <div>
                <p className="mb-1.5 text-xs font-medium text-emerald-600">Successes</p>
                <DeathSaveCircles
                  count={form.death_save_successes}
                  max={3}
                  color="bg-emerald-500"
                  onToggle={i => set('death_save_successes', i < form.death_save_successes ? i : i + 1)}
                />
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-red-500">Failures</p>
                <DeathSaveCircles
                  count={form.death_save_failures}
                  max={3}
                  color="bg-red-500"
                  onToggle={i => set('death_save_failures', i < form.death_save_failures ? i : i + 1)}
                />
              </div>
            </CardContent>
          </Card>

          {/* AC, Speed, Initiative, Prof */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Combat Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Input label="AC" type="number" value={toInputNumber(form.ac)} onChange={e => set('ac', parseNullableInt(e.target.value))} className="h-12" />
                <Input label="Speed (ft)" type="number" value={String(form.speed)} onChange={e => set('speed', Math.trunc(Number(e.target.value || '30')))} className="h-12" />

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Initiative</Label>
                    <button type="button" className="text-xs text-muted-foreground underline-offset-2 hover:underline" onClick={() => set('initiative_override', !form.initiative_override)}>
                      {form.initiative_override ? 'auto' : 'override'}
                    </button>
                  </div>
                  {form.initiative_override ? (
                    <Input type="number" value={String(form.initiative_bonus)} onChange={e => set('initiative_bonus', Math.trunc(Number(e.target.value || '0')))} className="h-12" />
                  ) : (
                    <div className="flex h-12 items-center rounded-md border border-border bg-muted/50 px-3 text-sm font-medium">
                      {effectiveInit >= 0 ? `+${effectiveInit}` : effectiveInit}
                      <span className="ml-2 text-xs text-muted-foreground">(DEX)</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Proficiency</Label>
                    <button type="button" className="text-xs text-muted-foreground underline-offset-2 hover:underline" onClick={() => set('proficiency_override', !form.proficiency_override)}>
                      {form.proficiency_override ? 'auto' : 'override'}
                    </button>
                  </div>
                  {form.proficiency_override ? (
                    <Input type="number" value={String(form.proficiency_bonus)} onChange={e => set('proficiency_bonus', Math.trunc(Number(e.target.value || '2')))} className="h-12" />
                  ) : (
                    <div className="flex h-12 items-center rounded-md border border-border bg-muted/50 px-3 text-sm font-medium">
                      {effectiveProf >= 0 ? `+${effectiveProf}` : effectiveProf}
                      <span className="ml-2 text-xs text-muted-foreground">(lvl {form.level})</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hit Dice */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Hit Dice</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-4">
              <div className="space-y-1">
                <Label className="text-sm">Type</Label>
                <select
                  value={form.hit_dice_type}
                  onChange={e => set('hit_dice_type', e.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {HIT_DICE_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Spent / Total</Label>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => set('hit_dice_spent', Math.max(0, form.hit_dice_spent - 1))} icon={<Minus className="h-3 w-3" />} />
                  <span className="min-w-[4rem] text-center text-sm font-medium">
                    {form.hit_dice_spent} / {form.level}
                  </span>
                  <Button type="button" variant="outline" size="sm" onClick={() => set('hit_dice_spent', Math.min(form.level, form.hit_dice_spent + 1))} icon={<Plus className="h-3 w-3" />} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weapons */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Weapons &amp; Attacks</CardTitle>
                <Button type="button" size="sm" variant="outline" onClick={addWeapon} icon={<Plus className="h-4 w-4" />}>
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {form.weapons_data.length === 0 ? (
                <p className="text-sm text-muted-foreground">No weapons added yet.</p>
              ) : (
                <div className="space-y-2">
                  {form.weapons_data.map((w, i) => (
                    <div key={i} className="grid gap-2 rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-6">
                      <Input placeholder="Name" value={w.name} onChange={e => updateWeapon(i, 'name', e.target.value)} className="h-9 sm:col-span-2" />
                      <Input placeholder="Atk Bonus" value={w.attack_bonus} onChange={e => updateWeapon(i, 'attack_bonus', e.target.value)} className="h-9" />
                      <Input placeholder="Damage" value={w.damage} onChange={e => updateWeapon(i, 'damage', e.target.value)} className="h-9" />
                      <Input placeholder="Type" value={w.damage_type} onChange={e => updateWeapon(i, 'damage_type', e.target.value)} className="h-9" />
                      <div className="flex gap-2">
                        <Input placeholder="Range" value={w.range} onChange={e => updateWeapon(i, 'range', e.target.value)} className="h-9 flex-1" />
                        <button type="button" onClick={() => removeWeapon(i)} className="shrink-0 rounded p-1.5 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <Input placeholder="Notes" value={w.notes} onChange={e => updateWeapon(i, 'notes', e.target.value)} className="h-9 sm:col-span-6" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Extra Resource */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Extra Resource</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                <Input
                  label="Resource Name"
                  placeholder="Sorcery Points, Ki…"
                  value={form.extra_resource_name}
                  onChange={e => set('extra_resource_name', e.target.value)}
                  className="h-12"
                />
                <Input
                  label="Max"
                  type="number"
                  value={toInputNumber(form.extra_resource_max)}
                  onChange={e => set('extra_resource_max', parseNullableInt(e.target.value))}
                  className="h-12"
                />
                <div className="space-y-1">
                  <Label className="text-sm">Used</Label>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => set('extra_resource_used', Math.max(0, form.extra_resource_used - 1))} icon={<Minus className="h-3 w-3" />} />
                    <span className="min-w-[3rem] text-center text-sm font-medium">
                      {form.extra_resource_used}{form.extra_resource_max !== null ? ` / ${form.extra_resource_max}` : ''}
                    </span>
                    <Button type="button" variant="outline" size="sm" onClick={() => set('extra_resource_used', form.extra_resource_max !== null ? Math.min(form.extra_resource_max, form.extra_resource_used + 1) : form.extra_resource_used + 1)} icon={<Plus className="h-3 w-3" />} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Features ── */}
        <TabsContent value="features">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Features &amp; Traits</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea rows={12} value={form.features} onChange={e => set('features', e.target.value)} maxLength={10000} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Equipment ── */}
        <TabsContent value="equipment">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Equipment &amp; Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea rows={12} value={form.equipment} onChange={e => set('equipment', e.target.value)} maxLength={10000} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Spells ── */}
        <TabsContent value="spells" className="space-y-4">
          {/* Spellcasting header */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Spellcasting</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-sm">Spellcasting Ability</Label>
                <select
                  value={form.spellcasting_ability}
                  onChange={e => set('spellcasting_ability', e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {SPELLCASTING_ABILITIES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Spell Save DC</Label>
                  <button type="button" className="text-xs text-muted-foreground underline-offset-2 hover:underline" onClick={() => set('spell_save_dc_override', !form.spell_save_dc_override)}>
                    {form.spell_save_dc_override ? 'auto' : 'override'}
                  </button>
                </div>
                {form.spell_save_dc_override ? (
                  <Input type="number" value={toInputNumber(form.spell_save_dc)} onChange={e => set('spell_save_dc', parseNullableInt(e.target.value))} className="h-10" />
                ) : (
                  <div className="flex h-10 items-center rounded-md border border-border bg-muted/50 px-3 text-sm font-medium">
                    {effectiveSpellDc}
                    {form.spellcasting_ability && <span className="ml-2 text-xs text-muted-foreground">8+prof+mod</span>}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Spell Attack Bonus</Label>
                  <button type="button" className="text-xs text-muted-foreground underline-offset-2 hover:underline" onClick={() => set('spell_attack_override', !form.spell_attack_override)}>
                    {form.spell_attack_override ? 'auto' : 'override'}
                  </button>
                </div>
                {form.spell_attack_override ? (
                  <Input type="number" value={toInputNumber(form.spell_attack_bonus)} onChange={e => set('spell_attack_bonus', parseNullableInt(e.target.value))} className="h-10" />
                ) : (
                  <div className="flex h-10 items-center rounded-md border border-border bg-muted/50 px-3 text-sm font-medium">
                    {effectiveSpellAtk >= 0 ? `+${effectiveSpellAtk}` : effectiveSpellAtk}
                    {form.spellcasting_ability && <span className="ml-2 text-xs text-muted-foreground">prof+mod</span>}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Spell Slots */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Spell Slots</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const).map(lvl => {
                const max = form.spell_slots_max[lvl] ?? 0;
                const used = form.spell_slots_used[lvl] ?? 0;
                const ordinals = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th'];
                return (
                  <SpellSlotRow
                    key={lvl}
                    level={lvl}
                    labelStr={ordinals[Number(lvl) - 1]}
                    maxVal={max}
                    usedVal={used}
                    onMaxChange={v => setSlotMax(lvl, v)}
                    onUsedChange={v => setSlotUsed(lvl, v)}
                  />
                );
              })}
            </CardContent>
          </Card>

          {/* Spell Lists */}
          {(
            [
              { field: 'spells_cantrips', label: 'Cantrips' },
              { field: 'spells_1', label: '1st Level' },
              { field: 'spells_2', label: '2nd Level' },
              { field: 'spells_3', label: '3rd Level' },
              { field: 'spells_4', label: '4th Level' },
              { field: 'spells_5', label: '5th Level' },
              { field: 'spells_6', label: '6th Level' },
              { field: 'spells_7', label: '7th Level' },
              { field: 'spells_8', label: '8th Level' },
              { field: 'spells_9', label: '9th Level' },
            ] as Array<{ field: keyof CharacterSheetFormState; label: string }>
          ).map(({ field, label }) => (
            <Card key={field} className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  rows={3}
                  value={form[field] as string}
                  onChange={e => set(field, e.target.value)}
                  maxLength={5000}
                  placeholder="One spell per line…"
                />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ── Notes ── */}
        <TabsContent value="notes">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea rows={12} value={form.notes} onChange={e => set('notes', e.target.value)} maxLength={10000} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Privacy ── */}
        <TabsContent value="privacy">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-border px-3 py-3">
                <Switch checked={form.visible_to_dm} onCheckedChange={v => set('visible_to_dm', v)} />
                <div>
                  <p className="text-sm font-medium">Share with DM</p>
                  <p className="text-xs text-muted-foreground">The DM can view this sheet when enabled.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.open(`/dnd/campaigns/${campaignId}/character-sheet/${sheetId}/print`, '_blank', 'noopener,noreferrer')}
            icon={<Printer className="h-4 w-4" />}
          >
            Print
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Delete Sheet'}
          </Button>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
