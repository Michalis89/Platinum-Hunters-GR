type AuthIntroHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  variant: 'desktop' | 'mobile';
};

export function AuthIntroHeading({
  eyebrow,
  title,
  description,
  variant,
}: AuthIntroHeadingProps) {
  if (variant === 'mobile') {
    return (
      <header className="text-center lg:hidden">
        <p className="apple-body-tracking text-xs font-semibold uppercase tracking-[0.22em] text-[var(--apple-system-blue)]">
          {eyebrow}
        </p>
        <h1 className="apple-title-tracking mt-2 text-2xl font-semibold text-[var(--apple-label)]">
          {title}
        </h1>
        <p className="apple-body-tracking mt-2 text-sm text-[var(--apple-secondary-label)]">
          {description}
        </p>
      </header>
    );
  }

  return (
    <div className="space-y-3">
      <p className="apple-body-tracking text-xs font-semibold uppercase tracking-[0.22em] text-[var(--apple-system-blue)]">
        {eyebrow}
      </p>
      <h1 className="apple-title-tracking text-4xl font-semibold leading-tight text-[var(--apple-label)]">
        {title}
      </h1>
      <p className="apple-body-tracking max-w-xl text-base text-[var(--apple-secondary-label)]">
        {description}
      </p>
    </div>
  );
}
