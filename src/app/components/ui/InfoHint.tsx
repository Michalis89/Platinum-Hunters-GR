import * as Tooltip from '@radix-ui/react-tooltip';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function InfoHint({ tip }: { tip: string }) {
  return (
    <Tooltip.Provider delayDuration={150}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <Button
            type="button"
            variant={'secondary'}
            aria-label="Πληροφορίες υπολογισμού"
            className="hover:bg-[var(--hb-primary-strong)]/10 grid h-7 w-7 place-items-center rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] text-[var(--hb-primary-strong)] transition hover:border-[var(--hb-primary-strong)]"
          >
            <Info className="h-4 w-4" />
          </Button>
        </Tooltip.Trigger>

        <Tooltip.Portal>
          <Tooltip.Content
            side="bottom"
            align="center"
            sideOffset={8}
            className="z-[9999] w-[min(280px,80vw)] rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-3 text-xs leading-relaxed text-[var(--hb-text)] shadow-[var(--hb-shadow-md)]"
          >
            {tip}
            <Tooltip.Arrow className="fill-[var(--hb-card)]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
