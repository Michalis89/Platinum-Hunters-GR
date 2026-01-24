import { ReactNode } from 'react';
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
    <section className={cn('relative px-4 md:px-6', sectionClassName)}>
      <div className="mx-auto max-w-4xl text-center">
        {eyebrow ? (
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-[var(--hb-primary-strong)]">
            {eyebrow}
          </p>
        ) : null}

        <h1 className={cn('font-extrabold leading-tight', titleClassName)}>{title}</h1>

        {subtitle ? (
          <p
            className={cn(
              'mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-[var(--hb-muted)] md:text-xl',
              subtitleClassName,
            )}
          >
            {subtitle}
          </p>
        ) : null}

        {actions ? <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">{actions}</div> : null}

        {badges ? (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-[var(--hb-muted)]">
            {badges}
          </div>
        ) : null}
      </div>
    </section>
  );
}
