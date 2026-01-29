import React from 'react';
import Link, { type LinkProps } from 'next/link';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning';

type BaseProps = {
  children?: React.ReactNode;
  variant?: Variant;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  title?: string;
  ariaLabel?: string;
  iconOnly?: boolean;
};

type LinkButtonProps = BaseProps & {
  href: LinkProps['href'];
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  type?: never;
};

type NativeButtonProps = BaseProps & {
  onClick?: React.ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
  type?: React.ButtonHTMLAttributes<HTMLButtonElement>['type'];
  form?: string;
  href?: never;
};

type ButtonProps = LinkButtonProps | NativeButtonProps;

const variantClasses: Record<Variant, string> = {
  primary: 'bg-[var(--hb-primary-strong)] text-slate-950 hover:brightness-110',
  secondary:
    'border border-[var(--hb-border)] bg-[var(--hb-card)] text-[var(--hb-text)] hover:border-[var(--hb-primary-strong)]/70 hover:text-[var(--hb-headline)]',
  tertiary: 'bg-[var(--hb-panel)] text-[var(--hb-text)] hover:text-[var(--hb-headline)]',
  outline:
    'border border-[var(--hb-border)] text-[var(--hb-text)] hover:border-[var(--hb-primary-strong)]/70 hover:text-[var(--hb-headline)]',
  ghost: 'text-[var(--hb-text)] hover:text-[var(--hb-headline)]',
  danger: 'bg-[var(--hb-accent)] text-[var(--hb-headline)] hover:brightness-110',
  success: 'bg-emerald-500 text-slate-950 hover:bg-emerald-400',
  warning: 'bg-amber-400 text-slate-950 hover:bg-amber-300',
};

const baseClass =
  'inline-flex flex-row items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition';

const isLinkButtonProps = (props: ButtonProps): props is LinkButtonProps =>
  'href' in props && props.href !== undefined;

const Button = (props: ButtonProps) => {
  const { children, variant = 'outline', icon, className, disabled, title, ariaLabel, iconOnly } = props;
  const disabledClass = disabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : '';
  const iconOnlyClass = iconOnly ? 'p-2' : '';
  const classes = [baseClass, variantClasses[variant], disabledClass, iconOnlyClass, className]
    .filter(Boolean)
    .join(' ');
  const accessibleLabel =
    ariaLabel || (typeof children === 'string' ? children : title) || undefined;

  if (isLinkButtonProps(props)) {
    return (
      <Link
        href={props.href}
        className={classes}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : undefined}
        title={title}
        aria-label={accessibleLabel}
        onClick={props.onClick}
      >
        {icon}
        {children && <span>{children}</span>}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? 'button'}
      onClick={props.onClick}
      form={props.form}
      className={classes}
      disabled={disabled}
      title={title}
      aria-label={accessibleLabel}
    >
      {icon}
      {children && <span className="inline-flex flex-row items-center justify-center gap-2">{children}</span>}
    </button>
  );
};

export type ButtonVariant = Variant;
export type { ButtonProps };
export { Button };
export default Button;
