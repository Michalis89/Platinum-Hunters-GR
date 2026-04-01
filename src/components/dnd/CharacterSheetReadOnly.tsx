'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { CharacterSheet } from '@/lib/dnd/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

type Props = {
  sheet: CharacterSheet;
  playerName?: string;
  /** Pass campaignId to enable DM notes editing (DM view only) */
  campaignId?: string;
  isDm?: boolean;
};

const ABILITY_FIELDS: Array<{ key: keyof CharacterSheet; label: string }> = [
  { key: 'str', label: 'STR' },
  { key: 'dex', label: 'DEX' },
  { key: 'con', label: 'CON' },
  { key: 'int_stat', label: 'INT' },
  { key: 'wis', label: 'WIS' },
  { key: 'cha', label: 'CHA' },
];

const SAVE_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
type SaveKey = (typeof SAVE_KEYS)[number];
const SAVE_LABELS: Record<SaveKey, string> = {
  str: 'STR',
  dex: 'DEX',
  con: 'CON',
  int: 'INT',
  wis: 'WIS',
  cha: 'CHA',
};

function formatModifier(statValue: number | null): string {
  if (statValue === null) return '+0';
  const modifier = Math.floor((statValue - 10) / 2);
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

function modifier(stat: number | null): number {
  if (stat === null) return 0;
  return Math.floor((stat - 10) / 2);
}

function hasSaveProf(profs: string, key: string): boolean {
  return (profs ?? '').split(',').includes(key);
}

function DmNotesEditor({
  campaignId,
  sheetId,
  initialNotes,
}: {
  campaignId: string;
  sheetId: string;
  initialNotes: string | null;
}) {
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(
        `/api/dnd/campaigns/${campaignId}/character-sheet/${sheetId}/dm-notes`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dm_notes: notes.trim() || null }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to save DM notes');
      }

      toast.success('DM notes saved');
    } catch {
      toast.error('Failed to save DM notes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-amber-500/30 bg-amber-50/10 shadow-sm dark:bg-amber-950/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-amber-600 dark:text-amber-400">
          <span>DM Notes</span>
          <Badge variant="secondary" className="text-xs">Private</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground">Only visible to you (DM). Never shown to the player.</p>
        <Textarea
          rows={4}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Secret backstory, plot hooks, DM reminders..."
          maxLength={10000}
          className="resize-none"
        />
        <div className="flex justify-end">
          <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Notes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function CharacterSheetReadOnly({ sheet, playerName, campaignId, isDm }: Props) {
  return (
    <div className="space-y-4">
      {playerName ? (
        <div className="flex items-center justify-between rounded-lg border border-border bg-card/70 px-3 py-2">
          <p className="text-sm text-muted-foreground">Player</p>
          <p className="text-sm font-semibold text-foreground">{playerName}</p>
        </div>
      ) : null}

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Identity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p><span className="text-muted-foreground">Name:</span> {sheet.character_name}</p>
          <p><span className="text-muted-foreground">Level:</span> {sheet.level}</p>
          <p><span className="text-muted-foreground">Race:</span> {sheet.race ?? '-'}</p>
          <p><span className="text-muted-foreground">Class:</span> {sheet.class ?? '-'}</p>
          <p><span className="text-muted-foreground">Subclass:</span> {sheet.subclass ?? '-'}</p>
          <p><span className="text-muted-foreground">Background:</span> {sheet.background ?? '-'}</p>
          <p><span className="text-muted-foreground">Alignment:</span> {sheet.alignment ?? '-'}</p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Ability Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {ABILITY_FIELDS.map(field => {
              const value = sheet[field.key] as number | null;
              return (
                <div
                  key={field.label}
                  className="rounded-lg border border-border bg-muted/30 p-3 text-center"
                >
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {field.label}
                  </p>
                  <p className="text-2xl font-bold tabular-nums">{value ?? '-'}</p>
                  <p className="text-sm font-medium text-primary">{formatModifier(value)}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Saving Throws */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Saving Throws</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {SAVE_KEYS.map(key => {
              const statKey = key === 'int' ? 'int_stat' : key;
              const stat = sheet[statKey as keyof CharacterSheet] as number | null;
              const mod = modifier(stat);
              const prof = hasSaveProf(sheet.saving_throw_profs ?? '', key);
              const total = mod + (prof ? sheet.proficiency_bonus : 0);
              const totalStr = total >= 0 ? `+${total}` : `${total}`;

              return (
                <div
                  key={key}
                  className="rounded-lg border border-border bg-muted/30 p-2 text-center"
                >
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {SAVE_LABELS[key]}
                  </p>
                  <p className="text-lg font-bold tabular-nums text-primary">{totalStr}</p>
                  {prof ? (
                    <p className="text-xs text-primary">prof</p>
                  ) : (
                    <p className="text-xs text-muted-foreground/50">·</p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Combat</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">HP:</span> {sheet.hp_current ?? '-'} /{' '}
            {sheet.hp_max ?? '-'}
          </p>
          <p><span className="text-muted-foreground">Temp HP:</span> {sheet.hp_temp}</p>
          <p><span className="text-muted-foreground">AC:</span> {sheet.ac ?? '-'}</p>
          <p><span className="text-muted-foreground">Speed:</span> {sheet.speed}</p>
          <p>
            <span className="text-muted-foreground">Initiative:</span>{' '}
            {sheet.initiative_bonus >= 0 ? `+${sheet.initiative_bonus}` : sheet.initiative_bonus}
          </p>
          <p>
            <span className="text-muted-foreground">Proficiency:</span>{' '}
            {sheet.proficiency_bonus >= 0 ? `+${sheet.proficiency_bonus}` : sheet.proficiency_bonus}
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Features</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{sheet.features?.trim() || '-'}</p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Equipment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{sheet.equipment?.trim() || '-'}</p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Spells</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{sheet.spells?.trim() || '-'}</p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{sheet.notes?.trim() || '-'}</p>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Badge variant={sheet.visible_to_dm ? 'default' : 'secondary'}>
          {sheet.visible_to_dm ? 'Visible to DM' : 'Hidden from DM'}
        </Badge>
      </div>

      {/* DM-only notes section */}
      {isDm && campaignId ? (
        <DmNotesEditor
          campaignId={campaignId}
          sheetId={sheet.id}
          initialNotes={sheet.dm_notes ?? null}
        />
      ) : null}
    </div>
  );
}
