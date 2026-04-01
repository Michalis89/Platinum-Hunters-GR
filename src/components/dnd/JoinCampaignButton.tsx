'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

type Props = {
  campaignId: string;
  token: string;
};

type JoinResponse = {
  data?: {
    id: string;
  };
  error?: string;
};

export function JoinCampaignButton({ campaignId, token }: Props) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    try {
      setJoining(true);
      const response = await fetch(`/api/dnd/campaigns/${campaignId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const payload = (await response.json()) as JoinResponse;
      if (!response.ok) {
        throw new Error(payload.error ?? 'Unable to join campaign');
      }

      toast.success('Joined campaign');
      router.push(`/dnd/campaigns/${campaignId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to join campaign';
      toast.error(message);
    } finally {
      setJoining(false);
    }
  };

  return (
    <Button type="button" onClick={handleJoin} disabled={joining} className="w-full sm:w-auto">
      {joining ? 'Joining...' : 'Join Campaign'}
    </Button>
  );
}
