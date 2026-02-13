type AuthIntroHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  variant: 'desktop' | 'mobile';
};

export function AuthIntroHeading({ eyebrow, title, description, variant }: AuthIntroHeadingProps) {
  const isMobile = variant === 'mobile';

  return (
    <header className={[isMobile ? 'text-center lg:hidden' : 'space-y-3'].join(' ')}>
      {/* Eyebrow */}
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-primary">
        {eyebrow}
      </p>

      {/* Title */}
      <h1
        className={[
          'font-semibold leading-tight text-foreground',
          isMobile ? 'mt-2 text-2xl' : 'text-4xl',
        ].join(' ')}
      >
        {title}
      </h1>

      {/* Description */}
      <p
        className={['text-muted-foreground', isMobile ? 'mt-2 text-sm' : 'max-w-xl text-base'].join(
          ' ',
        )}
      >
        {description}
      </p>
    </header>
  );
}
