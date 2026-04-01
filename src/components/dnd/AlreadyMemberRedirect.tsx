'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type Props = {
  campaignId: string;
};

export function AlreadyMemberRedirect({ campaignId }: Props) {
  const router = useRouter();

  useEffect(() => {
    toast.info('Already a member');
    router.replace(`/dnd/campaigns/${campaignId}`);
  }, [campaignId, router]);

  return null;
}
