'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, PlusCircle, Scroll, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CharacterSheet } from '@/lib/dnd/types';
import { CharacterSheet as CharacterSheetForm } from '@/components/dnd/CharacterSheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';

type Props = {
  campaignId: string;
};

type ListPayload = {
  data?: CharacterSheet[];
  error?: string;
};

type CreatePayload = {
  data?: CharacterSheet;
  error?: string;
};

export function CharacterSheetManager({ campaignId }: Props) {
  const [sheets, setSheets] = useState<CharacterSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);

  const loadSheets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dnd/campaigns/${campaignId}/character-sheet`);
      const payload = (await response.json()) as ListPayload;
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to load character sheets');
      }

      setSheets(payload.data ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load sheets';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSheets();
  }, [campaignId]);

  const handleCreate = async () => {
    try {
      setCreating(true);
      const response = await fetch(`/api/dnd/campaigns/${campaignId}/character-sheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character_name: 'New Character',
          level: 1,
          speed: 30,
          initiative_bonus: 0,
          proficiency_bonus: 2,
          saving_throw_profs: '',
          hp_temp: 0,
          visible_to_dm: true,
        }),
      });

      const payload = (await response.json()) as CreatePayload;
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to create character sheet');
      }

      setSheets(prev => [...prev, payload.data!]);
      setActiveSheetId(payload.data.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create sheet';
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleted = (sheetId: string) => {
    setSheets(prev => prev.filter(s => s.id !== sheetId));
    setActiveSheetId(null);
  };

  // Editing a specific sheet
  if (activeSheetId) {
    const sheet = sheets.find(s => s.id === activeSheetId);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setActiveSheetId(null);
              void loadSheets();
            }}
            icon={<ArrowLeft className="h-4 w-4" />}
          >
            All Sheets
          </Button>
          {sheet ? (
            <span className="text-sm font-semibold text-foreground">{sheet.character_name}</span>
          ) : null}
        </div>
        <CharacterSheetForm
          campaignId={campaignId}
          sheetId={activeSheetId}
          onDeleted={() => handleDeleted(activeSheetId)}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Your Character Sheets</h3>
        <Button
          type="button"
          size="sm"
          onClick={handleCreate}
          disabled={creating}
          icon={<PlusCircle className="h-4 w-4" />}
        >
          {creating ? 'Creating...' : 'New Sheet'}
        </Button>
      </div>

      {sheets.length === 0 ? (
        <EmptyState
          size="sm"
          icon={<Scroll className="h-5 w-5" />}
          title="No character sheets yet"
          description="Create your first character sheet for this campaign."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {sheets.map(sheet => (
            <Card key={sheet.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{sheet.character_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Level {sheet.level} {sheet.class ?? 'Adventurer'}
                      {sheet.race ? ` · ${sheet.race}` : ''}
                    </p>
                    {sheet.visible_to_dm ? null : (
                      <p className="mt-1 text-xs text-amber-500">Hidden from DM</p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="ml-2 shrink-0 rounded-md p-1 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      if (confirm(`Delete "${sheet.character_name}"? This cannot be undone.`)) {
                        fetch(`/api/dnd/campaigns/${campaignId}/character-sheet/${sheet.id}`, {
                          method: 'DELETE',
                        })
                          .then(r => {
                            if (r.ok) {
                              setSheets(prev => prev.filter(s => s.id !== sheet.id));
                              toast.success('Sheet deleted');
                            } else {
                              toast.error('Failed to delete sheet');
                            }
                          })
                          .catch(() => toast.error('Failed to delete sheet'));
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  className="mt-3 w-full rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  onClick={() => setActiveSheetId(sheet.id)}
                >
                  Edit Sheet
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
