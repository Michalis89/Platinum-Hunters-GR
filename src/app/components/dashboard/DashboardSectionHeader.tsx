import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type DashboardSectionHeaderProps = {
  eyebrow: ReactNode;
  title?: ReactNode;
  rightSlot?: ReactNode;
  className?: string;
};

export default function DashboardSectionHeader({
  eyebrow,
  title,
  rightSlot,
  className,
}: DashboardSectionHeaderProps) {
  const hasMainRow = Boolean(title || rightSlot);

  return (
    <div className={cn('space-y-1.5', className)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
        {eyebrow}
      </p>

      {hasMainRow ? (
        <div className="flex flex-wrap items-start justify-between gap-2.5">
          {title ? (
            <p className="text-balance text-sm font-semibold leading-tight text-foreground sm:text-base">
              {title}
            </p>
          ) : null}
          {rightSlot ? <div className="shrink-0 pt-0.5">{rightSlot}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
