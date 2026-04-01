'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { CampaignWithRole } from '@/lib/dnd/types';
import { Button } from '@/components/ui/button';

type Props = {
  campaigns: CampaignWithRole[];
};

type CreatePayload = {
  data?: { id: string };
  error?: string;
};

export function CreateCharacterButton({ campaigns }: Props) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const handleCreate = async (campaignId: string) => {
    try {
      setCreating(true);
      setShowPicker(false);

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
        throw new Error((payload as { error?: string }).error ?? 'Failed to create character');
      }

      toast.success('Character sheet created!');
      router.push(`/dnd/campaigns/${campaignId}?tab=character-sheet`);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create character';
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  // Single campaign → create directly
  if (campaigns.length === 1) {
    return (
      <Button
        type="button"
        size="sm"
        disabled={creating}
        onClick={() => handleCreate(campaigns[0]!.id)}
        icon={<PlusCircle className="h-4 w-4" />}
      >
        {creating ? 'Creating...' : 'New Character'}
      </Button>
    );
  }

  // Multiple campaigns → show picker
  return (
    <div className="relative">
      <Button
        type="button"
        size="sm"
        disabled={creating}
        onClick={() => setShowPicker(v => !v)}
        icon={<PlusCircle className="h-4 w-4" />}
      >
        {creating ? 'Creating...' : 'New Character'}
      </Button>

      {showPicker && (
        <>
          {/* backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPicker(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-1 min-w-48 rounded-lg border border-border bg-popover py-1 shadow-lg">
            <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
              Select a campaign
            </p>
            {campaigns.map(campaign => (
              <button
                key={campaign.id}
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                onClick={() => handleCreate(campaign.id)}
              >
                {campaign.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
