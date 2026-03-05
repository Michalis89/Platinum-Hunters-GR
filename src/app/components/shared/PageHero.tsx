import type { ReactNode } from 'react';
import { cn } from '@/utils/utils';

type PageHeroProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  badges?: ReactNode;
  sectionClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
};

export default function PageHero({
  eyebrow,
  title,
  subtitle,
  actions,
  badges,
  sectionClassName,
  titleClassName,
  subtitleClassName,
}: PageHeroProps) {
  return (
    <section className={cn('relative px-4 py-2 md:px-6', sectionClassName)}>
      <div className="mx-auto max-w-4xl text-center">
        {eyebrow ? (
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-foreground/80">{eyebrow}</p>
        ) : null}

        <h1 className={cn('font-extrabold leading-tight', titleClassName)}>{title}</h1>

        {subtitle ? (
          <p
            className={cn(
              'mx-auto mb-8 max-w-2xl text-base leading-relaxed text-muted-foreground md:mb-10 md:text-xl',
              subtitleClassName,
            )}
          >
            {subtitle}
          </p>
        ) : null}

        {actions ? (
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            {actions}
          </div>
        ) : null}

        {badges ? (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            {badges}
          </div>
        ) : null}
      </div>
    </section>
  );
}
