'use client';

import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type ProfileStatsInfoTooltipProps = {
  text: string;
};

export function ProfileStatsInfoTooltip({ text }: Readonly<ProfileStatsInfoTooltipProps>) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            aria-label="Calculation details"
            className="grid h-7 w-7 place-items-center rounded-full border border-border bg-card text-primary transition hover:border-primary hover:bg-primary/10"
          >
            <Info className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="center"
          sideOffset={8}
          className="z-[9999] w-[min(280px,80vw)] rounded-2xl border border-border bg-card p-3 text-xs leading-relaxed text-foreground shadow-md"
        >
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
