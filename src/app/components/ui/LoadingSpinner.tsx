type LoadingSpinnerProps = {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  inline?: boolean;
  className?: string;
};

const sizeClasses: Record<NonNullable<LoadingSpinnerProps['size']>, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
};

export default function LoadingSpinner({
  size = 'md',
  label,
  inline = false,
  className = '',
}: LoadingSpinnerProps) {
  const wrapperClass = inline
    ? `inline-flex items-center gap-2 ${className}`
    : `flex flex-col items-center justify-center gap-3 ${className}`;

  return (
    <div className={wrapperClass}>
      <div
        className={`animate-spin rounded-full border-[var(--hb-muted)] border-t-[var(--hb-primary-strong)] ${sizeClasses[size]}`}
        aria-hidden
      />
      {label ? <span className="text-sm text-[var(--hb-muted)]">{label}</span> : null}
    </div>
  );
}
