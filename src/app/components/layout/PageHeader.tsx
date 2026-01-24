import { ReactNode } from 'react';

type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  badges?: ReactNode;
  breadcrumbs?: ReactNode;
  icon?: ReactNode;
  aside?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
  contentClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  eyebrowClassName?: string;
  metaClassName?: string;
};

export function PageHeader({
  title,
  description,
  eyebrow,
  meta,
  actions,
  badges,
  breadcrumbs,
  icon,
  aside,
  align = 'center',
  className = '',
  contentClassName = '',
  titleClassName = '',
  descriptionClassName = '',
  eyebrowClassName = '',
  metaClassName = '',
}: Readonly<PageHeaderProps>) {
  const isCentered = align === 'center';
  const layoutClass = aside ? 'lg:grid lg:grid-cols-[1.2fr,1fr] lg:items-center' : '';
  const textAlign = isCentered ? 'text-center items-center' : 'text-left items-start';

  return (
    <section className={`relative ${className}`}>
      <div className={`grid gap-6 ${layoutClass}`}>
        <div className={`flex flex-col gap-3 ${textAlign} ${contentClassName}`}>
          {breadcrumbs ? <div className="text-xs text-[var(--hb-muted)]">{breadcrumbs}</div> : null}
          {eyebrow ? (
            <p
              className={`text-xs uppercase tracking-[0.3em] text-[var(--hb-primary-strong)] ${eyebrowClassName}`}
            >
              {eyebrow}
            </p>
          ) : null}

          <div className={`flex gap-3 ${isCentered ? 'flex-col items-center' : 'items-center'}`}>
            {icon ? <div className="shrink-0">{icon}</div> : null}
            <h1
              className={`text-3xl font-bold tracking-tight text-[var(--hb-headline)] md:text-4xl ${titleClassName}`}
            >
              {title}
            </h1>
          </div>

          {description ? (
            <p
              className={`text-sm text-[var(--hb-muted)] md:text-base ${descriptionClassName}`}
            >
              {description}
            </p>
          ) : null}

          {meta ? <div className={`text-sm text-[var(--hb-muted)] ${metaClassName}`}>{meta}</div> : null}

          {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
          {badges ? <div className="flex flex-wrap items-center gap-3">{badges}</div> : null}
        </div>

        {aside ? <div>{aside}</div> : null}
      </div>
    </section>
  );
}
