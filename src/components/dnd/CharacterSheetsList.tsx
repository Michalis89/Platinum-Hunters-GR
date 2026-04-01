'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { CharacterSheet } from '@/lib/dnd/types';
import { CharacterSheetReadOnly } from '@/components/dnd/CharacterSheetReadOnly';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';

type Props = {
  campaignId: string;
};

type CharacterSheetWithPlayer = CharacterSheet & {
  player_name?: string;
};

type ResponsePayload = {
  data?: CharacterSheetWithPlayer[];
  error?: string;
};

export function CharacterSheetsList({ campaignId }: Props) {
  const [sheets, setSheets] = useState<CharacterSheetWithPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSheets = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/dnd/campaigns/${campaignId}/character-sheet?all=true`);
        const payload = (await response.json()) as ResponsePayload;
        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? 'Failed to load character sheets');
        }

        setSheets(payload.data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load character sheets';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadSheets();
  }, [campaignId]);

  const sorted = useMemo(
    () => [...sheets].sort((a, b) => a.character_name.localeCompare(b.character_name)),
    [sheets],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <EmptyState
        size="sm"
        icon={<Users className="h-5 w-5" />}
        title="No visible character sheets"
        description="Players can share sheets with you by enabling 'Share with DM'."
      />
    );
  }

  return (
    <Accordion type="single" collapsible className="space-y-3">
      {sorted.map(sheet => (
        <AccordionItem
          key={sheet.id}
          value={sheet.id}
          className="rounded-lg border border-border bg-card px-4"
        >
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex w-full items-center justify-between gap-3 text-left">
              <div>
                <p className="text-sm font-semibold text-foreground">{sheet.character_name}</p>
                <p className="text-xs text-muted-foreground">
                  {sheet.player_name ?? sheet.user_id} · Level {sheet.level}{' '}
                  {sheet.class ?? 'Adventurer'}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 pt-1">
            <CharacterSheetReadOnly
              sheet={sheet}
              playerName={sheet.player_name}
              campaignId={campaignId}
              isDm
            />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
