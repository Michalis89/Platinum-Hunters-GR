import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import Link, { type LinkProps } from 'next/link';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--hb-primary-strong)] text-[var(--hb-button-primary-text)] font-semibold shadow hover:brightness-110',
        secondary:
          'border border-[var(--hb-border)] bg-[var(--hb-card)] text-[var(--hb-muted)] shadow-sm hover:border-[var(--hb-primary-strong)] hover:text-[var(--hb-headline)] font-semibold',
        outline:
          'border border-[var(--hb-border)] font-semibold bg-transparent shadow-sm hover:bg-white/5 hover:text-[var(--hb-headline)]',
        ghost:
          'text-[var(--hb-text)] hover:bg-white/5 hover:text-[var(--hb-headline)] font-semibold',
        link: 'text-[var(--hb-primary-strong)] underline-offset-4 hover:underline font-semibold',
        success: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-500 font-semibold',
        warning: 'bg-amber-500 text-black shadow-sm hover:bg-amber-400 font-semibold',
        destructive:
          'bg-[var(--hb-accent)] text-[var(--hb-button-primary-text)] shadow-sm hover:brightness-110 font-semibold',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        xl: 'h-12 text-lg font-bold rounded--md  w-full',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

type ButtonBaseProps = VariantProps<typeof buttonVariants> & {
  asChild?: boolean;
  className?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  iconOnly?: boolean;
  ariaLabel?: string;
};

export type ButtonProps = ButtonBaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href?: LinkProps['href'];
    type?: 'button' | 'submit' | 'reset';
  };

const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      href,
      icon,
      iconOnly,
      ariaLabel,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const classes = cn(buttonVariants({ variant, size, className }), iconOnly && 'p-2');
    const accessibleLabel = ariaLabel || props['aria-label'];

    if (href) {
      return (
        <Link
          href={href}
          className={classes}
          aria-label={accessibleLabel}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : undefined}
          onClick={props.onClick as React.MouseEventHandler<HTMLAnchorElement>}
          ref={ref as React.Ref<HTMLAnchorElement>}
        >
          {icon}
          {children}
        </Link>
      );
    }

    const Comp = asChild ? Slot : 'button';
    const content = asChild
      ? React.Children.toArray(children).find(child => React.isValidElement(child)) ?? null
      : (
          <>
            {icon}
            {children}
          </>
        );
    return (
      <Comp
        className={classes}
        ref={ref as React.Ref<HTMLButtonElement>}
        aria-label={accessibleLabel}
        disabled={disabled}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {content}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
