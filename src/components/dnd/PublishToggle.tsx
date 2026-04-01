'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';

type Props = {
  published: boolean;
  onToggle: (published: boolean) => Promise<void>;
  label?: string;
};

export function PublishToggle({ published, onToggle, label = 'Share with players' }: Props) {
  const [pending, setPending] = useState(false);

  const handleCheckedChange = async (nextValue: boolean) => {
    if (pending) {
      return;
    }

    try {
      setPending(true);
      await onToggle(nextValue);
    } catch {
      // Parent manages optimistic rollback and toast messaging.
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Switch checked={published} onCheckedChange={handleCheckedChange} disabled={pending} />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
