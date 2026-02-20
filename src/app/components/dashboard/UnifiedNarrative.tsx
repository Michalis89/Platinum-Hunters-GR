import { useMemo } from 'react';
import { buildNarrative } from '@/lib/dashboard/unified-narrative';
import type { UnifiedNarrativeInput } from '@/lib/dashboard/unified-narrative';

type UnifiedNarrativeProps = {
  data: UnifiedNarrativeInput;
};

export default function UnifiedNarrative({ data }: UnifiedNarrativeProps) {
  const message = useMemo(() => buildNarrative(data), [data]);

  if (!message) {
    return null;
  }

  return (
    <section aria-label="Unified activity narrative" className="mt-3 md:mt-4">
      <p className="text-sm leading-6 text-foreground/80 md:text-[15px]">{message}</p>
    </section>
  );
}
